import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font, layout } from "@/src/constants/tokens";
import { DUMMY_STATS } from "./home-types";

export function MiniStatRow() {
  const { colors, isDark } = useTheme();

  const statCardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      };

  return (
    <View style={styles.statRow}>
      <View
        style={[
          styles.statMini,
          { backgroundColor: colors.surfaceCard },
          statCardShadow,
        ]}
      >
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Done
        </Text>
        <Text style={[styles.statNum, { color: colors.success }]}>
          {DUMMY_STATS.delivered}
        </Text>
      </View>
      <View
        style={[
          styles.statMini,
          { backgroundColor: colors.surfaceCard },
          statCardShadow,
        ]}
      >
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Moving
        </Text>
        <Text style={[styles.statNum, { color: colors.warning }]}>
          {DUMMY_STATS.inTransit}
        </Text>
      </View>
      <View
        style={[
          styles.statMini,
          { backgroundColor: colors.surfaceCard },
          statCardShadow,
        ]}
      >
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Failed
        </Text>
        <Text style={[styles.statNum, { color: colors.error }]}>
          {DUMMY_STATS.failed}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: layout.sectionGap,
  },
  statMini: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statNum: {
    fontSize: 22,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -0.44,
  },
});
