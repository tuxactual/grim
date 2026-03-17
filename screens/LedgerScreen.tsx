import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AddTransactionSheet } from "@/components/ledger/AddTransactionSheet";
import { TransactionList } from "@/components/ledger/TransactionList";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { useLedgerFeedback } from "@/hooks/useLedgerFeedback";
import { useTransactions } from "@/hooks/useTransactions";

export function LedgerScreen() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data = [], error, isLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const { highlightedTransactionId, markTransactionInserted, triggerSaveHaptic } =
    useLedgerFeedback();

  async function handleSaveTransaction(input: {
    type: "expense" | "income";
    merchant: string;
    amountCents: number;
    category: string;
    notes: string;
  }) {
    const transaction = await createTransaction.mutateAsync(input);
    setIsSheetOpen(false);
    await triggerSaveHaptic();

    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });

    createTransaction.insertTransaction(transaction);
    markTransactionInserted(transaction.id);
  }

  return (
    <Screen>
      <View style={styles.content}>
        {isLoading ? <Text style={styles.status}>Loading transactions...</Text> : null}
        {error ? (
          <Text style={styles.error}>Unable to load transactions right now.</Text>
        ) : null}
        {!error ? (
          <TransactionList
            transactions={data}
            highlightedTransactionId={highlightedTransactionId}
          />
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsSheetOpen(true)}
        style={styles.fab}
      >
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
      <AddTransactionSheet
        isOpen={isSheetOpen}
        isSaving={createTransaction.isPending}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSaveTransaction}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: theme.spacing.md,
  },
  status: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  error: {
    color: theme.colors.expense,
    fontSize: theme.typography.body,
  },
  fab: {
    position: "absolute",
    right: theme.layout.fabRight,
    bottom: theme.layout.fabBottom,
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
  },
  fabLabel: {
    color: theme.colors.onAccent,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
  },
});
