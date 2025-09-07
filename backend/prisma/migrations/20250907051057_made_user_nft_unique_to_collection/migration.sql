/*
  Warnings:

  - A unique constraint covering the columns `[collectionId,tokenId]` on the table `UserNFT` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserNFT_collectionId_tokenId_key" ON "public"."UserNFT"("collectionId", "tokenId");
