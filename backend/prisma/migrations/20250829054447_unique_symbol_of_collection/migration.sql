/*
  Warnings:

  - A unique constraint covering the columns `[symbol]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Collection_symbol_key" ON "public"."Collection"("symbol");
