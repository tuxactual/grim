import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { EditableAmountRow } from "@/components/budget/EditableAmountRow";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useBudgetData } from "@/hooks/useBudgetData";
import type { Expense } from "@/types/budget";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function ExpensesScreen() {
  const { expenses, categories, addCategory, addExpense, updateExpense, completeExpense } = useBudgetData();
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [creating, setCreating] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryName, setCategoryName] = useState("");
  const [notes, setNotes] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );

  function openCreate() {
    setCreating(true);
    setEditing(null);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setItem(expense.item);
    setAmount(String(expense.amount));
    setDate(expense.date.slice(0, 10));
    setCategoryName(expense.categoryName);
    setNotes(expense.notes ?? "");
  }

  function resetForm() {
    setCreating(false);
    setEditing(null);
    setItem("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryName("");
    setNotes("");
    setCustomCategory("");
  }

  async function handleAddCategory() {
    if (!customCategory.trim()) {
      return;
    }

    await addCategory({ name: customCategory.trim(), type: "expense" });
    setCategoryName(customCategory.trim());
    setCustomCategory("");
  }

  async function handleSave() {
    const parsedAmount = Number.parseFloat(amount);
    if (!item.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      return;
    }

    const payload = {
      item: item.trim(),
      amount: parsedAmount,
      date: new Date(date).toISOString(),
      categoryName: categoryName || expenseCategories[0]?.name || "General",
      notes,
    };

    if (editing) {
      await updateExpense(editing.id, payload);
    } else {
      await addExpense(payload);
    }

    resetForm();
  }

  return (
    <Screen title="Expenses">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.primaryButton} onPress={openCreate}>
          <Text style={styles.primaryLabel}>Add Expense</Text>
        </Pressable>

        {expenses.map((expense) => (
          <EditableAmountRow
            key={expense.id}
            title={expense.item}
            subtitle={`${expense.categoryName} - ${new Date(expense.date).toLocaleDateString("en-US")}`}
            amount={formatCurrency(expense.amount)}
            completed={expense.isCompleted}
            isRevealed={revealedId === expense.id}
            onPress={() => setRevealedId((current) => (current === expense.id ? null : expense.id))}
            onToggleComplete={() => completeExpense(expense.id, !expense.isCompleted)}
            onEdit={() => openEdit(expense)}
          />
        ))}
      </ScrollView>

      <Modal
        transparent
        visible={creating || Boolean(editing)}
        animationType="fade"
        onRequestClose={resetForm}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? "Edit Expense" : "Add Expense"}</Text>
            <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="Item" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
            <View style={styles.optionGroup}>
              {expenseCategories.map((category) => (
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
              <Pressable style={styles.secondaryButton} onPress={handleAddCategory}>
                <Text style={styles.secondaryLabel}>+</Text>
              </Pressable>
            </View>
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
