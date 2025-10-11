-- Create RankingMethod enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RankingMethod') THEN
    CREATE TYPE "RankingMethod" AS ENUM ('BY_WINS', 'BY_POINTS');
  END IF;
END $$;

-- Add rankingMethod column to League table
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "rankingMethod" "RankingMethod" DEFAULT 'BY_WINS';