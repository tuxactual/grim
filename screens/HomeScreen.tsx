import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SpeedDial } from "@/components/budget/SpeedDial";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useBudgetData } from "@/hooks/useBudgetData";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function HomeScreen() {
  const { currentUnallocated, categories, addExpense, addLiability } = useBudgetData();
  const [isDialOpen, setIsDialOpen] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "liability" | null>(null);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryName, setCategoryName] = useState("");

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );
  const liabilityCategories = useMemo(
    () => categories.filter((category) => category.type === "liability"),
    [categories],
  );

  async function handleSave() {
    const parsedAmount = Number.parseFloat(amount);
    if (!item.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      return;
    }

    if (modalType === "expense") {
      await addExpense({
        item: item.trim(),
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        categoryName: categoryName || expenseCategories[0]?.name || "General",
        notes: "",
      });
    }

    if (modalType === "liability") {
      await addLiability({
        item: item.trim(),
        amount: parsedAmount,
        dueDate: new Date(date).toISOString(),
        categoryName: categoryName || liabilityCategories[0]?.name || "General",
        kind: "standard",
        notes: "",
      });
    }

    setItem("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryName("");
    setModalType(null);
    setIsDialOpen(false);
  }

  return (
    <Screen title="">
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Unallocated</Text>
        <Text style={styles.amount}>{formatCurrency(currentUnallocated)}</Text>

        <View style={styles.grid}>
          <Pressable style={styles.navButton} onPress={() => router.push("/(tabs)/paychecks")}>
            <Text style={styles.navLabel}>Current Check</Text>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => router.push("/(tabs)/liabilities")}>
            <Text style={styles.navLabel}>Liabilities</Text>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => router.push("/(tabs)/expenses")}>
            <Text style={styles.navLabel}>Expenses</Text>
          </Pressable>
        </View>
      </View>

      <SpeedDial
        isOpen={isDialOpen}
        onToggle={() => setIsDialOpen((current) => !current)}
        onAddExpense={() => setModalType("expense")}
        onAddLiability={() => setModalType("liability")}
      />

      <Modal transparent visible={modalType !== null} animationType="fade" onRequestClose={() => setModalType(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalType === "expense" ? "Add Expense" : "Add Liability"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Item"
              placeholderTextColor={theme.colors.textMuted}
              value={item}
              onChangeText={setItem}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              placeholderTextColor={theme.colors.textMuted}
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setModalType(null)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
    fontWeight: "600",
  },
  amount: {
    color: theme.colors.textPrimary,
    fontSize: 52,
    fontWeight: "800",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  navButton: {
    flex: 1,
    minHeight: 120,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  navLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
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
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveLabel: {
    color: theme.colors.onAccent,
    fontWeight: "700",
  },
});
