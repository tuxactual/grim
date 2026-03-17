export type Transaction = {
  id: string;
  type: "expense" | "income";
  merchant: string;
  amountCents: number;
  category: string;
  notes: string;
  occurredAt: string;
  createdAt: string;
};
