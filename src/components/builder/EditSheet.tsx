"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories } from "@/types/itinerary";
import { Sheet } from "./Sheet";
import { TimeButton, TimePicker } from "./TimeField";
import { categoryEmoji, categoryLabels, type ActivityForm } from "./shared";

export function EditSheet({
  form,
  days,
  saving,
  onChange,
  onSubmit,
  onDelete,
  onClose,
}: {
  form: ActivityForm | null;
  days: number[];
  saving: boolean;
  onChange: (form: ActivityForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [timeOpen, setTimeOpen] = useState<null | "start" | "end">(null);

  // Collapse the time picker whenever a different activity opens.
  const [seenId, setSeenId] = useState(form?.id ?? null);
  if ((form?.id ?? null) !== seenId) {
    setSeenId(form?.id ?? null);
    setTimeOpen(null);
  }

  return (
    <Sheet
      open={form !== null}
      onClose={onClose}
      title="일정 편집"
      footer={
        form && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              aria-label="삭제"
              title="삭제"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  fill="currentColor"
                  d="M9 3a1 1 0 0 0-1 1v1H4.5a1 1 0 1 0 0 2H5l.84 12.07A2 2 0 0 0 7.83 21h8.34a2 2 0 0 0 1.99-1.93L19 7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v.99h-4V5Zm-.2 5a.8.8 0 0 1 1.6 0v6a.8.8 0 0 1-1.6 0v-6Zm3.8-.8a.8.8 0 0 0-.8.8v6a.8.8 0 0 0 1.6 0v-6a.8.8 0 0 0-.8-.8Z"
                />
              </svg>
            </button>
            <button
              type="submit"
              form="edit-activity-form"
              disabled={saving}
              className="btn-primary flex-1 py-3.5"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        )
      }
    >
      {form && (
        <form id="edit-activity-form" onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="무엇을 하나요?">
            <input
              value={form.title}
              maxLength={80}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
              className="input"
              required
              autoFocus
            />
          </Field>

          <Field label="종류">
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => {
                const on = form.category === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onChange({ ...form, category })}
                    className={`rounded-xl py-2.5 text-center transition active:scale-[0.97] ${
                      on ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span className="block text-[18px]">{categoryEmoji[category]}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold">
                      {categoryLabels[category]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="시작">
                <TimeButton
                  value={form.startTime}
                  active={timeOpen === "start"}
                  onClick={() => setTimeOpen((open) => (open === "start" ? null : "start"))}
                />
              </Field>
              <Field label="종료">
                <TimeButton
                  value={form.endTime}
                  active={timeOpen === "end"}
                  onClick={() => setTimeOpen((open) => (open === "end" ? null : "end"))}
                />
              </Field>
            </div>
            <AnimatePresence initial={false}>
              {timeOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <TimePicker
                    key={timeOpen}
                    value={timeOpen === "start" ? form.startTime : form.endTime}
                    onChange={(value) =>
                      onChange({
                        ...form,
                        [timeOpen === "start" ? "startTime" : "endTime"]: value,
                      })
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Field label="어디서?">
            <input
              value={form.location}
              maxLength={120}
              onChange={(event) => onChange({ ...form, location: event.target.value })}
              className="input"
            />
          </Field>

          <Field label="비용 (원)">
            <input
              type="number"
              min={0}
              max={10000000}
              value={form.unitCostKRW}
              onChange={(event) =>
                onChange({ ...form, unitCostKRW: Number(event.target.value) })
              }
              className="input"
              required
            />
          </Field>

          <Field label="옮길 날">
            <DayStrip
              days={days}
              value={form.day}
              onSelect={(day) => onChange({ ...form, day })}
            />
          </Field>

          <button
            type="button"
            onClick={() => onChange({ ...form, perPerson: !form.perPerson })}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left"
          >
            <span className="text-[14px] font-semibold text-gray-700">
              한 사람씩 드는 비용
              <span className="mt-0.5 block text-[12px] font-normal text-gray-400">
                끄면 가족 전체에 한 번만 더해요
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                form.perPerson ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  form.perPerson ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <Field label="메모">
            <textarea
              value={form.note}
              maxLength={500}
              onChange={(event) => onChange({ ...form, note: event.target.value })}
              className="input min-h-20 resize-y"
              placeholder="예약 정보, 주의사항 등을 남겨두세요"
            />
          </Field>
        </form>
      )}
    </Sheet>
  );
}

// Horizontally scrollable day strip — stays a single tidy row no matter how
// many days the trip has, and centers the current day on open.
function DayStrip({
  days,
  value,
  onSelect,
}: {
  days: number[];
  value: number;
  onSelect: (day: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.querySelector('[data-on="true"]');
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  return (
    <div
      ref={ref}
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto scroll-px-1 px-1 pb-0.5"
    >
      {days.map((day) => {
        const on = value === day;
        return (
          <button
            key={day}
            type="button"
            data-on={on}
            onClick={() => onSelect(day)}
            className={`shrink-0 snap-start rounded-xl px-4 py-2 text-[14px] font-semibold transition active:scale-[0.97] ${
              on ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Day {day}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-gray-600">
      {label}
      {children}
    </label>
  );
}
