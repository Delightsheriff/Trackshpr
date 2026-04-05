/**
 * SectionHeader — consistent section title with optional action link.
 * Design system: DS §3 (capsLg style), DS §8.3 (ghost button)
 *
 * Usage:
 *   <SectionHeader title="Recent Orders" />
 *   <SectionHeader title="Recent Orders" actionLabel="See all" onAction={() => router.push('/orders')} />
 */
import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.08,
    textTransform: "uppercase",
  },
  action: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: -0.13,
  },
});
