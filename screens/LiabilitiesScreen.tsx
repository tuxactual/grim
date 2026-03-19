import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { EditableAmountRow } from "@/components/budget/EditableAmountRow";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useBudgetData } from "@/hooks/useBudgetData";
import type { Liability, LiabilityKind } from "@/types/budget";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const LIABILITY_KINDS: LiabilityKind[] = ["standard", "term", "pay_in_4"];

export function LiabilitiesScreen() {
  const { liabilities, categories, addCategory, addLiability, updateLiability, completeLiability } = useBudgetData();
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryName, setCategoryName] = useState("");
  const [kind, setKind] = useState<LiabilityKind>("standard");
  const [notes, setNotes] = useState("");
  const [totalTermAmount, setTotalTermAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paymentsRemaining, setPaymentsRemaining] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const liabilityCategories = useMemo(
    () => categories.filter((category) => category.type === "liability"),
    [categories],
  );

  function openCreate() {
    setEditing(null);
    setIsCreating(true);
  }

  function openEdit(liability: Liability) {
    setEditing(liability);
    setItem(liability.item);
    setAmount(String(liability.amount));
    setDueDate(liability.dueDate.slice(0, 10));
    setCategoryName(liability.categoryName);
    setKind(liability.kind);
    setNotes(liability.notes ?? "");
    setTotalTermAmount(liability.totalTermAmount ? String(liability.totalTermAmount) : "");
    setInstallmentAmount(liability.installmentAmount ? String(liability.installmentAmount) : "");
    setPaymentsRemaining(liability.paymentsRemaining ? String(liability.paymentsRemaining) : "");
    setNextDueDate(liability.nextDueDate?.slice(0, 10) ?? "");
  }

  function resetForm() {
    setItem("");
    setAmount("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setCategoryName("");
    setKind("standard");
    setNotes("");
    setTotalTermAmount("");
    setInstallmentAmount("");
    setPaymentsRemaining("");
    setNextDueDate("");
    setCustomCategory("");
    setEditing(null);
    setIsCreating(false);
  }

  async function handleSave() {
    const parsedAmount = Number.parseFloat(amount);
    if (!item.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !dueDate) {
      return;
    }

    const payload = {
      item: item.trim(),
      amount: parsedAmount,
      dueDate: new Date(dueDate).toISOString(),
      categoryName: categoryName || liabilityCategories[0]?.name || "General",
      kind,
      notes,
      totalTermAmount: totalTermAmount ? Number.parseFloat(totalTermAmount) : undefined,
      installmentAmount: installmentAmount ? Number.parseFloat(installmentAmount) : undefined,
      paymentsRemaining: paymentsRemaining ? Number.parseInt(paymentsRemaining, 10) : undefined,
      nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : undefined,
    };

    if (editing) {
      await updateLiability(editing.id, payload);
    } else {
      await addLiability(payload);
    }

    resetForm();
  }

  async function handleAddCustomCategory() {
    if (!customCategory.trim()) {
      return;
    }

    await addCategory({ name: customCategory.trim(), type: "liability" });
    setCategoryName(customCategory.trim());
    setCustomCategory("");
  }

  return (
    <Screen title="Liabilities">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.primaryButton} onPress={openCreate}>
          <Text style={styles.primaryLabel}>Add Liability</Text>
        </Pressable>

        {liabilities.map((liability) => (
          <EditableAmountRow
            key={liability.id}
            title={liability.item}
            subtitle={`${liability.categoryName} - ${new Date(liability.dueDate).toLocaleDateString("en-US")} - ${liability.kind}`}
            amount={formatCurrency(liability.amount)}
            completed={liability.isCompleted}
            isRevealed={revealedId === liability.id}
            onPress={() => setRevealedId((current) => (current === liability.id ? null : liability.id))}
            onToggleComplete={() => completeLiability(liability.id, !liability.isCompleted)}
            onEdit={() => openEdit(liability)}
          />
        ))}
      </ScrollView>

      <Modal
        transparent
        visible={isCreating || Boolean(editing)}
        animationType="fade"
        onRequestClose={resetForm}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? "Edit Liability" : "Add Liability"}</Text>
            <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="Item" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
            <View style={styles.optionGroup}>
              {liabilityCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[styles.option, categoryName === category.name && styles.optionSelected]}
                  onPress={() => setCategoryName(category.name)}
                >
                  <Text style={styles.optionText}>{category.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inline}>
              <TextInput
                style={[styles.input, styles.flex]}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Custom category"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Pressable style={styles.secondaryButton} onPress={handleAddCustomCategory}>
                <Text style={styles.secondaryLabel}>+</Text>
              </Pressable>
            </View>
            <View style={styles.optionGroup}>
              {LIABILITY_KINDS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.option, kind === option && styles.optionSelected]}
                  onPress={() => setKind(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
            {(kind === "term" || kind === "pay_in_4") ? (
              <>
                <TextInput style={styles.input} value={totalTermAmount} onChangeText={setTotalTermAmount} placeholder="Total term amount" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
                <TextInput style={styles.input} value={installmentAmount} onChangeText={setInstallmentAmount} placeholder="Installment amount" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
                <TextInput style={styles.input} value={paymentsRemaining} onChangeText={setPaymentsRemaining} placeholder="Payments remaining" placeholderTextColor={theme.colors.textMuted} keyboardType="number-pad" />
                <TextInput style={styles.input} value={nextDueDate} onChangeText={setNextDueDate} placeholder="Next due date" placeholderTextColor={theme.colors.textMuted} />
              </>
            ) : null}
            <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} placeholder="Notes" placeholderTextColor={theme.colors.textMuted} multiline />
            <View style={styles.actions}>
              <Pressable onPress={resetForm}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSave}>
                <Text style={styles.primaryLabel}>Save</Text>
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
    gap: theme.spacing.sm,
    paddingBottom: 120,
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
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: {
    color: theme.colors.textPrimary,
  },
  inline: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.separator,
    backgroundColor: theme.colors.surface,
  },
  secondaryLabel: {
    color: theme.colors.textPrimary,
    fontSize: 22,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  cancel: {
    color: theme.colors.textSecondary,
    paddingVertical: 10,
  },
});
