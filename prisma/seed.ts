import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedItinerary } from "../src/data/seed-itinerary";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.trip.deleteMany();

    await tx.trip.create({
      data: {
        ...seedItinerary.trip,
        members: {
          create: seedItinerary.members.map((member) => ({ ...member })),
        },
        days: {
          create: seedItinerary.days.map((day) => ({
            id: day.id,
            day: day.day,
            date: day.date,
            activities: {
              create: day.activities.map((activity) => ({ ...activity })),
            },
          })),
        },
      },
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded Mini Oases itinerary.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
