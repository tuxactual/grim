import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { usePaycheckData } from "@/hooks/usePaycheckData";
import type { LiabilityEntry, LiabilityType } from "@/types/paycheck";
import { getAllocationsForIncomeEntry, getAssignedAmount, getRemainingAmount } from "@/utils/paycheck";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatLiabilityMeta(liability: LiabilityEntry) {
  const parts = [
    liability.source === "expense" ? "From expense" : "Manual",
    new Date(liability.dueDate).toLocaleDateString("en-US"),
  ];

  if (liability.category) {
    parts.push(liability.category);
  }

  return parts.join(" • ");
}

export function IncomeScreen() {
  const { incomeEntries, liabilities, liabilityById, allocations, createAllocation, createLiability } =
    usePaycheckData();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [selectedIncomeEntryId, setSelectedIncomeEntryId] = useState(incomeEntries[0]?.id ?? "");
  const [selectedLiabilityId, setSelectedLiabilityId] = useState(
    liabilities.find((liability) => !liability.completed)?.id ?? "",
  );
  const [amountInput, setAmountInput] = useState("");
  const [liabilityName, setLiabilityName] = useState("");
  const [liabilityAmountInput, setLiabilityAmountInput] = useState("");
  const [liabilityDueDate, setLiabilityDueDate] = useState("");
  const [liabilityCategory, setLiabilityCategory] = useState("");
  const [liabilityType, setLiabilityType] = useState<LiabilityType>("bill");

  const incomeEntryById = useMemo(() => {
    return new Map(incomeEntries.map((entry) => [entry.id, entry]));
  }, [incomeEntries]);

  const selectedIncomeEntry = incomeEntryById.get(selectedIncomeEntryId);
  const selectedIncomeAllocations = selectedIncomeEntry
    ? getAllocationsForIncomeEntry(selectedIncomeEntry.id, allocations)
    : [];
  const selectedIncomeAssignedAmount = selectedIncomeEntry
    ? getAssignedAmount(selectedIncomeEntry, allocations)
    : 0;
  const selectedIncomeRemainingAmount = selectedIncomeEntry
    ? getRemainingAmount(selectedIncomeEntry, allocations)
    : 0;
  const liabilitiesForSelectedIncome = useMemo(() => {
    if (!selectedIncomeEntry) {
      return [];
    }

    return liabilities.filter((liability) => {
      const isAllocatedFromSelectedIncome = allocations.some(
        (allocation) =>
          allocation.incomeEntryId === selectedIncomeEntry.id &&
          allocation.targetEntryId === liability.id,
      );

      return isAllocatedFromSelectedIncome || !liability.completed;
    });
  }, [allocations, liabilities, selectedIncomeEntry]);
  const unassignedLiabilities = useMemo(
    () => liabilitiesForSelectedIncome.filter((liability) => !liability.completed),
    [liabilitiesForSelectedIncome],
  );
  const assignedPaidLiabilities = useMemo(
    () => liabilitiesForSelectedIncome.filter((liability) => liability.completed),
    [liabilitiesForSelectedIncome],
  );
  const activeLiabilities = useMemo(
    () => liabilities.filter((liability) => !liability.completed),
    [liabilities],
  );

  useEffect(() => {
    if (!selectedIncomeEntryId && incomeEntries[0]?.id) {
      setSelectedIncomeEntryId(incomeEntries[0].id);
    }
  }, [incomeEntries, selectedIncomeEntryId]);

  useEffect(() => {
    if (activeLiabilities.length === 0) {
      setSelectedLiabilityId("");
      return;
    }

    const stillActive = activeLiabilities.some((liability) => liability.id === selectedLiabilityId);
    if (!stillActive) {
      setSelectedLiabilityId(activeLiabilities[0].id);
    }
  }, [activeLiabilities, selectedLiabilityId]);

  function getAssignedAmountForLiability(liabilityId: string) {
    return selectedIncomeAllocations
      .filter((allocation) => allocation.targetEntryId === liabilityId)
      .reduce((sum, allocation) => sum + allocation.amount, 0);
  }

  function handleAddAllocation() {
    const amountValue = Number.parseFloat(amountInput.replace(/[$,\s]/g, ""));

    if (!selectedIncomeEntryId || !selectedLiabilityId || Number.isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    const incomeEntry = incomeEntryById.get(selectedIncomeEntryId);

    if (!incomeEntry) {
      return;
    }

    const remainingAmount = getRemainingAmount(incomeEntry, allocations);

    if (amountValue > remainingAmount) {
      return;
    }

    const result = createAllocation({
      incomeEntryId: selectedIncomeEntryId,
      targetEntryId: selectedLiabilityId,
      amount: amountValue,
    });

    if (!result.wasCreated) {
      return;
    }

    if (result.completedByAllocation) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAmountInput("");
    setIsAssignOpen(false);
  }

  function handleAddLiability() {
    const amountValue = Number.parseFloat(liabilityAmountInput.replace(/[$,\s]/g, ""));
    const dueDateValue = liabilityDueDate.trim();

    if (!liabilityName.trim() || Number.isNaN(amountValue) || amountValue <= 0 || !dueDateValue) {
      return;
    }

    const parsedDueDate = new Date(dueDateValue);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return;
    }

    createLiability({
      name: liabilityName,
      type: liabilityType,
      amount: amountValue,
      dueDate: parsedDueDate.toISOString(),
      category: liabilityCategory,
    });

    setLiabilityName("");
    setLiabilityAmountInput("");
    setLiabilityDueDate("");
    setLiabilityCategory("");
    setLiabilityType("bill");
    setIsAddLiabilityOpen(false);
  }

  return (
    <Screen title="Paycheck Allocation">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.optionGroup}>
          {incomeEntries.map((entry) => (
            <Pressable
              key={entry.id}
              style={[styles.option, selectedIncomeEntryId === entry.id && styles.optionSelected]}
              onPress={() => setSelectedIncomeEntryId(entry.id)}
            >
              <Text style={styles.optionText}>{entry.source}</Text>
            </Pressable>
          ))}
        </View>

        {selectedIncomeEntry ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>This Check</Text>
            <Text style={styles.paycheckLabel}>Paycheck: {formatCurrency(selectedIncomeEntry.amount)}</Text>
            <Text style={styles.meta}>Source: {selectedIncomeEntry.source}</Text>
            <Text style={styles.meta}>
              Date:{" "}
              {selectedIncomeEntry.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            {selectedIncomeEntry.notes ? <Text style={styles.meta}>Notes: {selectedIncomeEntry.notes}</Text> : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Unassigned</Text>
              {unassignedLiabilities.length === 0 ? (
                <Text style={styles.emptyText}>No open liabilities for this check.</Text>
              ) : (
                unassignedLiabilities.map((liability) => {
                  const assignedAmount = getAssignedAmountForLiability(liability.id);

                  return (
                    <View key={liability.id} style={styles.row}>
                      <View style={styles.rowMeta}>
                        <Text style={styles.rowLabel}>{liability.name}</Text>
                        <Text style={styles.rowDetail}>{formatLiabilityMeta(liability)}</Text>
                        {assignedAmount > 0 ? (
                          <Text style={styles.rowDetail}>Assigned: {formatCurrency(assignedAmount)}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.rowValue}>{formatCurrency(liability.amount)}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assigned & Paid</Text>
              {assignedPaidLiabilities.length === 0 ? (
                <Text style={styles.emptyText}>Nothing paid from this check yet.</Text>
              ) : (
                assignedPaidLiabilities.map((liability) => {
                  const assignedAmount = getAssignedAmountForLiability(liability.id);

                  return (
                    <View key={liability.id} style={styles.row}>
                      <View style={styles.rowMeta}>
                        <Text style={[styles.rowLabel, styles.completedText]}>{liability.name}</Text>
                        <Text style={styles.rowDetail}>{formatLiabilityMeta(liability)}</Text>
                        {assignedAmount > 0 ? (
                          <Text style={styles.rowDetail}>Assigned: {formatCurrency(assignedAmount)}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.rowValue, styles.completedText]}>{formatCurrency(liability.amount)}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.totals}>
              <View style={styles.row}>
                <Text style={styles.totalLabel}>Assigned total</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedIncomeAssignedAmount)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.remainingLabel}>Remaining</Text>
                <Text style={styles.remainingValue}>{formatCurrency(selectedIncomeRemainingAmount)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No income entries yet.</Text>
        )}
      </ScrollView>

      <View style={styles.footerActions}>
        <Pressable style={styles.secondaryButton} onPress={() => setIsAddLiabilityOpen(true)}>
          <Text style={styles.secondaryButtonLabel}>+ Add liability</Text>
        </Pressable>
        <Pressable
          style={[styles.assignButton, activeLiabilities.length === 0 && styles.assignButtonDisabled]}
          onPress={() => setIsAssignOpen(true)}
          disabled={activeLiabilities.length === 0}
        >
          <Text style={styles.assignButtonLabel}>+ Assign liability</Text>
        </Pressable>
      </View>

      <Modal transparent visible={isAssignOpen} animationType="fade" onRequestClose={() => setIsAssignOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign liability</Text>

            <Text style={styles.inputLabel}>Income entry</Text>
            <View style={styles.optionGroup}>
              {incomeEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  style={[styles.option, selectedIncomeEntryId === entry.id && styles.optionSelected]}
                  onPress={() => setSelectedIncomeEntryId(entry.id)}
                >
                  <Text style={styles.optionText}>{entry.source}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Liability target</Text>
            <View style={styles.optionGroup}>
              {activeLiabilities.map((liability) => (
                <Pressable
                  key={liability.id}
                  style={[styles.option, selectedLiabilityId === liability.id && styles.optionSelected]}
                  onPress={() => setSelectedLiabilityId(liability.id)}
                >
                  <Text style={styles.optionText}>
                    {liability.name} ({formatCurrency(liability.amount)})
                  </Text>
                </Pressable>
              ))}
            </View>
            {activeLiabilities.length === 0 ? (
              <Text style={styles.emptyText}>All liabilities are covered.</Text>
            ) : null}

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

      <Modal
        transparent
        visible={isAddLiabilityOpen}
        animationType="fade"
        onRequestClose={() => setIsAddLiabilityOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add liability</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              placeholder="Rent, card, loan..."
              placeholderTextColor={theme.colors.textMuted}
              value={liabilityName}
              onChangeText={setLiabilityName}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.optionGroup}>
              {(["bill", "pay_in_4", "credit_card", "custom_monthly"] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.option, liabilityType === type && styles.optionSelected]}
                  onPress={() => setLiabilityType(type)}
                >
                  <Text style={styles.optionText}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={liabilityAmountInput}
              onChangeText={setLiabilityAmountInput}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Due date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              value={liabilityDueDate}
              onChangeText={setLiabilityDueDate}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Category (optional)</Text>
            <TextInput
              placeholder="Home, Food, Transport..."
              placeholderTextColor={theme.colors.textMuted}
              value={liabilityCategory}
              onChangeText={setLiabilityCategory}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsAddLiabilityOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddLiability}>
                <Text style={styles.saveButtonText}>Save</Text>
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
    gap: theme.spacing.sm,
  },
  rowMeta: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  rowValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: theme.colors.textMuted,
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
  footerActions: {
    position: "absolute",
    left: theme.layout.rowInset,
    right: theme.layout.rowInset,
    bottom: theme.layout.fabBottom,
    gap: theme.spacing.sm,
  },
  assignButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  secondaryButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  assignButtonDisabled: {
    opacity: 0.5,
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
