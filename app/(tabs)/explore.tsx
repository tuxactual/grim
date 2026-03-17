import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";

export default function SettingsScreen() {
  return (
    <Screen title="Settings">
      <View style={styles.container}>
        <Text style={styles.text}>Settings will come after the ledger flow is stable.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
});
