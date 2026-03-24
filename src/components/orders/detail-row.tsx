import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

export function DetailRow({
  label,
  value,
  valueStyle,
  mono,
  separator,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  mono?: boolean;
  separator?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          style={[
            mono ? styles.detailValueMono : styles.detailValue,
            { color: colors.textPrimary },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      </View>
      {separator && (
        <View
          style={[
            styles.detailSep,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  detailValueMono: {
    fontSize: 13,
    fontFamily: font.mono.regular,
    flex: 1,
    textAlign: "right",
  },
  detailSep: {
    height: 1,
  },
});
