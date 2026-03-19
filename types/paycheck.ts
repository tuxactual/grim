export type IncomeEntry = {
  id: string;
  source: string;
  amount: number;
  date: string;
  notes: string;
};

export type LiabilityType = "bill" | "pay_in_4" | "credit_card" | "custom_monthly";

export type LiabilityEntry = {
  id: string;
  name: string;
  type: LiabilityType;
};

export type IncomeAllocation = {
  id: string;
  incomeEntryId: string;
  targetEntryId: string;
  amount: number;
};
