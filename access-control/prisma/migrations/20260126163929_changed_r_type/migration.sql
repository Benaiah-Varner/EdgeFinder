/*
  Warnings:

  - You are about to alter the column `R` on the `trades` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "trades" ALTER COLUMN "R" SET DATA TYPE DECIMAL(10,4);
