import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { EditableAmountRow } from "@/components/budget/EditableAmountRow";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useBudgetData } from "@/hooks/useBudgetData";
import type { Liability } from "@/types/budget";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const PAYCHECK_SLOTS = ["current", "next", "following"] as const;

export function PaychecksScreen() {
  const {
    paychecks,
    archivedPaychecks,
    getPaycheckLiabilities,
    getPaycheckUnallocated,
    getLiabilityCoverage,
    addPaycheck,
    updatePaycheck,
    addAllocation,
    completeLiability,
  } = useBudgetData();
  const [selectedSlot, setSelectedSlot] = useState<(typeof PAYCHECK_SLOTS)[number]>("current");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [allocationLiability, setAllocationLiability] = useState<Liability | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [allocationAmount, setAllocationAmount] = useState("");

  const paycheck = paychecks.find((entry) => entry.slot === selectedSlot) ?? null;
  const paycheckLiabilities = useMemo(
    () => (paycheck ? getPaycheckLiabilities(paycheck.id) : []),
    [getPaycheckLiabilities, paycheck],
  );

  async function handleSaveIncome() {
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0 || !date) {
      return;
    }

    if (paycheck) {
      await updatePaycheck(paycheck.id, {
        label,
        amount: parsedAmount,
        date: new Date(date).toISOString(),
      });
    } else {
      await addPaycheck({
        label,
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        slot: selectedSlot,
      });
    }

    setLabel("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setIncomeOpen(false);
  }

  async function handleAllocate() {
    if (!paycheck || !allocationLiability) {
      return;
    }

    const parsedAmount = Number.parseFloat(allocationAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    await addAllocation({
      paycheckId: paycheck.id,
      liabilityId: allocationLiability.id,
      amount: parsedAmount,
      paymentDate: new Date().toISOString(),
    });

    setAllocationLiability(null);
    setAllocationAmount("");
  }

  return (
    <Screen title="Paychecks">
      <View style={styles.header}>
        <Pressable onPress={() => setArchiveOpen(true)} style={styles.chevron}>
          <Text style={styles.chevronLabel}>{"<"}</Text>
        </Pressable>
        <View style={styles.tabs}>
          {PAYCHECK_SLOTS.map((slot) => (
            <Pressable
              key={slot}
              style={[styles.tab, selectedSlot === slot && styles.tabSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={styles.tabLabel}>
                {slot === "current" ? "Current Check" : slot === "next" ? "Next Check" : "Following Check"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {paycheck ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{paycheck.label || "Unnamed Paycheck"}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(paycheck.amount)}</Text>
            <Text style={styles.summaryMeta}>{new Date(paycheck.date).toLocaleDateString("en-US")}</Text>
            <Text style={styles.summaryMeta}>Unallocated: {formatCurrency(getPaycheckUnallocated(paycheck.id))}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => setIncomeOpen(true)}>
            <Text style={styles.primaryLabel}>Add Income</Text>
          </Pressable>

          {paycheckLiabilities.map((liability) => {
            const covered = getLiabilityCoverage(liability.id);
            return (
              <EditableAmountRow
                key={liability.id}
                title={liability.item}
                subtitle={`${liability.categoryName} - Due ${new Date(liability.dueDate).toLocaleDateString("en-US")} - Covered ${formatCurrency(covered)}`}
                amount={formatCurrency(liability.amount)}
                completed={liability.isCompleted}
                isRevealed={revealedId === liability.id}
                onPress={() => setRevealedId((current) => (current === liability.id ? null : liability.id))}
                onToggleComplete={() => completeLiability(liability.id, !liability.isCompleted)}
                onEdit={() => setAllocationLiability(liability)}
              />
            );
          })}
        </ScrollView>
      ) : null}

      <Modal transparent visible={incomeOpen} animationType="fade" onRequestClose={() => setIncomeOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Income</Text>
            <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Source / label" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
            <View style={styles.actions}>
              <Pressable onPress={() => setIncomeOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSaveIncome}>
                <Text style={styles.primaryLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={allocationLiability !== null}
        animationType="fade"
        onRequestClose={() => setAllocationLiability(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Allocate to Liability</Text>
            <Text style={styles.summaryMeta}>{allocationLiability?.item}</Text>
            <TextInput
              style={styles.input}
              value={allocationAmount}
              onChangeText={setAllocationAmount}
              placeholder="Allocation amount"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setAllocationLiability(null)}>
                <Text style={styles.cancel}>Close</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleAllocate}>
                <Text style={styles.primaryLabel}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={archiveOpen} animationType="fade" onRequestClose={() => setArchiveOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Archived Checks</Text>
            <ScrollView style={styles.archiveList}>
              {archivedPaychecks.map((archived) => (
                <View key={archived.id} style={styles.archiveRow}>
                  <Text style={styles.archiveTitle}>{archived.label || "Archived Check"}</Text>
                  <Text style={styles.archiveMeta}>
                    {new Date(archived.date).toLocaleDateString("en-US")} - {formatCurrency(archived.amount)}
                  </Text>
                </View>
              ))}
              {archivedPaychecks.length === 0 ? <Text style={styles.summaryMeta}>No archived checks yet.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  chevronLabel: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    lineHeight: 28,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: "center",
  },
  tabSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  tabLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    textAlign: "center",
    fontWeight: "700",
  },
  content: {
    gap: theme.spacing.sm,
    paddingBottom: 120,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  summaryTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    textTransform: "uppercase",
  },
  summaryAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: "800",
  },
  summaryMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryLabel: {
    color: theme.colors.onAccent,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  modalCard: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    maxHeight: "80%",
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  cancel: {
    color: theme.colors.textSecondary,
    paddingVertical: 10,
  },
  archiveList: {
    maxHeight: 320,
  },
  archiveRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  archiveTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  archiveMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
});
