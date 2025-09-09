/*
  Warnings:

  - You are about to drop the column `description` on the `Entry` table. All the data in the column will be lost.
  - Added the required column `description` to the `Collection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Collection" ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Entry" DROP COLUMN "description";
