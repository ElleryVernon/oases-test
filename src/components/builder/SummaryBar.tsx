"use client";

import type { Quote } from "@/lib/quote";
import { formatKRW } from "./shared";

export function SummaryBar({ quote, onOpen }: { quote: Quote; onOpen: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
      <button
        onClick={onOpen}
        className="elev-2 pointer-events-auto mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 rounded-2xl bg-gray-900 px-5 py-3.5 text-white transition active:scale-[0.99]"
      >
        <div className="text-left">
          <p className="text-[11px] font-medium text-gray-400">예상 총액</p>
          <p className="text-[20px] font-bold tnum leading-tight">
            {formatKRW.format(quote.total)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-[11px] text-gray-400">1인당</p>
            <p className="text-[15px] font-bold tnum text-white">
              {formatKRW.format(quote.perPerson)}
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" aria-hidden>
            <path
              fill="currentColor"
              d="M12 8.29 5.71 14.6a1 1 0 0 0 1.41 1.41L12 11.12l4.88 4.89a1 1 0 0 0 1.41-1.41L12 8.29Z"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
