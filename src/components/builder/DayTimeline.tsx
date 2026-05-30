"use client";

import { useState } from "react";
import { AnimatePresence, Reorder } from "motion/react";
import type { Activity, Day } from "@/types/itinerary";
import { ActivityCard } from "./ActivityCard";
import { formatDate } from "./shared";

export function DayTimeline({
  day,
  index,
  onEdit,
  onAdd,
  onReorderCommit,
  disabled,
}: {
  day: Day;
  index: number;
  onEdit: (activity: Activity, day: number) => void;
  onAdd: (day: number) => void;
  onReorderCommit: (day: number, orderedIds: string[]) => void;
  disabled: boolean;
}) {
  const [items, setItems] = useState<Activity[]>(day.activities);

  // Sync to server truth whenever the itinerary changes (not during a drag),
  // using React's "adjust state during render" pattern instead of an effect.
  const [seen, setSeen] = useState(day.activities);
  if (seen !== day.activities) {
    setSeen(day.activities);
    setItems(day.activities);
  }

  const commit = () => onReorderCommit(day.day, items.map((activity) => activity.id));

  return (
    <section
      className="animate-rise"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <div className="mb-3 flex items-baseline gap-2.5 px-0.5">
        <h2 className="text-[20px] font-bold tracking-tight text-gray-900">Day {day.day}</h2>
        <span className="text-[13px] font-medium text-gray-500">
          {formatDate(day.date, { month: "long", day: "numeric", weekday: "short" })}
        </span>
        <span className="ml-auto text-[13px] text-gray-400">{day.activities.length}개 일정</span>
      </div>

      {day.activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-5 py-7 text-center text-[14px] text-gray-400">
          이 날은 아직 비어 있어요.
          <br />
          가고 싶은 곳을 추가해보세요 ✨
        </div>
      ) : (
        <div className="relative">
          {/* timeline spine connecting the dots, between the time and the cards */}
          <span className="pointer-events-none absolute bottom-4 left-[53px] top-4 w-0.5 bg-gray-200" />
          <Reorder.Group
            as="div"
            axis="y"
            values={items}
            onReorder={setItems}
            className="flex flex-col gap-2.5"
          >
            <AnimatePresence initial={false}>
              {items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  disabled={disabled}
                  onEdit={() => onEdit(activity, day.day)}
                  onCommit={commit}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      <div className="mt-2.5 pl-16">
        <button
          onClick={() => onAdd(day.day)}
          disabled={disabled}
          className="w-full rounded-2xl border border-dashed border-gray-300 py-3 text-[14px] font-semibold text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + 이 날에 일정 추가
        </button>
      </div>
    </section>
  );
}
