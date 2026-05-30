import { treaty } from "@elysiajs/eden";
import type { App } from "@/server";

// Eden Treaty client — fully typed from the Elysia `App` type.
// Pass an absolute base URL on the server; the browser resolves to origin.
const baseUrl =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
    : window.location.origin;

export const api = treaty<App>(baseUrl).api;
