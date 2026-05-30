"use client";

import { useEffect, useRef } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTimeLabel(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h % 12 || 12;
  return `${period} ${hour12}:${pad(m)}`;
}

export function TimeButton({
  value,
  active,
  onClick,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`input flex items-center justify-between text-left ${
        active ? "bg-white ring-2 ring-gray-900" : ""
      }`}
    >
      <span className="tnum">{formatTimeLabel(value)}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    </button>
  );
}

export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [h, m] = value.split(":").map(Number);
  const hour = Number.isNaN(h) ? 0 : h;
  const minute = Number.isNaN(m) ? 0 : m;

  const set = (hh: number, mm: number) => onChange(`${pad(hh)}:${pad(mm)}`);

  return (
    <div className="mt-2 flex gap-2 rounded-xl bg-gray-50 p-2">
      <Column items={HOURS} selected={hour} unit="시" onSelect={(hh) => set(hh, minute)} />
      <span className="self-stretch w-px bg-gray-200" />
      <Column
        items={MINUTES}
        selected={minute}
        unit="분"
        onSelect={(mm) => set(hour, mm)}
      />
    </div>
  );
}

function Column({
  items,
  selected,
  unit,
  onSelect,
}: {
  items: number[];
  selected: number;
  unit: string;
  onSelect: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Center the selected value within THIS column only. scrollIntoView() would
  // also scroll ancestors (the bottom sheet), causing a jump when switching
  // between the start/end pickers — so adjust the column's own scrollTop.
  useEffect(() => {
    const container = ref.current;
    const el = container?.querySelector<HTMLElement>('[data-selected="true"]');
    if (!container || !el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    container.scrollTop +=
      elRect.top - containerRect.top - container.clientHeight / 2 + elRect.height / 2;
  }, []);

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-center text-[11px] font-semibold text-gray-400">{unit}</p>
      <div ref={ref} className="no-scrollbar h-36 overflow-y-auto">
        <div className="flex flex-col gap-1 py-1">
          {items.map((n) => {
            const on = n === selected;
            return (
              <button
                key={n}
                type="button"
                data-selected={on}
                onClick={() => onSelect(n)}
                className={`rounded-lg py-2 text-center text-[15px] font-semibold tnum transition ${
                  on ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pad(n)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
