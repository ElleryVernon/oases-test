import { prisma } from "@/lib/prisma";
import { seedItinerary } from "@/data/seed-itinerary";
import type { ActivityCategory, Itinerary } from "@/types/itinerary";

const TRIP_ID = seedItinerary.trip.id;

type DbActivity = {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  unitCostKRW: number;
  perPerson: boolean;
  dmcRecommended: boolean;
  note: string;
  sortOrder: number;
};

async function writeItinerary(source: Itinerary) {
  await prisma.$transaction(async (tx) => {
    await tx.trip.deleteMany();

    await tx.trip.create({
      data: {
        id: source.trip.id,
        origin: source.trip.origin,
        destination: source.trip.destination,
        startDate: source.trip.startDate,
        endDate: source.trip.endDate,
        perPersonBudgetKRW: source.trip.perPersonBudgetKRW,
        preferences: source.trip.preferences,
        notes: source.trip.notes,
        members: {
          create: source.members.map((member) => ({
            id: member.id,
            name: member.name,
            age: member.age,
          })),
        },
        days: {
          create: source.days.map((day) => ({
            id: day.id,
            day: day.day,
            date: day.date,
            activities: {
              create: day.activities.map((activity, index) => ({
                id: activity.id,
                title: activity.title,
                category: activity.category,
                startTime: activity.startTime,
                endTime: activity.endTime,
                location: activity.location,
                unitCostKRW: activity.unitCostKRW,
                perPerson: activity.perPerson,
                dmcRecommended: activity.dmcRecommended,
                note: activity.note,
                sortOrder: index,
              })),
            },
          })),
        },
      },
    });
  });

  return getItinerary();
}

async function ensureItinerarySeeded() {
  const trip = await prisma.trip.findFirst({ select: { id: true } });
  if (!trip) await writeItinerary(seedItinerary as Itinerary);
}

export async function resetItinerary() {
  return writeItinerary(seedItinerary as Itinerary);
}

/**
 * Replace the entire itinerary with a caller-provided snapshot.
 * Used by single-step undo — the client posts the previous state back.
 */
export async function restoreItinerary(snapshot: Itinerary) {
  return writeItinerary(snapshot);
}

export async function getItinerary(): Promise<Itinerary> {
  const trip = await prisma.trip.findFirst({
    orderBy: { id: "asc" },
    include: {
      members: { orderBy: { id: "asc" } },
      days: {
        orderBy: { day: "asc" },
        include: {
          activities: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!trip) return resetItinerary();

  return {
    trip: {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      perPersonBudgetKRW: trip.perPersonBudgetKRW,
      preferences: trip.preferences,
      notes: trip.notes,
    },
    members: trip.members.map(({ id, name, age }) => ({ id, name, age })),
    days: trip.days.map((day) => ({
      id: day.id,
      day: day.day,
      date: day.date,
      activities: day.activities.map(toActivity),
    })),
  };
}

export async function updateActivity(
  id: string,
  data: {
    title: string;
    startTime: string;
    endTime: string;
    unitCostKRW: number;
    note: string;
    category?: ActivityCategory;
    location?: string;
    perPerson?: boolean;
  },
) {
  await ensureItinerarySeeded();

  return prisma.activity.update({
    where: { id },
    data,
  });
}

/**
 * Move an activity to a different day (bonus: Day 간 이동).
 * The activity is appended to the end of the target day.
 */
export async function moveActivity(id: string, targetDay: number) {
  await ensureItinerarySeeded();

  const day = await prisma.day.findUnique({
    where: { tripId_day: { tripId: TRIP_ID, day: targetDay } },
    include: { activities: true },
  });

  if (!day) return { ok: false as const, reason: "Day not found" };

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) return { ok: false as const, reason: "Activity not found" };
  if (activity.dayId === day.id) return { ok: true as const };

  const maxOrder = day.activities.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    -1,
  );

  await prisma.activity.update({
    where: { id },
    data: { dayId: day.id, sortOrder: maxOrder + 1 },
  });

  return { ok: true as const };
}

export async function addActivity(dayNumber: number) {
  await ensureItinerarySeeded();

  const day = await prisma.day.findUnique({
    where: { tripId_day: { tripId: seedItinerary.trip.id, day: dayNumber } },
    include: { activities: true },
  });

  if (!day) return null;

  const maxOrder = day.activities.reduce(
    (max, activity) => Math.max(max, activity.sortOrder),
    -1,
  );

  return prisma.activity.create({
    data: {
      id: crypto.randomUUID(),
      title: "새 일정",
      category: "activity",
      startTime: "10:00",
      endTime: "11:00",
      location: "미정",
      unitCostKRW: 0,
      perPerson: false,
      dmcRecommended: false,
      note: "",
      sortOrder: maxOrder + 1,
      dayId: day.id,
    },
  });
}

export async function deleteActivity(id: string) {
  await ensureItinerarySeeded();

  return prisma.activity.delete({ where: { id } });
}

export async function reorderDayActivities(dayNumber: number, orderedIds: string[]) {
  await ensureItinerarySeeded();

  const day = await prisma.day.findUnique({
    where: { tripId_day: { tripId: seedItinerary.trip.id, day: dayNumber } },
    include: { activities: true },
  });

  if (!day) return { ok: false as const, reason: "Day not found" };

  const existingIds = new Set(day.activities.map((activity) => activity.id));
  const hasSameSize = orderedIds.length === existingIds.size;
  const hasAllIds = orderedIds.every((id) => existingIds.has(id));

  if (!hasSameSize || !hasAllIds) {
    return { ok: false as const, reason: "orderedIds must match the day" };
  }

  // Time correction: a day should read top-to-bottom in chronological order.
  // Each position keeps its time slot (the existing times, sorted ascending),
  // so a dragged activity adopts the time appropriate to its new position
  // instead of leaving the day out of order.
  const slots = day.activities
    .map((activity) => ({ startTime: activity.startTime, endTime: activity.endTime }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.activity.update({
        where: { id },
        data: {
          sortOrder: index,
          startTime: slots[index].startTime,
          endTime: slots[index].endTime,
        },
      }),
    ),
  );

  return { ok: true as const };
}

function toActivity(activity: DbActivity) {
  return {
    ...activity,
    category: activity.category as ActivityCategory,
  };
}
