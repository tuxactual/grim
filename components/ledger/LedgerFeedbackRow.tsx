import { useEffect, useRef } from "react";
import { StyleSheet, Text } from "react-native";
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
};

export function LedgerFeedbackRow({ transaction, isNew }: LedgerFeedbackRowProps) {
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
      style={[styles.row, animatedStyles]}
    >
      <Text style={styles.merchant}>{transaction.merchant}</Text>
      <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
        {formatAmount(transaction.amountCents)}
      </Text>
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
  merchant: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: "500",
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
});
