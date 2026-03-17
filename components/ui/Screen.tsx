import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

export function Screen({ title, children }: any) {
  return (
    <SafeAreaView style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 12,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
});
