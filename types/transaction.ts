export type Transaction = {
  id: string;
  type: "expense" | "income";
  merchant: string;
  amountCents: number;
  category: string;
  notes: string;
  occurredAt: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt?: string;
  carriedForwardFromId?: string;
  linkedLiabilityId?: string;
  pageId: string;
  originMonthKey: string;
};

export type ExpensePage = {
  id: string;
  type: "expenses";
  title: string;
  createdAt: string;
  originMonthKey: string;
};

export type LedgerState = {
  pages: ExpensePage[];
  transactions: Transaction[];
};
