import React from "react";
import { ScrollView, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/stores/themeStore";
import { font, layout } from "@/src/constants/tokens";
import { QUICK_ACTIONS } from "./home-types";

export function QuickActionsRow() {
  const { colors, isDark } = useTheme();

  const chipShadow = isDark
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
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRow}
    >
      {QUICK_ACTIONS.map(({ icon, label, route }) => (
        <Pressable
          key={label}
          style={[
            styles.quickChip,
            { backgroundColor: colors.surfaceCard },
            chipShadow,
          ]}
          onPress={route ? () => router.push(route as any) : undefined}
        >
          <Feather
            name={icon}
            size={14}
            color={colors.textSecondary}
            style={styles.quickChipIcon}
          />
          <Text
            style={[styles.quickChipLabel, { color: colors.textPrimary }]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
    marginBottom: layout.sectionGap,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  quickChipIcon: { flexShrink: 0 },
  quickChipLabel: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
