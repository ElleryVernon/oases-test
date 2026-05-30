"use client";

import type { KidFit } from "@/lib/kid-fit";

function tone(score: number) {
  if (score >= 80)
    return { text: "text-green-600", bar: "bg-green-500", label: "아이와 다니기 좋아요" };
  if (score >= 60)
    return { text: "text-blue-600", bar: "bg-blue-500", label: "대체로 무난해요" };
  return { text: "text-amber-600", bar: "bg-amber-500", label: "조금 살펴볼까요" };
}

export function KidFitCard({ kidFit, onOpen }: { kidFit: KidFit; onOpen: () => void }) {
  if (!kidFit.applicable) return null;
  const t = tone(kidFit.score);
  const warnCount = kidFit.flags.filter((flag) => flag.level === "warn").length;

  return (
    <button
      onClick={onOpen}
      className="animate-rise w-full rounded-2xl bg-white p-4 text-left transition active:scale-[0.99] elev-1"
    >
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-gray-900">
          👨‍👩‍👧 우리 아이에게 맞는 일정인가요?
        </p>
        <span className={`text-[20px] font-extrabold tnum ${t.text}`}>{kidFit.score}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
          style={{ width: `${kidFit.score}%` }}
        />
      </div>
      <p className="mt-2.5 flex items-center justify-between text-[13px]">
        <span className="text-gray-500">
          {t.label}
          {warnCount > 0 && (
            <span className="text-gray-400"> · 살펴볼 곳 {warnCount}곳</span>
          )}
        </span>
        <span className="font-semibold text-gray-400">자세히 ›</span>
      </p>
    </button>
  );
}

export function KidFitDetail({ kidFit }: { kidFit: KidFit }) {
  if (!kidFit.applicable) return null;
  const t = tone(kidFit.score);
  const warnings = kidFit.flags.filter((flag) => flag.level === "warn");

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[14px] font-bold text-gray-900">어린이 동선 적합도</p>
          <p className="mt-0.5 text-[12px] text-gray-500">
            만 12세 미만 {kidFit.childCount}명 기준 · {t.label}
          </p>
        </div>
        <span className={`text-[22px] font-extrabold tnum ${t.text}`}>{kidFit.score}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${kidFit.score}%` }} />
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {warnings.map((flag, index) => (
            <li
              key={`${flag.day}-${index}`}
              className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-gray-600"
            >
              <span className="shrink-0 font-bold text-amber-600">Day {flag.day}</span>
              <span className="min-w-0">
                {flag.message}
                <span className="text-gray-400"> · {flag.activityTitle}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-green-50 px-3 py-2.5 text-[13px] font-medium text-green-600">
          아이와 다니기에 큰 무리가 없는 일정이에요 😊
        </p>
      )}
    </section>
  );
}
