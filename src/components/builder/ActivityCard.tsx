"use client";

import { useState } from "react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import type { Activity } from "@/types/itinerary";
import { categoryEmoji, formatKRW } from "./shared";

export function ActivityCard({
  activity,
  onEdit,
  onCommit,
  disabled,
}: {
  activity: Activity;
  onEdit: () => void;
  onCommit: () => void;
  disabled: boolean;
}) {
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);
  const dmc = activity.dmcRecommended;

  return (
    <Reorder.Item
      as="div"
      value={activity}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        onCommit();
      }}
      layout
      transition={{ type: "spring", damping: 30, stiffness: 380 }}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      style={{ position: "relative", zIndex: dragging ? 30 : undefined }}
      className="relative list-none pl-16"
    >
      {/* left rail: start time, then a timeline dot sitting on the day's line */}
      <span className="pointer-events-none absolute left-0 top-[14px] flex h-6 w-11 items-center justify-end text-[12px] font-semibold text-gray-400 tnum">
        {activity.startTime}
      </span>
      <span className="pointer-events-none absolute left-[49px] top-[14px] flex h-6 items-center">
        <span
          className={`h-2.5 w-2.5 rounded-full ring-4 ring-gray-50 ${
            dmc ? "bg-blue-500" : "bg-gray-300"
          }`}
        />
      </span>

      <div
        onClick={onEdit}
        style={
          dragging
            ? { boxShadow: "0 10px 30px -10px rgba(17,24,39,0.28)", borderColor: "transparent" }
            : undefined
        }
        className={`relative cursor-pointer rounded-2xl border bg-white p-3.5 pr-9 transition active:scale-[0.99] ${
          dmc ? "border-blue-100 hover:border-blue-200" : "border-gray-100 hover:border-gray-300"
        }`}
      >
        <div className="flex gap-3">
          <span className="cat-icon">{categoryEmoji[activity.category]}</span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 break-words text-[16px] font-bold leading-snug text-gray-900">
                {activity.title}
              </h3>
              <span
                className={`shrink-0 tnum text-[14px] ${
                  activity.unitCostKRW === 0
                    ? "font-medium text-gray-400"
                    : "font-semibold text-gray-700"
                }`}
              >
                {activity.unitCostKRW === 0
                  ? "무료"
                  : formatKRW.format(activity.unitCostKRW)}
              </span>
            </div>

            <p className="mt-1 text-[13px] text-gray-500">
              {activity.startTime}–{activity.endTime} · {activity.location}
              <span className="text-gray-400"> · {activity.perPerson ? "1인" : "그룹"}</span>
            </p>

            {dmc && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600">
                ★ 전문가 추천
              </span>
            )}

            {activity.note && (
              <p className="mt-2 text-[13px] leading-6 text-gray-500">{activity.note}</p>
            )}
          </div>
        </div>

        {/* drag handle */}
        <button
          type="button"
          aria-label="순서 변경 — 끌어서 옮기기"
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.stopPropagation();
            controls.start(event);
          }}
          className="absolute right-1 top-1/2 flex h-10 w-7 -translate-y-1/2 cursor-grab touch-none items-center justify-center text-gray-300 transition hover:text-gray-500 active:cursor-grabbing disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M9 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
            />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  );
}
