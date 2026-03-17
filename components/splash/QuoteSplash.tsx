import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";

type QuoteSplashProps = {
  quote: string;
  onComplete: () => void;
};

export function QuoteSplash({ quote, onComplete }: QuoteSplashProps) {
  const opacity = useSharedValue(0);
  const [firstLine = "", secondLine = ""] = quote.split("\n");

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 2400 }),
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      }),
    );
  }, [onComplete, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={[styles.quote, styles.firstLine]}>{firstLine}</Text>
        <Text style={[styles.quote, styles.secondLine]}>{secondLine}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.layout.screenPadding,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  quote: {
    maxWidth: "80%",
    fontSize: 28,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "700",
  },
  firstLine: {
    color: theme.colors.income,
    marginBottom: 18,
  },
  secondLine: {
    color: theme.colors.accentSoft,
    lineHeight: 34,
  },
});
