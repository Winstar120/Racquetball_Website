/*
  Warnings:

  - Added the required column `number` to the `Court` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GlobalCourtAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Court" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Court" ("id", "isActive", "location", "name") SELECT "id", "isActive", "location", "name" FROM "Court";
DROP TABLE "Court";
ALTER TABLE "new_Court" RENAME TO "Court";
CREATE UNIQUE INDEX "Court_number_key" ON "Court"("number");
CREATE TABLE "new_CourtAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CourtAvailability_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourtAvailability" ("courtId", "dayOfWeek", "endTime", "id", "startTime") SELECT "courtId", "dayOfWeek", "endTime", "id", "startTime" FROM "CourtAvailability";
DROP TABLE "CourtAvailability";
ALTER TABLE "new_CourtAvailability" RENAME TO "CourtAvailability";
CREATE UNIQUE INDEX "CourtAvailability_courtId_dayOfWeek_startTime_key" ON "CourtAvailability"("courtId", "dayOfWeek", "startTime");
CREATE TABLE "new_League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameType" TEXT NOT NULL DEFAULT 'SINGLES',
    "rankingMethod" TEXT NOT NULL DEFAULT 'BY_WINS',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "registrationOpens" DATETIME NOT NULL,
    "registrationCloses" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "pointsToWin" INTEGER NOT NULL DEFAULT 15,
    "winByTwo" BOOLEAN NOT NULL DEFAULT true,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "leagueFee" REAL DEFAULT 0,
    "playersPerMatch" INTEGER NOT NULL DEFAULT 2,
    "matchDuration" INTEGER NOT NULL DEFAULT 45,
    "weeksForCutthroat" INTEGER,
    "scheduleGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_League" ("createdAt", "endDate", "gameType", "id", "isFree", "leagueFee", "name", "pointsToWin", "rankingMethod", "registrationCloses", "registrationOpens", "startDate", "status", "updatedAt", "winByTwo") SELECT "createdAt", "endDate", "gameType", "id", "isFree", "leagueFee", "name", "pointsToWin", "rankingMethod", "registrationCloses", "registrationOpens", "startDate", "status", "updatedAt", "winByTwo" FROM "League";
DROP TABLE "League";
ALTER TABLE "new_League" RENAME TO "League";
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "divisionId" TEXT,
    "weekNumber" INTEGER,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "player3Id" TEXT,
    "player4Id" TEXT,
    "courtId" TEXT,
    "courtNumber" INTEGER,
    "scheduledTime" DATETIME NOT NULL,
    "actualTime" DATETIME,
    "isMakeup" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "winnerId" TEXT,
    "player1Confirmed" BOOLEAN NOT NULL DEFAULT false,
    "player2Confirmed" BOOLEAN NOT NULL DEFAULT false,
    "scoreReportedBy" TEXT,
    "scoreReportedAt" DATETIME,
    "scoreDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("actualTime", "courtId", "createdAt", "disputeReason", "divisionId", "id", "leagueId", "notes", "player1Confirmed", "player1Id", "player2Confirmed", "player2Id", "player3Id", "player4Id", "scheduledTime", "scoreDisputed", "scoreReportedAt", "scoreReportedBy", "status", "updatedAt", "winnerId") SELECT "actualTime", "courtId", "createdAt", "disputeReason", "divisionId", "id", "leagueId", "notes", "player1Confirmed", "player1Id", "player2Confirmed", "player2Id", "player3Id", "player4Id", "scheduledTime", "scoreDisputed", "scoreReportedAt", "scoreReportedBy", "status", "updatedAt", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GlobalCourtAvailability_dayOfWeek_startTime_key" ON "GlobalCourtAvailability"("dayOfWeek", "startTime");
