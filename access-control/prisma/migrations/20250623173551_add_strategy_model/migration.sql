/*
  Warnings:

  - You are about to drop the column `status` on the `trades` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "trades" DROP COLUMN "status",
ADD COLUMN     "strategyId" TEXT;

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
