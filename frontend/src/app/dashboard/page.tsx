"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import Evolv3Factory from "@/lib/abis/Evolv3Factory.json";
import axios from "axios";
function Dashboard() {
  const { data: hash, writeContract } = useWriteContract();

  const createSeries = async () => {
    toast.success("Logged in", {
      description: "Welcome back to Evolv3!",
    });

    const abi = Evolv3Factory.abi;
    const metadata = {
      name: "ChainSawMAn",
      description: "A dynamic NFT series",
      image: "ipfs://Qmc9Z3tZ6wEHokpiTVicL2W1iYmvferaXg43RBoUUwPv5u",
      external_url: "http://localhost:3000/series/VIS",
      attributes: [{ trait_type: "Status", value: "Ongoing" }],
    };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const formData = new FormData();
    formData.append("file", blob, "series.json");

    const response = await axios.post("/backend/upload", formData, {
      withCredentials: true,
    });
    console.log(response.data.data.uri);
    writeContract({
      address: `0x${process.env.NEXT_PUBLIC_FACTORY_ADDRESS!}`,
      abi,
      functionName: "createSeries",
      args: ["ChainsawMan", "CSM", response.data.data.uri],
    });
  };
  return (
    <div>
      Dashboard
      <Button onClick={createSeries}>Create Series</Button>
    </div>
  );
}

export default Dashboard;
