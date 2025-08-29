/*
  Warnings:

  - A unique constraint covering the columns `[name,symbol]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Collection_name_key";

-- DropIndex
DROP INDEX "public"."Collection_symbol_key";

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_symbol_key" ON "public"."Collection"("name", "symbol");
