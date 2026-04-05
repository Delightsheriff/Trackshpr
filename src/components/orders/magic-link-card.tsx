import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { layout, radius, font } from "@/src/constants/tokens";
import { Order } from "./order-types";

const APP_URL = "https://trackshpr.app";

export function MagicLinkCard({ order }: { order: Order }) {
  const { colors, isDark } = useTheme();
  const showToast = useToastStore((s) => s.show);

  const cardShadow = isDark
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
        shadowRadius: 8,
        elevation: 2,
      };

  const handleCopyRider = async () => {
    await Clipboard.setStringAsync(`${APP_URL}/rider/${order.riderToken}`);
    showToast("Rider link copied", "success");
  };

  const handleCopyTracking = async () => {
    await Clipboard.setStringAsync(`${APP_URL}/track/${order.customerToken}`);
    showToast("Tracking link copied", "success");
  };

  return (
    <>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Magic Links
      </Text>
      <View
        style={[
          styles.magicCard,
          { backgroundColor: colors.surfaceCard },
          cardShadow,
        ]}
      >
        <View style={styles.magicRow}>
          <View style={[styles.magicIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="truck" size={14} color={colors.primary} />
          </View>
          <View style={styles.magicBody}>
            <Text style={[styles.magicRowLabel, { color: colors.textPrimary }]}>
              Rider link
            </Text>
            <Text style={[styles.magicUrl, { color: colors.textMuted }]} numberOfLines={1}>
              trackshpr.app/rider/{order.riderToken}
            </Text>
          </View>
          <Pressable
            style={[styles.copyBtn, { backgroundColor: colors.primarySoft }]}
            onPress={handleCopyRider}
          >
            <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy</Text>
          </Pressable>
        </View>

        <View style={[styles.gap, { backgroundColor: colors.surfaceContainer }]} />

        <View style={styles.magicRow}>
          <View style={[styles.magicIcon, { backgroundColor: colors.successBg }]}>
            <Feather name="navigation" size={14} color={colors.success} />
          </View>
          <View style={styles.magicBody}>
            <Text style={[styles.magicRowLabel, { color: colors.textPrimary }]}>
              Customer tracking link
            </Text>
            <Text style={[styles.magicUrl, { color: colors.textMuted }]} numberOfLines={1}>
              trackshpr.app/track/{order.customerToken}
            </Text>
          </View>
          <Pressable
            style={[styles.copyBtn, { backgroundColor: colors.primarySoft }]}
            onPress={handleCopyTracking}
          >
            <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 10,
  },
  magicCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  magicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  magicIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  magicBody: { flex: 1, minWidth: 0 },
  magicRowLabel: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginBottom: 2,
  },
  magicUrl: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    maxWidth: 160,
  },
  copyBtn: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  // Background-shift row separator — replaces 1px border (DS §1)
  gap: {
    height: 8,
    marginHorizontal: -14,
  },
});
