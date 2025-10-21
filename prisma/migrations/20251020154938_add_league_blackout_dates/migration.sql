-- AlterTable
ALTER TABLE "League" ADD COLUMN     "blackoutDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];
