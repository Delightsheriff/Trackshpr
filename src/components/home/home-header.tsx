import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/stores/themeStore";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { greeting } from "./home-types";

export function HomeHeader({ businessName = "Zara's Closet", initial = "Z" }: { businessName?: string, initial?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.textMuted }]}>
          {greeting()}
        </Text>
        <Text style={[styles.businessName, { color: colors.textPrimary }]}>
          {businessName}
        </Text>
      </View>
      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={gradients.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>{initial}</Text>
        </LinearGradient>
        <View style={[styles.notifDot, { borderColor: colors.surface }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.sectionGap,
    paddingTop: 6,
  },
  greeting: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  notifDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: "#DC2626",
    borderWidth: 2,
  },
});
