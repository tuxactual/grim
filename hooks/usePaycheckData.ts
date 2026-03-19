import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LedgerState, Transaction } from "@/types/transaction";
import type { IncomeAllocation, IncomeEntry, LiabilityEntry, PaycheckState } from "@/types/paycheck";
import { useTransactions } from "@/hooks/useTransactions";
import { getAllocatedAmountForTarget, getAssignedAmount } from "@/utils/paycheck";

const PAYCHECK_STATE_QUERY_KEY = ["paycheck-state"] as const;

const seedIncomeEntries: IncomeEntry[] = [
  {
    id: "income-1",
    source: "Main Paycheck",
    amount: 2100,
    date: new Date("2026-03-15T00:00:00.000Z"),
    notes: "Bi-weekly check",
  },
  {
    id: "income-2",
    source: "Side Gig",
    amount: 450,
    date: new Date("2026-03-17T00:00:00.000Z"),
    notes: "Weekend shift",
  },
];

const seedAllocations: IncomeAllocation[] = [];
const seedManualLiabilities: LiabilityEntry[] = [];

function getDateKey(input: string | Date) {
  const date = new Date(input);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLiabilityAmountCents(liability: LiabilityEntry) {
  return Math.round(liability.amount * 100);
}

function hydrateLiability(
  liability: LiabilityEntry,
  allocations: IncomeAllocation[],
  transactions: Transaction[],
): LiabilityEntry {
  const coveredAmount = getAllocatedAmountForTarget(liability.id, allocations);
  const matchedExpense =
    liability.source === "expense"
      ? transactions.find((transaction) => transaction.id === liability.linkedExpenseEntryId)
      : transactions.find(
          (transaction) =>
            transaction.type === "expense" &&
            Math.abs(transaction.amountCents) === getLiabilityAmountCents(liability) &&
            getDateKey(transaction.occurredAt) === getDateKey(liability.dueDate),
        );
  const completedByAllocation = coveredAmount >= liability.amount;
  const completed = completedByAllocation || Boolean(matchedExpense?.isCompleted);

  return {
    ...liability,
    completed,
    completedAt:
      matchedExpense?.isCompleted ? matchedExpense.completedAt : completedByAllocation ? new Date().toISOString() : undefined,
    linkedExpenseEntryId: matchedExpense?.id ?? liability.linkedExpenseEntryId,
  };
}

function createExpenseLiability(transaction: Transaction): LiabilityEntry | null {
  if (transaction.type !== "expense") {
    return null;
  }

  return {
    id: `liability-expense-${transaction.id}`,
    name: transaction.merchant,
    type: "bill",
    amount: Math.abs(transaction.amountCents) / 100,
    dueDate: transaction.occurredAt,
    completed: transaction.isCompleted,
    completedAt: transaction.completedAt,
    linkedExpenseEntryId: transaction.id,
    category: transaction.category,
    source: "expense",
  };
}

function createMockPaycheckState(ledgerState?: LedgerState): PaycheckState {
  const transactions = ledgerState?.transactions ?? [];
  const derivedLiabilities = transactions
    .map(createExpenseLiability)
    .filter((liability): liability is LiabilityEntry => liability !== null);

  return {
    incomeEntries: seedIncomeEntries,
    allocations: seedAllocations,
    liabilities: derivedLiabilities,
  };
}

export function usePaycheckData() {
  const queryClient = useQueryClient();
  const { data: ledgerState } = useTransactions();
  const query = useQuery<PaycheckState>({
    queryKey: PAYCHECK_STATE_QUERY_KEY,
    queryFn: async () => createMockPaycheckState(ledgerState),
  });

  const data = query.data;
  const incomeEntries = data?.incomeEntries ?? [];
  const storedLiabilities = data?.liabilities ?? [];
  const allocations = data?.allocations ?? [];
  const transactions = ledgerState?.transactions ?? [];

  const liabilities = useMemo(() => {
    const derivedLiabilities = transactions
      .map(createExpenseLiability)
      .filter((liability): liability is LiabilityEntry => liability !== null);
    const manualLiabilities = storedLiabilities.filter((liability) => liability.source === "manual");

    return [...derivedLiabilities, ...manualLiabilities]
      .map((liability) => hydrateLiability(liability, allocations, transactions))
      .sort((left, right) => new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime());
  }, [allocations, storedLiabilities, transactions]);

  const incomeEntryById = useMemo(() => {
    return new Map(incomeEntries.map((incomeEntry) => [incomeEntry.id, incomeEntry]));
  }, [incomeEntries]);

  const liabilityById = useMemo(() => {
    return new Map(liabilities.map((liability) => [liability.id, liability]));
  }, [liabilities]);

  function createAllocation(input: {
    incomeEntryId: string;
    targetEntryId: string;
    amount: number;
  }) {
    const incomeEntry = incomeEntryById.get(input.incomeEntryId);

    if (!incomeEntry || input.amount <= 0) {
      return { wasCreated: false, completedByAllocation: false };
    }

    const assignedAmount = getAssignedAmount(incomeEntry, allocations);
    const remainingAmount = incomeEntry.amount - assignedAmount;

    if (input.amount > remainingAmount) {
      return { wasCreated: false, completedByAllocation: false };
    }

    const targetLiability = liabilityById.get(input.targetEntryId);
    if (!targetLiability) {
      return { wasCreated: false, completedByAllocation: false };
    }

    const created: IncomeAllocation = {
      id: `allocation-${Date.now()}-${input.targetEntryId}`,
      incomeEntryId: input.incomeEntryId,
      targetEntryId: input.targetEntryId,
      amount: input.amount,
    };

    const updatedAllocations = [created, ...allocations];
    const completedByAllocation =
      getAllocatedAmountForTarget(input.targetEntryId, updatedAllocations) >= targetLiability.amount &&
      !targetLiability.completed;

    queryClient.setQueryData<PaycheckState>(PAYCHECK_STATE_QUERY_KEY, (current) => {
      const baseState = current ?? {
        incomeEntries: seedIncomeEntries,
        liabilities: seedManualLiabilities,
        allocations: [],
      };

      return {
        ...baseState,
        allocations: updatedAllocations,
      };
    });

    return {
      wasCreated: true,
      completedByAllocation,
    };
  }

  function createLiability(input: {
    name: string;
    type: LiabilityEntry["type"];
    amount: number;
    dueDate: string;
    category?: string;
  }) {
    const created: LiabilityEntry = {
      id: `liability-manual-${Date.now()}`,
      name: input.name.trim(),
      type: input.type,
      amount: input.amount,
      dueDate: input.dueDate,
      completed: false,
      category: input.category?.trim() || undefined,
      source: "manual",
    };

    queryClient.setQueryData<PaycheckState>(PAYCHECK_STATE_QUERY_KEY, (current) => {
      const baseState = current ?? {
        incomeEntries: seedIncomeEntries,
        liabilities: seedManualLiabilities,
        allocations: [],
      };

      return {
        ...baseState,
        liabilities: [created, ...baseState.liabilities],
      };
    });

    return created;
  }

  return {
    ...query,
    incomeEntries,
    liabilities,
    liabilityById,
    allocations,
    createAllocation,
    createLiability,
  };
}
