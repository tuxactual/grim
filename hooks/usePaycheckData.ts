import { useMemo, useState } from "react";
import type { IncomeAllocation, IncomeEntry, LiabilityEntry } from "@/types/paycheck";

const seedIncomeEntries: IncomeEntry[] = [
  {
    id: "income-1",
    source: "Main Paycheck",
    amount: 2100,
    date: "2026-03-15",
    notes: "Bi-weekly check",
  },
  {
    id: "income-2",
    source: "Side Gig",
    amount: 450,
    date: "2026-03-17",
    notes: "Weekend shift",
  },
];

const seedLiabilities: LiabilityEntry[] = [
  { id: "liability-rent", name: "Rent", type: "bill" },
  { id: "liability-amex", name: "Amex", type: "credit_card" },
  { id: "liability-affirm", name: "Affirm", type: "pay_in_4" },
  { id: "liability-gym", name: "Gym", type: "custom_monthly" },
];

const seedAllocations: IncomeAllocation[] = [
  {
    id: "allocation-1",
    incomeEntryId: "income-1",
    targetEntryId: "liability-rent",
    amount: 900,
  },
  {
    id: "allocation-2",
    incomeEntryId: "income-1",
    targetEntryId: "liability-amex",
    amount: 200,
  },
  {
    id: "allocation-3",
    incomeEntryId: "income-1",
    targetEntryId: "liability-affirm",
    amount: 80,
  },
];

export function usePaycheckData() {
  const [incomeEntries] = useState(seedIncomeEntries);
  const [liabilities] = useState(seedLiabilities);
  const [allocations, setAllocations] = useState(seedAllocations);

  const liabilityById = useMemo(() => {
    return new Map(liabilities.map((liability) => [liability.id, liability]));
  }, [liabilities]);

  function createAllocation(input: {
    incomeEntryId: string;
    targetEntryId: string;
    amount: number;
  }) {
    const created: IncomeAllocation = {
      id: `allocation-${Date.now()}-${input.targetEntryId}`,
      incomeEntryId: input.incomeEntryId,
      targetEntryId: input.targetEntryId,
      amount: input.amount,
    };

    setAllocations((current) => [created, ...current]);
  }

  return {
    incomeEntries,
    liabilities,
    liabilityById,
    allocations,
    createAllocation,
  };
}
