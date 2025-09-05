/*
  Warnings:

  - A unique constraint covering the columns `[collectionId,entryIndex]` on the table `Entry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Entry" ALTER COLUMN "mediaType" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Entry_collectionId_entryIndex_key" ON "public"."Entry"("collectionId", "entryIndex");
