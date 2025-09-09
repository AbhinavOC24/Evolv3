"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreatorStore } from "@/store/useCreatorStore";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWriteContract } from "wagmi";
import Evolv3Factory from "@/lib/abis/Evolv3Factory.json";
import axios from "axios";
import ImageUpload from "@/components/ImageUpload"; // 👈 import your drag/drop uploader

export default function CreatorSeries() {
  const { series, loading, error, fetchSeries } = useCreatorStore();
  const router = useRouter();
  const { writeContract, isPending } = useWriteContract();

  const [open, setOpen] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const createSeries = async () => {
    if (!name || !symbol || !description || !imageFile) {
      toast.error("Please fill all fields and upload an image");
      return;
    }

    try {
      // Step 1: upload cover image
      const imgForm = new FormData();
      imgForm.append("file", imageFile);
      const imgRes = await axios.post("/backend/upload", imgForm, {
        withCredentials: true,
      });
      const coverImageUri = imgRes.data.data.uri;

      // Step 2: upload metadata JSON
      const metadata = {
        name,
        description,
        image: coverImageUri,
        external_url: window.location.origin,
        attributes: [{ trait_type: "Status", value: "Ongoing" }],
      };
      const blob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const formData = new FormData();
      formData.append("file", blob, "series.json");
      const res = await axios.post("/backend/upload", formData, {
        withCredentials: true,
      });

      // Step 3: call factory contract
      const abi = Evolv3Factory.abi;
      const contractCall = writeContract(
        {
          address: `0x${process.env.NEXT_PUBLIC_FACTORY_ADDRESS!}`,
          abi,
          functionName: "createSeries",
          args: [name, symbol, res.data.data.uri, description, coverImageUri],
        },
        {
          onSuccess: () => {
            toast.success("Series created successfully!");
            fetchSeries(); // refresh series list
            setOpen(false);
            setName("");
            setSymbol("");
            setDescription("");
            setImageFile(null);
          },
          onError: (err) => {
            toast.error("Failed to create series", {
              description: err.message,
            });
          },
        }
      );
    } catch (err: any) {
      toast.error("Upload or contract call failed", {
        description: err.message,
      });
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (loading) return <p>Loading series...</p>;

  return (
    <div>
      {/* Create Series Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">Create Series</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Series</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="Series Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <Textarea
              placeholder="Series Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* 👇 Replace plain file input with ImageUpload */}
            <ImageUpload
              onFileSelect={(file) => {
                setImageFile(file);
              }}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={createSeries}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Submitting..." : "Create Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Series Grid */}
      {series.length === 0 && <p>No series found.</p>}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <SeriesCard
            key={s.id}
            image={s.coverImage || "/placeholder.svg"}
            title={s.name}
            creator={s.creatorWallet}
            description={s.description}
            onClick={() => router.push(`/series/${s.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
