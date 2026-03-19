export type IncomeEntry = {
  id: string;
  source: string;
  amount: number;
  date: Date;
  notes?: string;
};

export type LiabilityType = "bill" | "pay_in_4" | "credit_card" | "custom_monthly";

export type LiabilityEntry = {
  id: string;
  name: string;
  type: LiabilityType;
  amount: number;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  linkedExpenseEntryId?: string;
  category?: string;
  source: "expense" | "manual";
};

export type IncomeAllocation = {
  id: string;
  incomeEntryId: string;
  targetEntryId: string;
  amount: number;
};

export type PaycheckState = {
  incomeEntries: IncomeEntry[];
  liabilities: LiabilityEntry[];
  allocations: IncomeAllocation[];
};
