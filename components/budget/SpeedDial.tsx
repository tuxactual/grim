import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onAddExpense: () => void;
  onAddLiability: () => void;
};

export function SpeedDial({ isOpen, onToggle, onAddExpense, onAddLiability }: Props) {
  return (
    <View style={styles.container}>
      {isOpen ? (
        <>
          <Pressable style={styles.action} onPress={onAddExpense}>
            <Text style={styles.actionLabel}>Add Expense</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={onAddLiability}>
            <Text style={styles.actionLabel}>Add Liability</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable style={styles.fab} onPress={onToggle}>
        <Text style={styles.fabLabel}>{isOpen ? "x" : "+"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: theme.layout.fabRight,
    bottom: theme.layout.fabBottom,
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  action: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  actionLabel: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabel: {
    color: theme.colors.onAccent,
    fontSize: 32,
    lineHeight: 32,
  },
});
