"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCreatorStore } from "@/store/useCreatorStore";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Evolv3Series from "@/lib/abis/Evolv3.json";
import { useAccount, useWriteContract } from "wagmi";
import axios from "axios";
import ImageUpload from "@/components/ImageUpload";

export default function SeriesDetailsPage() {
  const { id } = useParams();
  const { selectedSeries, fetchSeriesById, loading, error } = useCreatorStore();
  const { writeContract, isPending } = useWriteContract();
  const { address } = useAccount(); // ✅ connected wallet

  // form state for modal
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [mediaUri, setMediaUri] = useState("");
  const [open, setOpen] = useState(false);

  const createSeriesEntry = async () => {
    if (!title || !mediaUri) {
      toast.error("Please provide a title and upload an image");
      return;
    }

    try {
      // Metadata JSON
      const entryMetadata = {
        name: title,
        mediaType: mediaType,
        image: mediaUri,
        external_url: window.location.href,
        attributes: [{ trait_type: "Status", value: "Ongoing" }],
      };

      const blob = new Blob([JSON.stringify(entryMetadata, null, 2)], {
        type: "application/json",
      });
      const formData = new FormData();
      formData.append("file", blob, "entry.json");

      const response = await axios.post("/backend/upload", formData, {
        withCredentials: true,
      });

      const abi = Evolv3Series.abi;

      writeContract(
        {
          address: selectedSeries?.contractAddress as `0x${string}`,
          abi,
          functionName: "addEntry",
          args: [response.data.data.uri, title, mediaType],
        },
        {
          onSuccess: () => {
            toast.success("Entry added successfully!");
            fetchSeriesById(id as string); // refresh
            setTitle("");
            setMediaType("");
            setMediaUri("");
            setOpen(false); // close modal
          },
          onError: (err) => {
            toast.error("Failed to add entry", {
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
    if (id) fetchSeriesById(id as string);
  }, [id, fetchSeriesById]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (loading) return <p>Loading...</p>;
  if (!selectedSeries) return <p>No series found</p>;

  return (
    <div className="space-y-8">
      {/* Series Info */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{selectedSeries.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSeries.coverImage && (
            <img
              src={`/api/image-proxy?cid=${
                selectedSeries.coverImage.split("//")[1]
              }`}
              alt={selectedSeries.name}
              className="w-full max-w-2xs rounded-lg mb-4 object-cover max-h-96"
            />
          )}
          <p>{selectedSeries.description || "No description provided"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-semibold">Contract:</span>{" "}
            {selectedSeries.contractAddress}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold">Creator:</span>{" "}
            {selectedSeries.creatorWallet}
          </p>
        </CardContent>
      </Card>

      {/* Add Entry Dialog — only for creator */}
      {address?.toLowerCase() ===
        selectedSeries.creatorWallet?.toLowerCase() && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">Add New Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Entry</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Input
                placeholder="Entry Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Media type (e.g. image, audio)"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)} // ✅ fixed
              />

              <ImageUpload
                onFileSelect={(file) => {
                  if (file) {
                    const formData = new FormData();
                    formData.append("file", file);
                    axios
                      .post("/backend/upload", formData, {
                        withCredentials: true,
                      })
                      .then((res) => {
                        setMediaUri(res.data.data.uri);
                        toast.success("Image uploaded to IPFS");
                      })
                      .catch((err) => {
                        toast.error("Image upload failed", {
                          description: err.message,
                        });
                      });
                  } else {
                    setMediaUri("");
                  }
                }}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={createSeriesEntry}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Submitting..." : "Add Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Entries Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {selectedSeries.entries?.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle>
                {entry.title || `Entry #${entry.entryIndex}`}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
