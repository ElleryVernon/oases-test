import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedItinerary } from "@/data/seed-itinerary";
import { calcQuote, headcountFactor, subtotalByCategory } from "@/lib/quote";

describe("quote calculator", () => {
  it("applies child weighting", () => {
    assert.equal(Math.round(headcountFactor(seedItinerary.members) * 10) / 10, 3.4);
  });

  it("calculates category subtotals with per-person and group costs", () => {
    const byCategory = subtotalByCategory(seedItinerary.days, 3.4);

    assert.equal(Math.round(byCategory.transport), 1509600);
    assert.equal(byCategory.lodging, 0);
    assert.equal(Math.round(byCategory.activity), 324000);
    assert.equal(Math.round(byCategory.food), 425000);
  });

  it("matches the coding-test quote checkpoint", () => {
    const quote = calcQuote(seedItinerary);

    assert.equal(Math.round(quote.subtotal), 2258600);
    assert.equal(quote.localCareFee, 180688);
    assert.equal(Math.round(quote.total), 2439288);
    assert.equal(quote.perPerson, 609822);
    assert.ok(quote.total > 2439000 * 0.99 && quote.total < 2439000 * 1.01);
  });
});
