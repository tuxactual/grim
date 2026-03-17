import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/types/transaction";

type CreateTransactionInput = {
  type: Transaction["type"];
  merchant: string;
  amountCents: number;
  category: string;
  notes?: string;
  occurredAt?: string;
};

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      type,
      merchant,
      amountCents,
      category,
      notes,
      occurredAt,
    }: CreateTransactionInput) => {
      const timestamp = occurredAt ?? new Date().toISOString();

      return {
        id: `${timestamp}-${merchant}`,
        type,
        merchant: merchant.trim(),
        amountCents,
        category,
        notes: notes ?? "",
        occurredAt: timestamp,
        createdAt: timestamp,
      } satisfies Transaction;
    },
  });

  function insertTransaction(transaction: Transaction) {
    queryClient.setQueryData<Transaction[]>(["transactions"], (current = []) => {
      return [transaction, ...current].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      );
    });
  }

  return {
    ...mutation,
    insertTransaction,
  };
}
