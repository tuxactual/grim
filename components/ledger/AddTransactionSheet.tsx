import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "@/constants/theme";
import { parseAmount } from "@/utils/amount";

type AddTransactionSheetProps = {
  isOpen: boolean;
  isSaving?: boolean;
  allowedTypes?: ("expense" | "income")[];
  onClose: () => void;
  onSave: (input: {
    type: "expense" | "income";
    merchant: string;
    amountCents: number;
    category: string;
    notes: string;
  }) => Promise<void> | void;
};

const EXPENSE_CATEGORIES = ["Food", "Transport", "Home", "Fun"] as const;
const INCOME_CATEGORIES = ["Paycheck", "Bonus", "Refund", "Gift"] as const;

export function AddTransactionSheet({
  isOpen,
  isSaving = false,
  allowedTypes = ["expense", "income"],
  onClose,
  onSave,
}: AddTransactionSheetProps) {
  const initialType = allowedTypes[0] ?? "expense";
  const [type, setType] = useState<"expense" | "income">(initialType);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>(
    EXPENSE_CATEGORIES[0],
  );
  const [incomeCategory, setIncomeCategory] = useState<(typeof INCOME_CATEGORIES)[number]>(
    INCOME_CATEGORIES[0],
  );
  const amountInputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      translateY.setValue(0);
    }
  }, [isOpen, translateY]);

  useEffect(() => {
    if (!isOpen) {
      setType(initialType);
      setMerchant("");
      setAmount("");
      setExpenseCategory(EXPENSE_CATEGORIES[0]);
      setIncomeCategory(INCOME_CATEGORIES[0]);
    }
  }, [initialType, isOpen]);

  const amountCents = parseAmount(amount);
  const selectedCategory = type === "expense" ? expenseCategory : incomeCategory;
  const normalizedAmountCents =
    amountCents === null ? null : type === "expense" ? -Math.abs(amountCents) : Math.abs(amountCents);
  const isValid = merchant.trim().length > 0 && amountCents !== null && amountCents !== 0;
  const nameLabel = type === "expense" ? "Shopkeep" : "Source";
  const namePlaceholder = type === "expense" ? "Enter merchant" : "Enter income source";
  const toggleAccent = type === "expense" ? theme.colors.accent : theme.colors.income;
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function handleSave() {
    if (!isValid || normalizedAmountCents === null) {
      return;
    }

    Keyboard.dismiss();

    await onSave({
      type,
      merchant: merchant.trim(),
      amountCents: normalizedAmountCents,
      category: selectedCategory,
      notes: "",
    });
  }

  function animateSheetClosed() {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: 420,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        translateY.setValue(0);
        onClose();
      }
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const shouldCapture =
          gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);

        if (shouldCapture) {
          Keyboard.dismiss();
        }

        return shouldCapture;
      },
      onPanResponderGrant: () => {
        Keyboard.dismiss();
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 1.1) {
          animateSheetClosed();
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 12,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      visible={isOpen}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>New entry</Text>
            {allowedTypes.length > 1 ? (
              <View style={styles.toggle}>
                <Pressable
                  onPress={() => setType("expense")}
                  style={[
                    styles.toggleButton,
                    type === "expense" && { backgroundColor: theme.colors.accentSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleLabel,
                      type === "expense" && { color: theme.colors.accent },
                    ]}
                  >
                    Expense
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setType("income")}
                  style={[
                    styles.toggleButton,
                    type === "income" && styles.incomeToggleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleLabel,
                      type === "income" && { color: theme.colors.income },
                    ]}
                  >
                    Income
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <Text style={styles.fieldLabel}>{nameLabel}</Text>
            <TextInput
              autoFocus
              placeholder={namePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={merchant}
              onChangeText={setMerchant}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => amountInputRef.current?.focus()}
            />
            <Text style={styles.fieldLabel}>Coin</Text>
            <TextInput
              ref={amountInputRef}
              placeholder="Coin"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.amountInput]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categories}>
              {categories.map((category) => {
                const isSelected = category === selectedCategory;

                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      if (type === "expense") {
                        setExpenseCategory(category as (typeof EXPENSE_CATEGORIES)[number]);
                      } else {
                        setIncomeCategory(category as (typeof INCOME_CATEGORIES)[number]);
                      }
                    }}
                    style={[
                      styles.categoryChip,
                      isSelected && { borderColor: toggleAccent, backgroundColor: theme.colors.accentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipLabel,
                        isSelected && { color: toggleAccent },
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>Girl, keep the change.</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!isValid || isSaving}
              onPress={handleSave}
              style={[styles.saveButton, (!isValid || isSaving) && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveLabel}>Ball Gown!</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: theme.colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.separator,
  },
  sheetContent: {
    gap: theme.spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.borderStrong,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
  },
  incomeToggleActive: {
    backgroundColor: "rgba(59, 209, 138, 0.14)",
  },
  toggleLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  amountInput: {
    fontFamily: theme.fonts.mono,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: "600",
  },
  hint: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.borderStrong,
  },
  saveLabel: {
    color: theme.colors.onAccent,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
