import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetState,
  Category,
  Expense,
  Liability,
  Paycheck,
  PaycheckAllocation,
  PaycheckSlot,
} from "@/types/budget";

const BUDGET_STATE_QUERY_KEY = ["budget-state"] as const;
const BUDGET_STORAGE_KEY = "grim-budget-state-v1";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function startOfDay(input: string | Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDefaultPaycheckDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function createSeedState(): BudgetState {
  const now = new Date().toISOString();

  const liabilityCategories: Category[] = [
    { id: "cat-liability-housing", name: "Housing", isPreset: true, type: "liability" },
    { id: "cat-liability-debt", name: "Debt", isPreset: true, type: "liability" },
    { id: "cat-liability-utilities", name: "Utilities", isPreset: true, type: "liability" },
  ];
  const expenseCategories: Category[] = [
    { id: "cat-expense-food", name: "Food", isPreset: true, type: "expense" },
    { id: "cat-expense-transport", name: "Transport", isPreset: true, type: "expense" },
    { id: "cat-expense-fun", name: "Fun", isPreset: true, type: "expense" },
  ];

  return {
    liabilities: [
      {
        id: "liability-rent",
        item: "Rent",
        amount: 900,
        dueDate: getDefaultPaycheckDate(3),
        categoryId: liabilityCategories[0].id,
        categoryName: liabilityCategories[0].name,
        kind: "standard",
        notes: "",
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "liability-card",
        item: "Amex",
        amount: 280,
        dueDate: getDefaultPaycheckDate(5),
        categoryId: liabilityCategories[1].id,
        categoryName: liabilityCategories[1].name,
        kind: "standard",
        notes: "",
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    paychecks: [
      {
        id: "paycheck-current",
        label: "Main Paycheck",
        amount: 2100,
        date: getDefaultPaycheckDate(-1),
        slot: "current",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "paycheck-next",
        label: "Main Paycheck",
        amount: 2100,
        date: getDefaultPaycheckDate(13),
        slot: "next",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "paycheck-following",
        label: "Main Paycheck",
        amount: 2100,
        date: getDefaultPaycheckDate(27),
        slot: "following",
        createdAt: now,
        updatedAt: now,
      },
    ],
    allocations: [],
    expenses: [
      {
        id: "expense-grocery",
        item: "Groceries",
        amount: 42.9,
        date: getDefaultPaycheckDate(0),
        categoryId: expenseCategories[0].id,
        categoryName: expenseCategories[0].name,
        notes: "",
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    categories: [...liabilityCategories, ...expenseCategories],
  };
}

function sortPaychecksByDate(paychecks: Paycheck[]) {
  return [...paychecks].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}

function createPlaceholderPaycheck(baseDate?: string): Paycheck {
  const now = new Date().toISOString();
  const date = baseDate ? new Date(baseDate) : new Date();
  date.setDate(date.getDate() + 14);

  return {
    id: createId("paycheck"),
    label: "",
    amount: 0,
    date: date.toISOString(),
    slot: "following",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizePaychecks(paychecks: Paycheck[]) {
  const today = startOfDay(new Date()).getTime();
  let current = paychecks.find((paycheck) => paycheck.slot === "current") ?? null;
  let next = paychecks.find((paycheck) => paycheck.slot === "next") ?? null;
  let following = paychecks.find((paycheck) => paycheck.slot === "following") ?? null;
  const archived = paychecks.filter((paycheck) => paycheck.slot === "archived");

  if (!current && next) {
    current = { ...next, slot: "current" };
    next = following ? { ...following, slot: "next" } : null;
    following = createPlaceholderPaycheck(next?.date ?? current.date);
  }

  while (current && next && startOfDay(next.date).getTime() <= today) {
    archived.push({ ...current, slot: "archived" });
    current = { ...next, slot: "current" };
    next = following ? { ...following, slot: "next" } : null;
    following = createPlaceholderPaycheck(next?.date ?? current.date);
  }

  if (!current) {
    const sorted = sortPaychecksByDate(paychecks.filter((paycheck) => paycheck.slot !== "archived"));
    current = sorted[0] ? { ...sorted[0], slot: "current" } : createPlaceholderPaycheck();
    next = sorted[1] ? { ...sorted[1], slot: "next" } : createPlaceholderPaycheck(current.date);
    following = sorted[2] ? { ...sorted[2], slot: "following" } : createPlaceholderPaycheck(next.date);
  }

  if (!next) {
    next = createPlaceholderPaycheck(current.date);
    next.slot = "next";
  }

  if (!following) {
    following = createPlaceholderPaycheck(next.date);
    following.slot = "following";
  }

  return [
    ...sortPaychecksByDate(archived).map((paycheck) => ({ ...paycheck, slot: "archived" as PaycheckSlot })),
    { ...current, slot: "current" as PaycheckSlot },
    { ...next, slot: "next" as PaycheckSlot },
    { ...following, slot: "following" as PaycheckSlot },
  ];
}

function getPaycheckPeriod(paychecks: Paycheck[], paycheckId: string) {
  const sortedActive = sortPaychecksByDate(paychecks.filter((candidate) => candidate.slot !== "archived"));
  const index = sortedActive.findIndex((candidate) => candidate.id === paycheckId);
  if (index === -1) {
    return null;
  }

  const start = startOfDay(sortedActive[index].date);
  const end = new Date(start);
  if (sortedActive[index + 1]) {
    end.setTime(startOfDay(sortedActive[index + 1].date).getTime());
  } else {
    end.setDate(end.getDate() + 14);
  }

  return { start, end };
}

async function persistState(state: BudgetState) {
  await AsyncStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(state));
}

export function useBudgetData() {
  const queryClient = useQueryClient();
  const query = useQuery<BudgetState>({
    queryKey: BUDGET_STATE_QUERY_KEY,
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
      if (!stored) {
        const seed = createSeedState();
        await persistState(seed);
        return seed;
      }

      const parsed = JSON.parse(stored) as BudgetState;
      return {
        ...parsed,
        paychecks: normalizePaychecks(parsed.paychecks),
      };
    },
  });

  const state = query.data ?? createSeedState();
  const paychecks = useMemo(() => normalizePaychecks(state.paychecks), [state.paychecks]);
  const liabilities = state.liabilities;
  const allocations = state.allocations;
  const expenses = state.expenses;
  const categories = state.categories;
  const archivedPaychecks = paychecks.filter((paycheck) => paycheck.slot === "archived");
  const currentPaycheck = paychecks.find((paycheck) => paycheck.slot === "current") ?? null;
  const nextPaycheck = paychecks.find((paycheck) => paycheck.slot === "next") ?? null;
  const followingPaycheck = paychecks.find((paycheck) => paycheck.slot === "following") ?? null;

  const paycheckById = useMemo(() => new Map(paychecks.map((paycheck) => [paycheck.id, paycheck])), [paychecks]);
  const liabilityById = useMemo(
    () => new Map(liabilities.map((liability) => [liability.id, liability])),
    [liabilities],
  );

  function getLiabilityCoverage(liabilityId: string) {
    return allocations
      .filter((allocation) => allocation.liabilityId === liabilityId)
      .reduce((sum, allocation) => sum + allocation.amount, 0);
  }

  function getPeriodExpensesTotal(paycheckId: string) {
    const period = getPaycheckPeriod(paychecks, paycheckId);
    if (!period) {
      return 0;
    }

    return expenses
      .filter((expense) => {
        const expenseDate = startOfDay(expense.date).getTime();
        return expenseDate >= period.start.getTime() && expenseDate < period.end.getTime();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  function getPeriodCompletedLiabilityTotal(paycheckId: string) {
    const period = getPaycheckPeriod(paychecks, paycheckId);
    if (!period) {
      return 0;
    }

    return liabilities
      .filter((liability) => {
        const dueDate = startOfDay(liability.dueDate).getTime();
        return dueDate >= period.start.getTime() && dueDate < period.end.getTime() && liability.isCompleted;
      })
      .reduce((sum, liability) => sum + liability.amount, 0);
  }

  const currentPeriodExpenses = useMemo(
    () =>
      currentPaycheck
        ? expenses.filter((expense) => {
            const period = getPaycheckPeriod(paychecks, currentPaycheck.id);
            if (!period) {
              return false;
            }
            const expenseDate = startOfDay(expense.date).getTime();
            return expenseDate >= period.start.getTime() && expenseDate < period.end.getTime();
          })
        : [],
    [currentPaycheck, expenses, paychecks],
  );

  const currentUnallocated = currentPaycheck
    ? currentPaycheck.amount -
      getPeriodCompletedLiabilityTotal(currentPaycheck.id) -
      getPeriodExpensesTotal(currentPaycheck.id)
    : 0;

  async function commit(updater: (current: BudgetState) => BudgetState) {
    const current = queryClient.getQueryData<BudgetState>(BUDGET_STATE_QUERY_KEY) ?? createSeedState();
    const updated = updater(current);
    const next = {
      ...updated,
      paychecks: normalizePaychecks(updated.paychecks),
    };
    queryClient.setQueryData(BUDGET_STATE_QUERY_KEY, next);
    await persistState(next);
    return next;
  }

  function getPaycheckAllocations(paycheckId: string) {
    return allocations.filter((allocation) => allocation.paycheckId === paycheckId);
  }

  async function addCategory(input: { name: string; type: Category["type"] }) {
    const category: Category = {
      id: createId("category"),
      name: input.name.trim(),
      isPreset: false,
      type: input.type,
    };

    await commit((current) => ({
      ...current,
      categories: [...current.categories, category],
    }));
  }

  async function addLiability(input: Omit<Liability, "id" | "createdAt" | "updatedAt" | "isCompleted"> & {
    isCompleted?: boolean;
  }) {
    const now = new Date().toISOString();
    const liability: Liability = {
      ...input,
      id: createId("liability"),
      isCompleted: input.isCompleted ?? false,
      createdAt: now,
      updatedAt: now,
    };

    await commit((current) => ({
      ...current,
      liabilities: [liability, ...current.liabilities],
    }));
  }

  async function updateLiability(id: string, updates: Partial<Liability>) {
    await commit((current) => ({
      ...current,
      liabilities: current.liabilities.map((liability) =>
        liability.id === id
          ? {
              ...liability,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : liability,
      ),
    }));
  }

  async function completeLiability(id: string, completed: boolean) {
    await updateLiability(id, {
      isCompleted: completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  }

  async function addExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt" | "isCompleted"> & {
    isCompleted?: boolean;
  }) {
    const now = new Date().toISOString();
    const expense: Expense = {
      ...input,
      id: createId("expense"),
      isCompleted: input.isCompleted ?? false,
      createdAt: now,
      updatedAt: now,
    };

    await commit((current) => ({
      ...current,
      expenses: [expense, ...current.expenses],
    }));
  }

  async function updateExpense(id: string, updates: Partial<Expense>) {
    await commit((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : expense,
      ),
    }));
  }

  async function completeExpense(id: string, completed: boolean) {
    await updateExpense(id, {
      isCompleted: completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  }

  async function addPaycheck(input: Omit<Paycheck, "id" | "createdAt" | "updatedAt" | "slot"> & { slot?: PaycheckSlot }) {
    const now = new Date().toISOString();
    const paycheck: Paycheck = {
      ...input,
      id: createId("paycheck"),
      slot: input.slot ?? "following",
      createdAt: now,
      updatedAt: now,
    };

    await commit((current) => ({
      ...current,
      paychecks: [...current.paychecks.filter((entry) => entry.slot !== input.slot), paycheck],
    }));
  }

  async function updatePaycheck(id: string, updates: Partial<Paycheck>) {
    await commit((current) => ({
      ...current,
      paychecks: current.paychecks.map((paycheck) =>
        paycheck.id === id
          ? {
              ...paycheck,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : paycheck,
      ),
    }));
  }

  async function addAllocation(input: {
    paycheckId: string;
    liabilityId: string;
    amount: number;
    paymentDate?: string;
  }) {
    const now = new Date().toISOString();
    const allocation: PaycheckAllocation = {
      id: createId("allocation"),
      paycheckId: input.paycheckId,
      liabilityId: input.liabilityId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      createdAt: now,
      updatedAt: now,
    };

    await commit((current) => ({
      ...current,
      allocations: [allocation, ...current.allocations],
    }));

    const liability = liabilityById.get(input.liabilityId);
    if (liability && getLiabilityCoverage(input.liabilityId) + input.amount >= liability.amount) {
      await completeLiability(input.liabilityId, true);
    }
  }

  function getPaycheckUnallocated(paycheckId: string) {
    const paycheck = paycheckById.get(paycheckId);
    if (!paycheck) {
      return 0;
    }

    return (
      paycheck.amount -
      getPeriodCompletedLiabilityTotal(paycheckId) -
      getPeriodExpensesTotal(paycheckId)
    );
  }

  function getPaycheckLiabilities(paycheckId: string) {
    const paycheck = paycheckById.get(paycheckId);
    if (!paycheck) {
      return [];
    }

    if (paycheck.slot !== "archived") {
      return liabilities
        .filter(
          (liability) =>
            !liability.isCompleted || allocations.some((allocation) => allocation.liabilityId === liability.id),
        )
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
    }

    const period = getPaycheckPeriod(paychecks, paycheckId);
    if (!period) {
      return [];
    }

    return liabilities
      .filter((liability) => {
        const dueDate = startOfDay(liability.dueDate).getTime();
        return (
          dueDate >= period.start.getTime() &&
          dueDate < period.end.getTime()
        ) || allocations.some((allocation) => allocation.liabilityId === liability.id);
      })
      .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
  }

  return {
    ...query,
    liabilities,
    paychecks,
    allocations,
    expenses,
    categories,
    currentPaycheck,
    nextPaycheck,
    followingPaycheck,
    archivedPaychecks,
    currentUnallocated,
    currentPeriodExpenses,
    getLiabilityCoverage,
    getPaycheckAllocations,
    getPaycheckLiabilities,
    getPaycheckUnallocated,
    addCategory,
    addLiability,
    updateLiability,
    completeLiability,
    addExpense,
    updateExpense,
    completeExpense,
    addPaycheck,
    updatePaycheck,
    addAllocation,
  };
}
