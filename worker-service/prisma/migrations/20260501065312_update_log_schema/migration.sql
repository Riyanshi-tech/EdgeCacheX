/*
  Warnings:

  - You are about to drop the column `status` on the `Log` table. All the data in the column will be lost.
  - Added the required column `ip` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Log" DROP COLUMN "status",
ADD COLUMN     "ip" TEXT NOT NULL;
