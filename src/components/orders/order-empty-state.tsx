import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

export function OrderEmptyState({ filter }: { filter: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyState}>
      <Feather
        name="clipboard"
        size={36}
        color={colors.primary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No {filter === "all" ? "" : filter.replace("_", " ")} orders
      </Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        Switch filters to see other orders.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { marginBottom: 4 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    textTransform: "capitalize",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
  },
});
