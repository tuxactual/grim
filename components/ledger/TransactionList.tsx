import { FlatList, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import type { Transaction } from "@/types/transaction";
import { LedgerFeedbackRow } from "./LedgerFeedbackRow";

type TransactionListProps = {
  transactions: Transaction[];
  highlightedTransactionId?: string | null;
  onCompleteTransaction?: (transactionId: string) => void;
};

type LedgerRowItem =
  | { id: string; type: "date-header"; title: string }
  | { id: string; type: "transaction"; transaction: Transaction };

type LedgerSection = {
  id: string;
  title: string;
  data: LedgerRowItem[];
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatFullDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildLedgerSections(transactions: Transaction[]) {
  const groupedByDate = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const occurredAt = new Date(transaction.occurredAt);
    const dateKey = formatDateKey(occurredAt);
    const bucket = groupedByDate.get(dateKey) ?? [];
    bucket.push(transaction);
    groupedByDate.set(dateKey, bucket);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(yesterday);

  const sections: LedgerSection[] = [];

  if (groupedByDate.has(todayKey)) {
    sections.push({
      id: "today",
      title: "Today",
      data: (groupedByDate.get(todayKey) ?? []).map((transaction) => ({
        id: transaction.id,
        type: "transaction",
        transaction,
      })),
    });
  }

  if (groupedByDate.has(yesterdayKey)) {
    sections.push({
      id: "yesterday",
      title: "Earlier",
      data: (groupedByDate.get(yesterdayKey) ?? []).map((transaction) => ({
        id: transaction.id,
        type: "transaction",
        transaction,
      })),
    });
  }

  const earlierDateKeys = [...groupedByDate.keys()]
    .filter((dateKey) => dateKey !== todayKey && dateKey !== yesterdayKey)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  if (earlierDateKeys.length > 0) {
    const earlierRows: LedgerRowItem[] = [];

    earlierDateKeys.forEach((dateKey) => {
      earlierRows.push({
        id: `date-${dateKey}`,
        type: "date-header",
        title: formatFullDate(dateKey),
      });

      groupedByDate.get(dateKey)?.forEach((transaction) => {
        earlierRows.push({ id: transaction.id, type: "transaction", transaction });
      });
    });

    sections.push({
      id: "earlier",
      title: "Much Earlier",
      data: earlierRows,
    });
  }

  return sections;
}

export function TransactionList({
  transactions,
  highlightedTransactionId = null,
  onCompleteTransaction,
}: TransactionListProps) {
  const sections = buildLedgerSections(transactions);

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.id}
      contentContainerStyle={styles.content}
      renderItem={({ item: section }) => (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
          <View style={styles.sectionPanel}>
            {section.data.map((item, index) => {
              const showSeparator = index < section.data.length - 1;

              return (
                <View key={item.id}>
                  {item.type === "date-header" ? (
                    <Text style={styles.dateHeader}>{item.title}</Text>
                  ) : (
                    <LedgerFeedbackRow
                      transaction={item.transaction}
                      isNew={item.transaction.id === highlightedTransactionId}
                      onComplete={onCompleteTransaction}
                    />
                  )}
                  {showSeparator ? <View style={styles.separator} /> : null}
                </View>
              );
            })}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  sectionBlock: {
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.layout.rowInset,
  },
  sectionHeaderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionPanel: {
    marginHorizontal: theme.layout.rowInset,
    backgroundColor: "#151518",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 18,
  },
  dateHeader: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: 18,
  },
  empty: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.layout.rowInset,
  },
});
