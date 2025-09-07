import { ethers, Wallet } from "ethers";
import prismaClient from "./lib/prisma";
import factoryAbi from "./abis/Evolv3Factory.json";
import seriesAbi from "./abis/Evolv3.json";
import dotenv from "dotenv";
import path from "path";
import { createParam } from "@prisma/client/runtime/library";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("RPC_URL:", process.env.RPC_URL);
console.log("FACTORY_ADDRESS:", process.env.FACTORY_ADDRESS);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const factory = new ethers.Contract(
  process.env.FACTORY_ADDRESS!,
  factoryAbi.abi,
  provider
);

factory.on(
  "SeriesCreated",
  async (creator, series, name, symbol, metadataURI) => {
    try {
      console.log(
        "📚 New series:",
        name,
        symbol,
        "at",
        series,
        "by",
        creator,
        "metadata",
        metadataURI
      );

      const user = await prismaClient.user.upsert({
        where: { wallet: creator },
        update: {},
        create: { wallet: creator },
      });

      const existing = await prismaClient.collection.findUnique({
        where: { contractAddress: series },
      });
      if (!existing) {
        await prismaClient.collection.create({
          data: {
            contractAddress: series,
            creatorId: user.id,
            name,
            symbol,
            metadataURI,
          },
        });
      } else {
        if (
          existing.name !== name ||
          existing.symbol !== symbol ||
          existing.metadataURI !== metadataURI
        ) {
          console.warn(`⚠️ Mismatch for ${series}: 
            DB = { name: ${existing.name}, symbol: ${existing.symbol}, metadataURI: ${existing.metadataURI} }
            Chain = { name: ${name}, symbol: ${symbol}, metadataURI: ${metadataURI} }`);
        }
      }
      await listenToSeries(series);
    } catch (error) {
      console.error("Error handling SeriesCreated:", error);
    }
  }
);

async function listenToSeries(seriesAddress: string) {
  try {
    const series = new ethers.Contract(seriesAddress, seriesAbi.abi, provider);
    series.on("EntryAdded", async (entryNumber, uri, title, description) => {
      console.log("✏️ New entry:", entryNumber.toString(), uri);

      const collection = await prismaClient.collection.findUnique({
        where: { contractAddress: seriesAddress },
      });
      if (!collection) {
        console.log("No such series exist");
        return;
      }

      await prismaClient.entry.upsert({
        where: {
          collectionId_entryIndex: {
            collectionId: collection.id,
            entryIndex: Number(entryNumber),
          },
        },
        update: {
          cid: uri,
          mediaType: "unknown",
        },
        create: {
          collectionId: collection.id,
          entryIndex: Number(entryNumber),
          cid: uri,
          title,
          description,
          mediaType: "unknown",
        },
      });
    });

    series.on("Minted", async (to, tokenId) => {
      console.log("🎉 Minted:", tokenId.toString(), "to", to);

      const collection = await prismaClient.collection.findUnique({
        where: { contractAddress: seriesAddress },
      });
      if (!collection) return;

      const user = await prismaClient.user.upsert({
        where: { wallet: to },
        update: {},
        create: { wallet: to },
      });

      await prismaClient.userNFT.upsert({
        where: {
          collectionId_tokenId: {
            collectionId: collection.id,
            tokenId: Number(tokenId),
          },
        },
        update: {},
        create: {
          userId: user.id,
          collectionId: collection.id,
          tokenId: Number(tokenId),
        },
      });
    });
  } catch (error) {
    console.log("Error from series listener", error);
  }
}

async function bootstrap() {
  const seriesList = await prismaClient.collection.findMany();
  for (const s of seriesList) {
    console.log("🔗 Re-attaching listeners for", s.contractAddress);
    await listenToSeries(s.contractAddress);
  }
}

bootstrap();
