"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
interface SeriesCardProps {
  image: string;
  title: string;
  description: string;
  creator?: string;
  onClick: () => void;
}

export function SeriesCard({
  image,
  title,
  description,
  creator,
  onClick,
}: SeriesCardProps) {
  console.log(image.split("/").pop());
  return (
    <Card className="overflow-hidden p-0 cursor-pointer transition hover:shadow-lg">
      <img
        src={`/api/image-proxy?cid=${image.split("//")[1]}`}
        alt={title}
        className="aspect-video w-full object-cover"
      />
      <CardContent className="p-6 pt-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>

        {creator && (
          <p className="text-sm text-muted-foreground mt-2">
            By <span className="text-accent-foreground">{creator}</span>
          </p>
        )}
        <Button className="w-full" onClick={onClick}>
          Check
        </Button>
      </CardContent>
    </Card>
  );
}
