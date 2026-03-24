import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/stores/themeStore";
import { font, gradients, layout } from "@/src/constants/tokens";
import { greeting } from "./home-types";

export function HomeHeader({
  businessName = "",
  initial = "?",
  logoUrl,
  updatedAt,
}: {
  businessName?: string;
  initial?: string;
  logoUrl?: string | null;
  updatedAt?: string | null;
}) {
  const { colors } = useTheme();
  const cacheBuster = updatedAt ? new Date(updatedAt).getTime() : 0;

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
      {logoUrl ? (
        <Image
          source={{ uri: `${logoUrl}?v=${cacheBuster}` }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={gradients.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>{initial}</Text>
        </LinearGradient>
      )}
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
});
