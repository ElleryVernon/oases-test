import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedItinerary } from "@/data/seed-itinerary";
import { calcKidFit } from "@/lib/kid-fit";
import type { Itinerary } from "@/types/itinerary";

describe("kid-fit metric", () => {
  it("applies to families with a child under 12", () => {
    const fit = calcKidFit(seedItinerary as Itinerary);
    assert.equal(fit.applicable, true);
    assert.equal(fit.childCount, 2);
    assert.ok(fit.score >= 0 && fit.score <= 100);
    assert.equal(fit.perDay.length, seedItinerary.days.length);
  });

  it("flags the stroller-unfriendly Dazaifu leg as a warning", () => {
    const fit = calcKidFit(seedItinerary as Itinerary);
    const dazaifu = fit.flags.find(
      (flag) => flag.activityTitle.includes("다자이후") && flag.level === "warn",
    );
    assert.ok(dazaifu, "expected a warning flag for the Dazaifu activity");
  });

  it("is not applicable when everyone is an adult", () => {
    const adultsOnly: Itinerary = {
      ...(seedItinerary as Itinerary),
      members: [{ id: "m1", name: "성인", age: 30 }],
    };
    const fit = calcKidFit(adultsOnly);
    assert.equal(fit.applicable, false);
    assert.equal(fit.score, 100);
  });

  it("is deterministic", () => {
    const a = calcKidFit(seedItinerary as Itinerary);
    const b = calcKidFit(seedItinerary as Itinerary);
    assert.deepEqual(a, b);
  });
});
