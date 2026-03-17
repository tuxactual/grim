import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";

type LedgerQuoteProps = {
  quote: string;
  triggerKey: number;
};

export function LedgerQuote({ quote, triggerKey }: LedgerQuoteProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(1, { duration: 1600 }),
      withTiming(0, { duration: 280 }),
    );
  }, [opacity, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={styles.quote}>{quote}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    justifyContent: "center",
    marginTop: -2,
    marginBottom: 10,
  },
  quote: {
    color: theme.colors.quoteAccent,
    fontSize: theme.typography.subtitle,
    fontStyle: "italic",
    lineHeight: 30,
    letterSpacing: 0.2,
  },
});
