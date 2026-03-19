export type LiabilityKind = "standard" | "term" | "pay_in_4";
export type PaycheckSlot = "current" | "next" | "following" | "archived";

export type Category = {
  id: string;
  name: string;
  isPreset: boolean;
  type: "liability" | "expense";
};

export type Liability = {
  id: string;
  item: string;
  amount: number;
  dueDate: string;
  categoryId?: string;
  categoryName: string;
  kind: LiabilityKind;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  totalTermAmount?: number;
  installmentAmount?: number;
  paymentsRemaining?: number;
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type Paycheck = {
  id: string;
  label: string;
  amount: number;
  date: string;
  slot: PaycheckSlot;
  createdAt: string;
  updatedAt: string;
};

export type PaycheckAllocation = {
  id: string;
  paycheckId: string;
  liabilityId: string;
  amount: number;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  item: string;
  amount: number;
  date: string;
  categoryId?: string;
  categoryName: string;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetState = {
  liabilities: Liability[];
  paychecks: Paycheck[];
  allocations: PaycheckAllocation[];
  expenses: Expense[];
  categories: Category[];
};
