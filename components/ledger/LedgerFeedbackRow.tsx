import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  Layout,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import type { Transaction } from "@/types/transaction";
import { formatAmount } from "@/utils/amount";

type LedgerFeedbackRowProps = {
  transaction: Transaction;
  isNew: boolean;
  onComplete?: (transactionId: string) => void;
};

export function LedgerFeedbackRow({ transaction, isNew, onComplete }: LedgerFeedbackRowProps) {
  const isExpense = transaction.amountCents < 0;
  const highlightOpacity = useSharedValue(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!isNew || hasAnimatedRef.current) {
      return;
    }

    hasAnimatedRef.current = true;
    highlightOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 300 }),
    );
  }, [highlightOpacity, isNew]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        highlightOpacity.value,
        [0, 1],
        [theme.colors.highlightTransparent, theme.colors.highlight],
      ),
    };
  }, [highlightOpacity, isNew]);

  return (
    <Animated.View
      entering={
        isNew
          ? FadeIn.duration(180).withInitialValues({
              opacity: 0,
              transform: [{ translateY: 12 }],
            })
          : undefined
      }
      layout={Layout.springify()}
      style={animatedStyles}
    >
      <Pressable
        disabled={transaction.isCompleted || !onComplete}
        onPress={() => onComplete?.(transaction.id)}
        style={[styles.row, transaction.isCompleted && styles.rowCompleted]}
      >
        <View style={styles.merchantBlock}>
          <Text style={[styles.merchant, transaction.isCompleted && styles.completedText]}>
            {transaction.merchant}
          </Text>
          {transaction.carriedForwardFromId ? (
            <Text style={styles.meta}>Carried forward</Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.amount,
            isExpense ? styles.expense : styles.income,
            transaction.isCompleted && styles.completedText,
          ]}
        >
          {formatAmount(transaction.amountCents)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: theme.spacing.md,
  },
  rowCompleted: {
    opacity: 0.7,
  },
  merchantBlock: {
    flex: 1,
    gap: 2,
  },
  merchant: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "500",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  amount: {
    width: theme.layout.rowAmountWidth,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "700",
    fontFamily: theme.fonts.mono,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  income: {
    color: theme.colors.income,
  },
  expense: {
    color: theme.colors.accent,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: theme.colors.textMuted,
  },
});
