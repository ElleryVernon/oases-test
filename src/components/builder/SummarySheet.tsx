"use client";

import type { Quote } from "@/lib/quote";
import type { KidFit } from "@/lib/kid-fit";
import type { ActivityCategory, Itinerary } from "@/types/itinerary";
import { Sheet } from "./Sheet";
import { KidFitDetail } from "./KidFitCard";
import { categoryEmoji, categoryLabels, formatKRW } from "./shared";

const rows: ActivityCategory[] = ["transport", "lodging", "activity", "food"];

export function SummarySheet({
  open,
  onClose,
  itinerary,
  quote,
  kidFit,
}: {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  quote: Quote;
  kidFit: KidFit;
}) {
  const remaining = quote.budgetRemainingPerPerson;
  const over = remaining < 0;
  const used = Math.min(quote.perPerson / itinerary.trip.perPersonBudgetKRW, 1);

  return (
    <Sheet open={open} onClose={onClose} title="예상 견적">
      <div className="flex flex-col gap-5 pb-2">
        <section>
          <p className="mb-2.5 text-[12px] font-semibold text-gray-400">카테고리별 비용</p>
          <div className="flex flex-col gap-2.5">
            {rows.map((category) => {
              const value = quote.byCategory[category];
              return (
                <div
                  key={category}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span className="text-gray-500">
                    {categoryEmoji[category]} {categoryLabels[category]}
                  </span>
                  <span
                    className={`tnum font-medium ${value === 0 ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {formatKRW.format(value)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-gray-600">소계</span>
              <span className="text-[15px] font-bold text-gray-900 tnum">
                {formatKRW.format(quote.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">현지 케어 수수료 8%</span>
              <span className="text-[14px] font-medium text-gray-700 tnum">
                {formatKRW.format(quote.localCareFee)}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-gray-900 p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-gray-400">총액</span>
              <span className="text-[26px] font-extrabold tnum leading-none">
                {formatKRW.format(quote.total)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2 text-[13px]">
              <span className="text-gray-400">
                1인당 · 가중 인원 {quote.headcountFactor.toFixed(1)}명
              </span>
              <span className="text-[15px] font-bold text-white tnum">
                {formatKRW.format(quote.perPerson)}
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-gray-500">1인 예산</span>
            <span className="font-medium text-gray-700 tnum">
              {formatKRW.format(itinerary.trip.perPersonBudgetKRW)}
            </span>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${(over ? 1 : used) * 100}%` }}
            />
          </div>
          <p
            className={`mt-2.5 text-[13px] font-semibold ${over ? "text-red-500" : "text-green-600"}`}
          >
            {over
              ? `1인 예산을 ${formatKRW.format(-remaining)} 넘었어요`
              : `1인 예산까지 ${formatKRW.format(remaining)} 남았어요 🎉`}
          </p>
        </section>

        {kidFit.applicable && (
          <div className="border-t border-gray-100 pt-5">
            <KidFitDetail kidFit={kidFit} />
          </div>
        )}
      </div>
    </Sheet>
  );
}
