import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaycheckState } from "@/types/paycheck";
import type { ExpensePage, LedgerState, Transaction } from "@/types/transaction";

const LEDGER_STATE_QUERY_KEY = ["ledger-state"] as const;
const PAYCHECK_STATE_QUERY_KEY = ["paycheck-state"] as const;

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function formatPageTitle(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function createPageId(date: Date) {
  return `expenses-page-${date.toISOString()}`;
}

function createTransactionId(prefix: string, timestamp: string) {
  return `${prefix}-${timestamp}`;
}

function createExpensePage(date: Date): ExpensePage {
  const monthKey = formatMonthKey(date);

  return {
    id: createPageId(date),
    type: "expenses",
    title: formatPageTitle(monthKey),
    createdAt: date.toISOString(),
    originMonthKey: monthKey,
  };
}

function createExpenseEntry(input: {
  id: string;
  merchant: string;
  amountCents: number;
  category: string;
  occurredAt: string;
  pageId: string;
  originMonthKey: string;
  notes?: string;
  isCompleted?: boolean;
  completedAt?: string;
  carriedForwardFromId?: string;
  linkedLiabilityId?: string;
}): Transaction {
  return {
    id: input.id,
    type: "expense",
    merchant: input.merchant,
    amountCents: input.amountCents,
    category: input.category,
    notes: input.notes ?? "",
    occurredAt: input.occurredAt,
    createdAt: input.occurredAt,
    pageId: input.pageId,
    originMonthKey: input.originMonthKey,
    isCompleted: input.isCompleted ?? false,
    completedAt: input.completedAt,
    carriedForwardFromId: input.carriedForwardFromId,
    linkedLiabilityId: input.linkedLiabilityId,
  };
}

function getDateKey(input: string | Date) {
  const date = new Date(input);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createMockLedgerState(): LedgerState {
  const previousMonthDate = new Date("2026-02-01T09:00:00.000Z");
  const currentMonthDate = new Date("2026-03-01T09:00:00.000Z");
  const previousPage = createExpensePage(previousMonthDate);
  const currentPage = createExpensePage(currentMonthDate);

  const previousMonthKey = previousPage.originMonthKey;
  const currentMonthKey = currentPage.originMonthKey;

  const previousRentOccurredAt = new Date("2026-02-02T08:25:00.000Z").toISOString();
  const previousGymOccurredAt = new Date("2026-02-03T09:40:00.000Z").toISOString();
  const currentGroceriesOccurredAt = new Date("2026-03-05T18:10:00.000Z").toISOString();
  const currentStreamingOccurredAt = new Date("2026-03-07T12:15:00.000Z").toISOString();

  const previousRentId = createTransactionId("expense-rent", previousRentOccurredAt);

  return {
    pages: [previousPage, currentPage].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
    transactions: [
      createExpenseEntry({
        id: previousRentId,
        merchant: "Rent",
        amountCents: -90000,
        category: "Home",
        occurredAt: previousRentOccurredAt,
        pageId: previousPage.id,
        originMonthKey: previousMonthKey,
        isCompleted: true,
        completedAt: new Date("2026-02-02T10:00:00.000Z").toISOString(),
      }),
      createExpenseEntry({
        id: createTransactionId("expense-gym", previousGymOccurredAt),
        merchant: "Gym Membership",
        amountCents: -4000,
        category: "Home",
        occurredAt: previousGymOccurredAt,
        pageId: previousPage.id,
        originMonthKey: previousMonthKey,
      }),
      createExpenseEntry({
        id: createTransactionId("expense-groceries", currentGroceriesOccurredAt),
        merchant: "Groceries",
        amountCents: -4290,
        category: "Food",
        occurredAt: currentGroceriesOccurredAt,
        pageId: currentPage.id,
        originMonthKey: currentMonthKey,
      }),
      createExpenseEntry({
        id: createTransactionId("expense-streaming", currentStreamingOccurredAt),
        merchant: "Streaming",
        amountCents: -1899,
        category: "Fun",
        occurredAt: currentStreamingOccurredAt,
        pageId: currentPage.id,
        originMonthKey: currentMonthKey,
      }),
    ].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()),
  };
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function getMostRecentPriorExpensesPage(pages: ExpensePage[], pageId?: string) {
  const sortedPages = [...pages].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  if (!pageId) {
    return sortedPages[0];
  }

  const currentPageIndex = sortedPages.findIndex((page) => page.id === pageId);
  return currentPageIndex === -1 ? sortedPages[0] : sortedPages[currentPageIndex + 1];
}

export function useTransactions() {
  return useQuery<LedgerState>({
    queryKey: LEDGER_STATE_QUERY_KEY,
    queryFn: async () => {
      return createMockLedgerState();
    },
  });
}

type CreateExpenseEntryInput = {
  merchant: string;
  amountCents: number;
  category: string;
  notes?: string;
  occurredAt?: string;
  pageId: string;
  originMonthKey: string;
};

export function useCreateExpenseEntry() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      merchant,
      amountCents,
      category,
      notes,
      occurredAt,
      pageId,
      originMonthKey,
    }: CreateExpenseEntryInput) => {
      const timestamp = occurredAt ?? new Date().toISOString();
      const paycheckState = queryClient.getQueryData<PaycheckState>(PAYCHECK_STATE_QUERY_KEY);
      const linkedLiability = paycheckState?.liabilities.find(
        (liability) =>
          Math.round(liability.amount * 100) === Math.abs(amountCents) &&
          getDateKey(liability.dueDate) === getDateKey(timestamp),
      );

      return createExpenseEntry({
        id: createTransactionId(merchant.trim().toLowerCase().replace(/\s+/g, "-"), timestamp),
        merchant: merchant.trim(),
        amountCents: -Math.abs(amountCents),
        category,
        notes,
        occurredAt: timestamp,
        pageId,
        originMonthKey,
        linkedLiabilityId: linkedLiability?.id,
        isCompleted: linkedLiability?.completed ?? false,
        completedAt: linkedLiability?.completed ? linkedLiability.completedAt : undefined,
      });
    },
  });

  function insertTransaction(transaction: Transaction) {
    queryClient.setQueryData<LedgerState>(LEDGER_STATE_QUERY_KEY, (current) => {
      if (!current) {
        return { pages: [], transactions: [transaction] };
      }

      return {
        ...current,
        transactions: sortTransactions([transaction, ...current.transactions]),
      };
    });
  }

  return {
    ...mutation,
    insertTransaction,
  };
}

