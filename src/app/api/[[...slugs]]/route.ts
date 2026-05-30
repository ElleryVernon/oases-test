import { app } from "@/server";

// Route every HTTP method through the Elysia app. Elysia speaks the Web
// Standard Request/Response API, so its handler plugs straight into Next.js
// App Router route handlers. Nested under /api so it doesn't collide with the
// root page ("/"); the Elysia app's `prefix: '/api'` matches this segment.
export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
