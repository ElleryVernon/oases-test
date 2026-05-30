export const categories = ["transport", "lodging", "activity", "food"] as const;

export type ActivityCategory = (typeof categories)[number];

export type Member = {
  id: string;
  name: string;
  age: number;
};

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  startTime: string;
  endTime: string;
  location: string;
  unitCostKRW: number;
  perPerson: boolean;
  dmcRecommended: boolean;
  note: string;
  sortOrder: number;
};

export type Day = {
  id: string;
  day: number;
  date: string;
  activities: Activity[];
};

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  perPersonBudgetKRW: number;
  preferences: string;
  notes: string;
};

export type Itinerary = {
  trip: Trip;
  members: Member[];
  days: Day[];
};