export function useCompleteExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const completedAt = new Date().toISOString();

      queryClient.setQueryData<LedgerState>(LEDGER_STATE_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          transactions: current.transactions.map((transaction) => {
            if (transaction.id !== transactionId) {
              return transaction;
            }

            return {
              ...transaction,
              isCompleted: true,
              completedAt,
            };
          }),
        };
      });

      queryClient.setQueryData<PaycheckState>(PAYCHECK_STATE_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        const targetTransaction = queryClient
          .getQueryData<LedgerState>(LEDGER_STATE_QUERY_KEY)
          ?.transactions.find((transaction) => transaction.id === transactionId);

        return {
          ...current,
          liabilities: current.liabilities.map((liability) => {
            const matchesTransaction =
              liability.linkedExpenseEntryId === transactionId ||
              (targetTransaction &&
                Math.round(liability.amount * 100) === Math.abs(targetTransaction.amountCents) &&
                getDateKey(liability.dueDate) === getDateKey(targetTransaction.occurredAt));

            if (!matchesTransaction) {
              return liability;
            }

            return {
              ...liability,
              completed: true,
              completedAt,
              linkedExpenseEntryId: transactionId,
            };
          }),
        };
      });

      return {
        transactionId,
        completedAt,
      };
    },
  });
}

export function useCreateExpensesPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const createdAt = new Date();
      const page = createExpensePage(createdAt);

      queryClient.setQueryData<LedgerState>(LEDGER_STATE_QUERY_KEY, (current) => {
        const baseState = current ?? { pages: [], transactions: [] };
        const priorPage = getMostRecentPriorExpensesPage(baseState.pages);
        const carriedForwardTransactions = priorPage
          ? baseState.transactions
              .filter(
                (transaction) =>
                  transaction.pageId === priorPage.id &&
                  transaction.type === "expense" &&
                  transaction.isCompleted === false,
              )
              .map((transaction, index) =>
                createExpenseEntry({
                  id: createTransactionId(
                    `carry-forward-${transaction.id}-${index}`,
                    createdAt.toISOString(),
                  ),
                  merchant: transaction.merchant,
                  amountCents: transaction.amountCents,
                  category: transaction.category,
                  notes: transaction.notes,
                  occurredAt: createdAt.toISOString(),
                  pageId: page.id,
                  originMonthKey: page.originMonthKey,
                  carriedForwardFromId: transaction.id,
                  isCompleted: false,
                  linkedLiabilityId: undefined,
                }),
              )
          : [];

        return {
          pages: [page, ...baseState.pages].sort(
            (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          ),
          transactions: sortTransactions([...carriedForwardTransactions, ...baseState.transactions]),
        };
      });

      return page;
    },
  });
}
