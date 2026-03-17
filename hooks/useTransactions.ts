import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/types/transaction";

function createTransaction(
  id: string,
  type: Transaction["type"],
  merchant: string,
  amountCents: number,
  category: string,
  date: Date,
  hours: number,
  minutes: number,
) {
  const occurredAt = new Date(date);
  occurredAt.setHours(hours, minutes, 0, 0);

  return {
    id,
    type,
    merchant,
    amountCents,
    category,
    notes: "",
    occurredAt: occurredAt.toISOString(),
    createdAt: occurredAt.toISOString(),
  } satisfies Transaction;
}

function createMockTransactions() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const earlier = new Date(today);
  earlier.setDate(today.getDate() - 3);

  return [
    createTransaction("1", "expense", "Coffee", -450, "Food", today, 8, 25),
    createTransaction("2", "expense", "Uber", -1820, "Transport", today, 9, 40),
    createTransaction("3", "expense", "Groceries", -4290, "Food", yesterday, 18, 10),
    createTransaction("4", "expense", "Lunch", -1200, "Food", earlier, 12, 15),
    createTransaction("5", "income", "Paycheck", 150000, "Paycheck", earlier, 7, 30),
  ].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      return createMockTransactions();
    },
  });
}
