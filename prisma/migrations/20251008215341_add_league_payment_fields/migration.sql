-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_League" ("createdAt", "endDate", "gameType", "id", "name", "pointsToWin", "rankingMethod", "registrationCloses", "registrationOpens", "startDate", "status", "updatedAt", "winByTwo") SELECT "createdAt", "endDate", "gameType", "id", "name", "pointsToWin", "rankingMethod", "registrationCloses", "registrationOpens", "startDate", "status", "updatedAt", "winByTwo" FROM "League";
DROP TABLE "League";
ALTER TABLE "new_League" RENAME TO "League";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
