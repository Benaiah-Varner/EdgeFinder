/*
  Warnings:

  - You are about to drop the column `greenToRed` on the `trades` table. All the data in the column will be lost.
  - You are about to drop the column `soldTooEarly` on the `trades` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "trades" DROP COLUMN "greenToRed",
DROP COLUMN "soldTooEarly",
ADD COLUMN     "R" INTEGER,
ADD COLUMN     "alignedWithTrend" BOOLEAN,
ADD COLUMN     "followedTpPlan" BOOLEAN,
ADD COLUMN     "properConditions" BOOLEAN,
ADD COLUMN     "properSize" BOOLEAN;
