"use client";

import { useEffect, useRef, useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { formatDate } from "./shared";

function stripCode(name: string): string {
  return name.replace(/\s*\(.*\)\s*/, "").trim();
}

function nightsBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  if (!ys || !ye) return 0;
  const a = new Date(ys, ms - 1, ds).getTime();
  const b = new Date(ye, me - 1, de).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function TripHero({
  itinerary,
  canUndo,
  onUndo,
  onReset,
  busy,
}: {
  itinerary: Itinerary;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const { trip, members } = itinerary;
  const origin = stripCode(trip.origin);
  const destination = stripCode(trip.destination);
  const nights = nightsBetween(trip.startDate, trip.endDate);

  return (
    <header className="animate-fade">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-semibold text-gray-700">
          ✈️ {origin} <span className="text-gray-400">→</span> {destination}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="더보기"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                fill="currentColor"
                d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
              />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="elev-2 animate-pop absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl bg-white p-1.5"
            >
              <button
                role="menuitem"
                disabled={!canUndo || busy}
                onClick={() => {
                  setMenuOpen(false);
                  onUndo();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                ↩ 되돌리기
              </button>
              <button
                role="menuitem"
                disabled={busy}
                onClick={() => {
                  setMenuOpen(false);
                  onReset();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ⟲ 처음 일정으로
              </button>
            </div>
          )}
        </div>
      </div>

      <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-gray-900">
        {destination} {nights}박 {nights + 1}일 가족여행
      </h1>
      <p className="mt-1.5 text-[14px] text-gray-500">
        {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {members.length}인 가족
      </p>

      <div className="mt-4 flex flex-col gap-2.5 rounded-2xl bg-white p-4 elev-1">
        <MemoRow icon="💛" label="우리 가족이 원하는 것" value={trip.preferences} />
        <div className="h-px bg-gray-100" />
        <MemoRow icon="🔔" label="꼭 기억해 주세요" value={trip.notes} />
      </div>
    </header>
  );
}

function MemoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[16px] leading-6">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-gray-400">{label}</p>
        <p className="mt-0.5 text-[14px] leading-6 text-gray-700">{value}</p>
      </div>
    </div>
  );
}
