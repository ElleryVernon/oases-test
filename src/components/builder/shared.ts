import type { Activity, ActivityCategory } from "@/types/itinerary";

export const actionHeader = "itinerary-builder";

export const categoryLabels: Record<ActivityCategory, string> = {
  transport: "이동",
  lodging: "숙소",
  activity: "액티비티",
  food: "식사",
};

export const categoryEmoji: Record<ActivityCategory, string> = {
  transport: "🚌",
  lodging: "🏨",
  activity: "🎡",
  food: "🍽️",
};

export type ActivityForm = {
  id: string;
  title: string;
  category: ActivityCategory;
  startTime: string;
  endTime: string;
  location: string;
  unitCostKRW: number;
  perPerson: boolean;
  note: string;
  day: number;
};

export type Toast = {
  id: number;
  message: string;
  tone: "info" | "error";
  action?: { label: string; run: () => void };
};

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  resolve: (value: boolean) => void;
};

export function toForm(activity: Activity, day: number): ActivityForm {
  return {
    id: activity.id,
    title: activity.title,
    category: activity.category,
    startTime: activity.startTime,
    endTime: activity.endTime,
    location: activity.location,
    unitCostKRW: activity.unitCostKRW,
    perPerson: activity.perPerson,
    note: activity.note,
    day,
  };
}

export const formatKRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

/** "2026-05-02" → "5월 2일 (금)" (and variants) without timezone drift. */
export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", weekday: "short" },
): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("ko-KR", opts).format(new Date(y, m - 1, d));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);

  if (method !== "GET") {
    headers.set("content-type", "application/json");
    headers.set("x-oases-action", actionHeader);
  }

  const response = await fetch(path, { ...init, method, headers, cache: "no-store" });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `요청에 실패했습니다 (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
