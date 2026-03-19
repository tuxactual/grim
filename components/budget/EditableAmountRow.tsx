import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  amount: string;
  completed?: boolean;
  isRevealed: boolean;
  onPress: () => void;
  onToggleComplete?: () => void;
  onEdit: () => void;
};

export function EditableAmountRow({
  title,
  subtitle,
  amount,
  completed = false,
  isRevealed,
  onPress,
  onToggleComplete,
  onEdit,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={[styles.editAction, isRevealed && styles.editActionVisible]} onPress={onEdit}>
        <Text style={styles.editLabel}>Edit</Text>
      </Pressable>
      <Pressable style={[styles.row, isRevealed && styles.rowShifted]} onPress={onPress}>
        <Pressable style={[styles.check, completed && styles.checkCompleted]} onPress={onToggleComplete}>
          <Text style={styles.checkLabel}>{completed ? "X" : ""}</Text>
        </Pressable>
        <View style={styles.meta}>
          <Text style={[styles.title, completed && styles.completed]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[styles.amount, completed && styles.completed]}>{amount}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  editAction: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.expense,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  editActionVisible: {
    opacity: 1,
  },
  editLabel: {
    color: theme.colors.onAccent,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
  },
  rowShifted: {
    transform: [{ translateX: -84 }],
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.separator,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCompleted: {
    backgroundColor: theme.colors.income,
    borderColor: theme.colors.income,
  },
  checkLabel: {
    color: theme.colors.onAccent,
    fontWeight: "700",
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  amount: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  completed: {
    color: theme.colors.textMuted,
    textDecorationLine: "line-through",
  },
});
