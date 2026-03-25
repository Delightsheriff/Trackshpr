import React from "react";
import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";
import { layout, radius, font } from "@/src/constants/tokens";
import { Order } from "./order-types";

function copyLink(url: string) {
  Share.share({ message: url });
}

export function MagicLinkCard({ order }: { order: Order }) {
  const { colors, isDark } = useTheme();

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
          <View
            style={[
              styles.magicIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Feather name="truck" size={14} color={colors.primary} />
          </View>
          <View style={styles.magicBody}>
            <Text
              style={[
                styles.magicRowLabel,
                { color: colors.textPrimary },
              ]}
            >
              Rider link
            </Text>
            <Text
              style={[styles.magicUrl, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              trk.sh/rider/{order.riderToken}
            </Text>
          </View>
          <Pressable
            style={[
              styles.copyBtn,
              { backgroundColor: colors.primarySoft },
            ]}
            onPress={() =>
              copyLink("https://trk.sh/rider/" + order.riderToken)
            }
          >
            <Text style={[styles.copyBtnText, { color: colors.primary }]}>
              Copy
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.detailSep,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />

        <View style={styles.magicRow}>
          <View
            style={[
              styles.magicIcon,
              { backgroundColor: colors.successBg },
            ]}
          >
            <Feather name="navigation" size={14} color={colors.success} />
          </View>
          <View style={styles.magicBody}>
            <Text
              style={[
                styles.magicRowLabel,
                { color: colors.textPrimary },
              ]}
            >
              Customer tracking link
            </Text>
            <Text
              style={[styles.magicUrl, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              trk.sh/track/{order.customerToken}
            </Text>
          </View>
          <Pressable
            style={[
              styles.copyBtn,
              { backgroundColor: colors.primarySoft },
            ]}
            onPress={() =>
              copyLink("https://trk.sh/track/" + order.customerToken)
            }
          >
            <Text style={[styles.copyBtnText, { color: colors.primary }]}>
              Copy
            </Text>
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
  detailSep: {
    height: 1,
  },
});
