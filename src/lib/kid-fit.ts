import type { Itinerary } from "@/types/itinerary";

/**
 * 어린이 동선 적합도 (kid-friendliness) — a domain metric (bonus 3.5).
 *
 * Pure, deterministic scoring of how well an itinerary suits a family that
 * travels with young children (만 12세 미만). The score rewards kid-oriented
 * stops and flags friction points (stroller-unfriendly routes, late nights,
 * very long blocks, allergy/spice risks). Same input → same output.
 */

export type KidFitLevel = "warn" | "good";

export type KidFitFlag = {
  day: number;
  activityTitle: string;
  level: KidFitLevel;
  message: string;
};

export type KidFitDay = {
  day: number;
  score: number;
};

export type KidFit = {
  /** Only meaningful when the family includes a child under 12. */
  applicable: boolean;
  childCount: number;
  /** Overall 0–100 score (average of per-day scores). */
  score: number;
  perDay: KidFitDay[];
  flags: KidFitFlag[];
};

const LATE_END_MINUTES = 20 * 60 + 30; // 20:30
const LONG_BLOCK_MINUTES = 4.5 * 60; // 270m

const KID_KEYWORDS = [
  "키즈",
  "어린이",
  "박물관",
  "공원",
  "분수",
  "아동",
  "동물원",
  "놀이",
];
const SPICY_KEYWORDS = ["매운", "매움", "매워", "마라"];
const ALLERGY_KEYWORDS = ["새우", "갑각", "땅콩", "견과", "알레르기"];
const MITIGATION_KEYWORDS = ["빼", "제외", "없", "회피", "요청", " x", "x ", "불가"];
const STROLLER_HARD = ["어려", "곤란", "불가", "힘들", "계단"];

function toMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calcKidFit(itinerary: Itinerary): KidFit {
  const childCount = itinerary.members.filter((member) => member.age < 12).length;
  const flags: KidFitFlag[] = [];

  if (childCount === 0) {
    return {
      applicable: false,
      childCount: 0,
      score: 100,
      perDay: itinerary.days.map((day) => ({ day: day.day, score: 100 })),
      flags,
    };
  }

  const perDay: KidFitDay[] = itinerary.days.map((day) => {
    let score = 100;

    for (const activity of day.activities) {
      const text = `${activity.title} ${activity.note} ${activity.location}`.toLowerCase();
      const start = toMinutes(activity.startTime);
      const end = toMinutes(activity.endTime);

      // Kid-oriented stop — a positive signal.
      if (includesAny(text, KID_KEYWORDS)) {
        score += 6;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "good",
          message: "어린이 친화 코스",
        });
      }

      // Stroller-unfriendly route.
      if (text.includes("유모차") && includesAny(text, STROLLER_HARD)) {
        score -= 10;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "warn",
          message: "유모차 이동이 어려운 구간",
        });
      }

      // Allergy / spice — penalize only when it doesn't look mitigated.
      const hasAllergy = includesAny(text, ALLERGY_KEYWORDS);
      const hasSpicy = includesAny(text, SPICY_KEYWORDS);
      const mitigated = includesAny(text, MITIGATION_KEYWORDS);
      if ((hasAllergy || hasSpicy) && !mitigated) {
        score -= 8;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "warn",
          message: hasAllergy ? "알레르기 주의 식사" : "매운 음식 주의",
        });
      } else if ((hasAllergy || hasSpicy) && mitigated) {
        score += 2;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "good",
          message: "식이 위험 사전 대응 확인",
        });
      }

      // Very long single block tires young children.
      if (start !== null && end !== null && end - start >= LONG_BLOCK_MINUTES) {
        score -= 6;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "warn",
          message: "어린이에게 긴 일정",
        });
      }

      // Late finish past 20:30.
      if (end !== null && end > LATE_END_MINUTES) {
        score -= 5;
        flags.push({
          day: day.day,
          activityTitle: activity.title,
          level: "warn",
          message: "늦은 시간 종료",
        });
      }
    }

    return { day: day.day, score: Math.round(clamp(score)) };
  });

  const score =
    perDay.length === 0
      ? 100
      : Math.round(perDay.reduce((sum, day) => sum + day.score, 0) / perDay.length);

  return { applicable: true, childCount, score, perDay, flags };
}
