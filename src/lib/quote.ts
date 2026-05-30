import type { ActivityCategory, Day, Itinerary, Member } from "@/types/itinerary";

export type QuoteByCategory = Record<ActivityCategory, number>;

export type Quote = {
  headcountFactor: number;
  byCategory: QuoteByCategory;
  subtotal: number;
  localCareFee: number;
  total: number;
  perPerson: number;
  budgetRemainingPerPerson: number;
};

export function headcountFactor(members: Pick<Member, "age">[]) {
  return members.reduce((sum, member) => sum + (member.age < 12 ? 0.7 : 1), 0);
}

export function subtotalByCategory(
  days: Pick<Day, "activities">[],
  factor: number,
): QuoteByCategory {
  return days.reduce<QuoteByCategory>(
    (acc, day) => {
      for (const activity of day.activities) {
        const cost = activity.unitCostKRW * (activity.perPerson ? factor : 1);
        acc[activity.category] += cost;
      }

      return acc;
    },
    { transport: 0, lodging: 0, activity: 0, food: 0 },
  );
}

export function calcQuote(itinerary: Itinerary): Quote {
  const factor = headcountFactor(itinerary.members);
  const byCategory = subtotalByCategory(itinerary.days, factor);
  const subtotal =
    byCategory.transport +
    byCategory.lodging +
    byCategory.activity +
    byCategory.food;
  const localCareFee = Math.round(subtotal * 0.08);
  const total = subtotal + localCareFee;
  const perPerson = Math.round(total / itinerary.members.length);

  return {
    headcountFactor: factor,
    byCategory,
    subtotal,
    localCareFee,
    total,
    perPerson,
    budgetRemainingPerPerson: itinerary.trip.perPersonBudgetKRW - perPerson,
  };
}
