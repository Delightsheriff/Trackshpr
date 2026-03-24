import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/stores/themeStore";
import { radius, font, layout } from "@/src/constants/tokens";

export function IncompleteProfileBanner() {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/(auth)/profile-setup")}
      style={[styles.profileBanner, { backgroundColor: colors.warningBg }]}
    >
      <View
        style={[styles.bannerIcon, { backgroundColor: "rgba(245,166,35,0.2)" }]}
      >
        <Feather name="briefcase" size={16} color={colors.warning} />
      </View>
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color: colors.warning }]}>
          Complete your profile
        </Text>
        <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
          Add your business name so customers{"\n"}recognise you on tracking
          pages
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.warning} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: layout.listGap,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 15,
  },
});
