import express, { Request, Response } from "express";
import cors from "cors";
import prismaClient from "./lib/prisma";
import dotenv from "dotenv";
import multer from "multer";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import AWS from "aws-sdk";
import { ethers } from "ethers";
import { checkAuth } from "./middleware/checkAuth";
import { SiweMessage } from "siwe";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(express.json());
app.set("trust proxy", 1);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.FOO_COOKIE_SECRET || "123123123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
    },
  })
);

const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.FILEBASE_ACCESSKEY!,
  secretAccessKey: process.env.FILEBASE_SECRET!,
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  s3ForcePathStyle: true,
});

app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Listening on PORT ${process.env.BACKEND_PORT}`);
});

// ------------------ ROUTES ------------------

// Upload file
app.post("/upload", upload.single("file"), checkAuth, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const params = {
      Bucket: process.env.FILEBASE_BUCKET as string,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const request = s3.putObject(params);
    request.on("httpHeaders", (statusCode, headers) => {
      const cid = headers["x-amz-meta-cid"] || headers["x-amz-meta-ipfs-hash"];
      if (cid) {
        return res.status(200).json({
          success: true,
          message: "File uploaded successfully",
          data: {
            cid,
            uri: `ipfs://${cid}`,
            gatewayUrl: `https://ipfs.filebase.io/ipfs/${cid}`,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "CID not returned by Filebase",
        });
      }
    });
    request.send();
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

// Get nonce
app.get("/getNonce", async (req: Request, res: Response) => {
  try {
    const nonce = crypto.randomBytes(16).toString("hex");

    req.session.nonce = nonce;

    console.log("Logging from /gerNonce");
    return res.status(200).json({
      success: true,
      message: "Nonce generated successfully",
      data: { nonce },
    });
  } catch (error) {
    console.error("Error while generating Nonce", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify signature
app.post("/verifySign", async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;
    const nonce = req.session.nonce;

    if (!nonce) {
      return res.status(400).json({
        success: false,
        message: "No nonce in session",
      });
    }

    // Parse SIWE message
    const siweMessage = new SiweMessage(message);

    // Ensure nonce matches what we issued
    if (siweMessage.nonce !== nonce) {
      return res.status(400).json({
        success: false,
        message: "Invalid nonce",
      });
    }

    // Verify signature
    const recoveredAddress = await siweMessage.verify({ signature });

    if (!recoveredAddress.success) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Clear used nonce
    delete req.session.nonce;

    // Upsert user in DB
    const user = await prismaClient.user.upsert({
      where: { wallet: siweMessage.address },
      update: {},
      create: { wallet: siweMessage.address },
    });

    req.session.userId = user.id;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { address: siweMessage.address, user },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        success: false,
        message: "Not logged in",
      });
    }
    console.log("HIT /me");
    const user = await prismaClient.user.findUnique({
      where: { id: req.session.userId },
    });

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create series
app.post("/createSeries", checkAuth, async (req: Request, res: Response) => {
  try {
    const { contractAddress, name, symbol, metadataURI, coverImage } = req.body;
    const creatorId = req.session.userId;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const duplicate = await prismaClient.collection.findUnique({
      where: {
        name_symbol: { name, symbol },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          "A collection with this name and symbol already exists. Please choose different values.",
      });
    }

    const series = await prismaClient.collection.create({
      data: {
        contractAddress,
        name,
        symbol,
        metadataURI,
        coverImage,
        creator: { connect: { id: creatorId } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Series created successfully",
      data: series,
    });
  } catch (error) {
    console.error("CreateSeries error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.post("/populateEntry", checkAuth, async (req: Request, res: Response) => {
  try {
    const { seriesAddress, entryIndex, mediaType, title, description } =
      req.body;

    if (!seriesAddress || entryIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing seriesAddress or entryIndex",
      });
    }
    const collection = await prismaClient.collection.findUnique({
      where: { contractAddress: seriesAddress },
    });

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Collection not found" });
    }

    // update the entry
    const entry = await prismaClient.entry.update({
      where: {
        collectionId_entryIndex: {
          collectionId: collection.id,
          entryIndex: Number(entryIndex),
        },
      },
      data: {
        mediaType,
        title,
        description,
      },
    });

    return res.json({ success: true, data: entry });
  } catch (error) {
    console.error("populateEntry error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

app.post("/logout", (req, res) => {
  console.log("Claering user");
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to logout" });
    }
    res.clearCookie("connect.sid"); // or whatever your session cookie is called
    return res.json({ success: true, message: "Logged out" });
  });
});
