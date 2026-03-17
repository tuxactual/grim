import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

const FEEDBACK_DURATION_MS = 1800;

export function useLedgerFeedback() {
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSaveHaptic = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics can fail silently on unsupported platforms.
    }
  }, []);

  const markTransactionInserted = useCallback((transactionId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setHighlightedTransactionId(transactionId);
    timeoutRef.current = setTimeout(() => {
      setHighlightedTransactionId((current) =>
        current === transactionId ? null : current,
      );
    }, FEEDBACK_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    highlightedTransactionId,
    markTransactionInserted,
    triggerSaveHaptic,
  };
}
