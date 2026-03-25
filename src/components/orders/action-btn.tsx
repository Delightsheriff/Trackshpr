import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { font, radius } from "@/src/constants/tokens";

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
      style={[styles.btn, { backgroundColor: bg }]}
      onPress={onPress}
      android_ripple={{ color: fg + "30", borderless: false }}
    >
      <View style={[styles.iconWrap, { backgroundColor: fg + "18" }]}>
        <Feather name={icon} size={20} color={fg} />
      </View>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
