-- Add game type and rules to League
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "gameType" TEXT DEFAULT 'SINGLES';
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "pointsToWin" INTEGER DEFAULT 15;
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "winByTwo" BOOLEAN DEFAULT true;

-- Add additional player fields to Match for doubles and cut-throat
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "player3Id" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "player4Id" TEXT;

-- Add score confirmation fields
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "player1Confirmed" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "player2Confirmed" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "scoreReportedBy" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "scoreReportedAt" TIMESTAMP;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "scoreDisputed" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "disputeReason" TEXT;

-- Remove old score columns if they exist
ALTER TABLE "Match" DROP COLUMN IF EXISTS "player1Score";
ALTER TABLE "Match" DROP COLUMN IF EXISTS "player2Score";

-- Create Game table for detailed score tracking
CREATE TABLE IF NOT EXISTS "Game" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "gameNumber" INTEGER NOT NULL,
  "player1Score" INTEGER NOT NULL,
  "player2Score" INTEGER NOT NULL,
  "player3Score" INTEGER,
  "winnerId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE,
  UNIQUE("matchId", "gameNumber")
);

-- Add foreign key constraints for additional players
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "User"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "Match_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES "User"("id") ON DELETE SET NULL;

-- Create GameType enum values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GameType') THEN
    CREATE TYPE "GameType" AS ENUM ('SINGLES', 'DOUBLES', 'CUTTHROAT');
  END IF;
END $$;

-- Update League gameType to use enum
ALTER TABLE "League" ALTER COLUMN "gameType" TYPE "GameType" USING "gameType"::"GameType";