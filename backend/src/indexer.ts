import { ethers, Wallet } from "ethers";
import prismaClient from "./lib/prisma";
import factoryAbi from "./abis/Evolv3Factory.json";
import seriesAbi from "./abis/Evolv3.json";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const factory = new ethers.Contract(
  process.env.FACTORY_ADDRESS!,
  factoryAbi.abi,
  provider
);

factory.on(
  "SeriesCreated",
  async (creator, series, name, symbol, metadataURI) => {
    console.log("📚 New series:", name, symbol, "at", series);
    const user = await prismaClient.user.upsert({
      where: { wallet: creator },
      update: {},
      create: { wallet: creator },
    });

    await listenToSeries(series);
  }
);

async function listenToSeries(seriesAddress: string) {
  const series = new ethers.Contract(seriesAddress, seriesAbi.abi, provider);
  series.on("EntryAdded", async (entryNumber, uri) => {
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

    await prismaClient.userNFT.create({
      data: {
        userId: user.id,
        collectionId: collection.id,
        tokenId: Number(tokenId),
      },
    });
  });
}

async function bootstrap() {
  const seriesList = await prismaClient.collection.findMany();
  for (const s of seriesList) {
    console.log("🔗 Re-attaching listeners for", s.contractAddress);
    await listenToSeries(s.contractAddress);
  }
}

bootstrap();
