import { Elysia, t } from "elysia";
import {
  addActivity,
  deleteActivity,
  getItinerary,
  moveActivity,
  reorderDayActivities,
  resetItinerary,
  restoreItinerary,
  updateActivity,
} from "@/lib/itinerary-store";
import { categories } from "@/types/itinerary";

const actionHeader = "itinerary-builder";
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const rateLimitWindowMs = 60_000;
const rateLimitMax = 80;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const idSchema = t.String({ minLength: 1, maxLength: 80, pattern: "^[\\w-]+$" });
const timeSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
});
const categorySchema = t.Union(categories.map((category) => t.Literal(category)));
const dayNumberSchema = t.Number({ minimum: 1, maximum: 31 });
const costSchema = t.Number({ minimum: 0, maximum: 10_000_000 });

const activityPatchBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 80 }),
  startTime: timeSchema,
  endTime: timeSchema,
  unitCostKRW: costSchema,
  note: t.String({ maxLength: 500 }),
  category: t.Optional(categorySchema),
  location: t.Optional(t.String({ maxLength: 120 })),
  perPerson: t.Optional(t.Boolean()),
});

// Full-itinerary schema used by the undo/restore endpoint. Validating the
// entire snapshot keeps the unauthenticated write surface tight.
const restoreBody = t.Object({
  trip: t.Object({
    id: idSchema,
    origin: t.String({ minLength: 1, maxLength: 80 }),
    destination: t.String({ minLength: 1, maxLength: 80 }),
    startDate: t.String({ maxLength: 20 }),
    endDate: t.String({ maxLength: 20 }),
    perPersonBudgetKRW: costSchema,
    preferences: t.String({ maxLength: 500 }),
    notes: t.String({ maxLength: 500 }),
  }),
  members: t.Array(
    t.Object({
      id: idSchema,
      name: t.String({ minLength: 1, maxLength: 40 }),
      age: t.Number({ minimum: 0, maximum: 120 }),
    }),
    { minItems: 1, maxItems: 12 },
  ),
  days: t.Array(
    t.Object({
      id: idSchema,
      day: dayNumberSchema,
      date: t.String({ maxLength: 20 }),
      activities: t.Array(
        t.Object({
          id: idSchema,
          title: t.String({ minLength: 1, maxLength: 80 }),
          category: categorySchema,
          startTime: timeSchema,
          endTime: timeSchema,
          location: t.String({ maxLength: 120 }),
          unitCostKRW: costSchema,
          perPerson: t.Boolean(),
          dmcRecommended: t.Boolean(),
          note: t.String({ maxLength: 500 }),
          sortOrder: t.Number({ minimum: 0, maximum: 1000 }),
        }),
        { maxItems: 60 },
      ),
    }),
    { minItems: 1, maxItems: 31 },
  ),
});

export const app = new Elysia({ prefix: "/api" })
  .onBeforeHandle(({ request, status }) => {
    if (!mutatingMethods.has(request.method)) return;

    const now = Date.now();
    const key = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > rateLimitMax) {
        return status(429, { error: "Too many requests" });
      }
    }

    const expectedOrigin = new URL(request.url).origin;
    const origin = request.headers.get("origin");
    const action = request.headers.get("x-oases-action");

    if (origin !== expectedOrigin || action !== actionHeader) {
      return status(403, { error: "Forbidden" });
    }
  })
  .get("/", () => ({ ok: true, service: "Mini Oases API" }))
  .get("/itinerary", () => getItinerary())
  .patch(
    "/activities/:id",
    async ({ params, body, status }) => {
      try {
        await updateActivity(params.id, body);
        return getItinerary();
      } catch {
        return status(404, { error: "Activity not found" });
      }
    },
    {
      params: t.Object({ id: idSchema }),
      body: activityPatchBody,
    },
  )
  .patch(
    "/activities/:id/move",
    async ({ params, body, status }) => {
      const result = await moveActivity(params.id, body.day);
      if (!result.ok) return status(404, { error: result.reason });
      return getItinerary();
    },
    {
      params: t.Object({ id: idSchema }),
      body: t.Object({ day: dayNumberSchema }),
    },
  )
  .post(
    "/days/:day/activities",
    async ({ params, status }) => {
      const activity = await addActivity(params.day);
      if (!activity) return status(404, { error: "Day not found" });
      return getItinerary();
    },
    {
      params: t.Object({ day: dayNumberSchema }),
    },
  )
  .delete(
    "/activities/:id",
    async ({ params, status }) => {
      try {
        await deleteActivity(params.id);
        return getItinerary();
      } catch {
        return status(404, { error: "Activity not found" });
      }
    },
    {
      params: t.Object({ id: idSchema }),
    },
  )
  .patch(
    "/days/:day/activities/reorder",
    async ({ params, body, status }) => {
      const result = await reorderDayActivities(params.day, body.orderedIds);
      if (!result.ok) return status(400, { error: result.reason });
      return getItinerary();
    },
    {
      params: t.Object({ day: dayNumberSchema }),
      body: t.Object({
        orderedIds: t.Array(idSchema, { minItems: 1, maxItems: 60 }),
      }),
    },
  )
  .put("/itinerary", async ({ body }) => restoreItinerary(body), {
    body: restoreBody,
  })
  .post("/itinerary/reset", () => resetItinerary());

export type App = typeof app;
