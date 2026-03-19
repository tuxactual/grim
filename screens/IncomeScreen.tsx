import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { usePaycheckData } from "@/hooks/usePaycheckData";
import { getAllocationsForIncomeEntry, getAssignedAmount, getRemainingAmount } from "@/utils/paycheck";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function IncomeScreen() {
  const { incomeEntries, liabilities, liabilityById, allocations, createAllocation } =
    usePaycheckData();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedIncomeEntryId, setSelectedIncomeEntryId] = useState(incomeEntries[0]?.id ?? "");
  const [selectedLiabilityId, setSelectedLiabilityId] = useState(liabilities[0]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");

  const incomeEntryById = useMemo(() => {
    return new Map(incomeEntries.map((entry) => [entry.id, entry]));
  }, [incomeEntries]);

  function handleAddAllocation() {
    const amountValue = Number.parseFloat(amountInput.replace(/[$,\s]/g, ""));

    if (!selectedIncomeEntryId || !selectedLiabilityId || Number.isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    const amount = amountValue;
    const incomeEntry = incomeEntryById.get(selectedIncomeEntryId);

    if (!incomeEntry) {
      return;
    }

    const remainingAmount = getRemainingAmount(incomeEntry, allocations);

    if (amount > remainingAmount) {
      return;
    }

    createAllocation({
      incomeEntryId: selectedIncomeEntryId,
      targetEntryId: selectedLiabilityId,
      amount,
    });

    setAmountInput("");
    setIsAssignOpen(false);
  }

  return (
    <Screen title="Paycheck Allocation">
      <ScrollView contentContainerStyle={styles.content}>
        {incomeEntries.map((incomeEntry) => {
          const entryAllocations = getAllocationsForIncomeEntry(incomeEntry.id, allocations);
          const assignedAmount = getAssignedAmount(incomeEntry, allocations);
          const remainingAmount = getRemainingAmount(incomeEntry, allocations);

          return (
            <View key={incomeEntry.id} style={styles.card}>
              <Text style={styles.cardEyebrow}>This Check</Text>
              <Text style={styles.paycheckLabel}>Paycheck: {formatCurrency(incomeEntry.amount)}</Text>
              <Text style={styles.meta}>Source: {incomeEntry.source}</Text>
              <Text style={styles.meta}>Date: {incomeEntry.date}</Text>
              {incomeEntry.notes ? <Text style={styles.meta}>Notes: {incomeEntry.notes}</Text> : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned</Text>
                {entryAllocations.length === 0 ? (
                  <Text style={styles.emptyText}>No allocations yet.</Text>
                ) : (
                  entryAllocations.map((allocation) => {
                    const liability = liabilityById.get(allocation.targetEntryId);

                    return (
                      <View key={allocation.id} style={styles.row}>
                        <Text style={styles.rowLabel}>{liability?.name ?? "Unknown"}</Text>
                        <Text style={styles.rowValue}>{formatCurrency(allocation.amount)}</Text>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.totals}>
                <View style={styles.row}>
                  <Text style={styles.totalLabel}>Assigned total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(assignedAmount)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.remainingLabel}>Remaining</Text>
                  <Text style={styles.remainingValue}>{formatCurrency(remainingAmount)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable style={styles.assignButton} onPress={() => setIsAssignOpen(true)}>
        <Text style={styles.assignButtonLabel}>+ Assign liability</Text>
      </Pressable>

      <Modal transparent visible={isAssignOpen} animationType="fade" onRequestClose={() => setIsAssignOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign liability</Text>

            <Text style={styles.inputLabel}>Income entry</Text>
            <View style={styles.optionGroup}>
              {incomeEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  style={[
                    styles.option,
                    selectedIncomeEntryId === entry.id && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedIncomeEntryId(entry.id)}
                >
                  <Text style={styles.optionText}>{entry.source}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Liability target</Text>
            <View style={styles.optionGroup}>
              {liabilities.map((liability) => (
                <Pressable
                  key={liability.id}
                  style={[
                    styles.option,
                    selectedLiabilityId === liability.id && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedLiabilityId(liability.id)}
                >
                  <Text style={styles.optionText}>
                    {liability.name} ({liability.type})
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsAssignOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddAllocation}>
                <Text style={styles.saveButtonText}>Assign</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardEyebrow: {
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  paycheckLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  section: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  rowValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  totals: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
    paddingTop: theme.spacing.sm,
  },
  totalLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  totalValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: "600",
  },
  remainingLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  remainingValue: {
    color: theme.colors.income,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  assignButton: {
    position: "absolute",
    left: theme.layout.rowInset,
    right: theme.layout.rowInset,
    bottom: theme.layout.fabBottom,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  assignButtonLabel: {
    color: theme.colors.onAccent,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  modalCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  optionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.body,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  saveButtonText: {
    color: theme.colors.onAccent,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
