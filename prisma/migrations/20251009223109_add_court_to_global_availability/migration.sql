-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GlobalCourtAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "courtId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlobalCourtAvailability_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GlobalCourtAvailability" ("createdAt", "dayOfWeek", "endTime", "id", "isActive", "startTime", "updatedAt") SELECT "createdAt", "dayOfWeek", "endTime", "id", "isActive", "startTime", "updatedAt" FROM "GlobalCourtAvailability";
DROP TABLE "GlobalCourtAvailability";
ALTER TABLE "new_GlobalCourtAvailability" RENAME TO "GlobalCourtAvailability";
CREATE UNIQUE INDEX "GlobalCourtAvailability_dayOfWeek_startTime_courtId_key" ON "GlobalCourtAvailability"("dayOfWeek", "startTime", "courtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
