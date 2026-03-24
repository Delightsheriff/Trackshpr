import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { font } from "@/src/constants/tokens";

export function ActionBtn({
  icon,
  label,
  bg,
  fg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  bg: string;
  fg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: bg }]}
      onPress={onPress}
      android_ripple={{ color: fg, borderless: false }}
    >
      <Feather name={icon} size={16} color={fg} />
      <Text style={[styles.actionBtnLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textAlign: "center",
  },
});
