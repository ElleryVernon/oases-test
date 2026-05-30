-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "perPersonBudgetKRW" INTEGER NOT NULL,
    "preferences" TEXT NOT NULL,
    "notes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "Member_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "Day_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "unitCostKRW" INTEGER NOT NULL,
    "perPerson" BOOLEAN NOT NULL,
    "dmcRecommended" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "dayId" TEXT NOT NULL,
    CONSTRAINT "Activity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Day_tripId_day_key" ON "Day"("tripId", "day");
