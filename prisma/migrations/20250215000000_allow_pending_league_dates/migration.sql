-- Allow leagues to have pending start and end dates
ALTER TABLE "League"
  ALTER COLUMN "startDate" DROP NOT NULL,
  ALTER COLUMN "endDate" DROP NOT NULL;
