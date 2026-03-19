import type { IncomeAllocation, IncomeEntry } from "@/types/paycheck";

export function getAllocationsForIncomeEntry(
  incomeEntryId: string,
  allocations: IncomeAllocation[],
) {
  return allocations.filter((allocation) => allocation.incomeEntryId === incomeEntryId);
}

export function getAssignedAmount(incomeEntry: IncomeEntry, allocations: IncomeAllocation[]) {
  return getAllocationsForIncomeEntry(incomeEntry.id, allocations).reduce(
    (sum, allocation) => sum + allocation.amount,
    0,
  );
}

export function getRemainingAmount(incomeEntry: IncomeEntry, allocations: IncomeAllocation[]) {
  return incomeEntry.amount - getAssignedAmount(incomeEntry, allocations);
}

export function getAllocatedAmountForTarget(
  targetEntryId: string,
  allocations: IncomeAllocation[],
) {
  return allocations
    .filter((allocation) => allocation.targetEntryId === targetEntryId)
    .reduce((sum, allocation) => sum + allocation.amount, 0);
}
