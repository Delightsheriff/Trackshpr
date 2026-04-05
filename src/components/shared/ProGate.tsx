import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProfile, useSession } from "@/src/hooks";
import { getProFeatureMeta, type ProFeatureKey } from "@/src/lib/proFeatures";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface ProGateProps extends PropsWithChildren {
  feature: ProFeatureKey | string;
}

export default function ProGate({ feature, children }: ProGateProps) {
  const { userId } = useSession();
  const { colors, isDark } = useTheme();
  const { data: profile, isLoading, isError, refetch } = useProfile(userId);
  const featureMeta = getProFeatureMeta(feature);

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

  if (isLoading) {
    return (
      <View style={[styles.stateCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          Checking your plan
        </Text>
        <Text style={[styles.stateSub, { color: colors.textMuted }]}>
          We&apos;re loading your access for {featureMeta.title.toLowerCase()}.
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.stateCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
        <View style={[styles.stateIcon, { backgroundColor: colors.errorBg }]}>
          <Feather name="wifi-off" size={20} color={colors.error} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          Couldn&apos;t load your plan
        </Text>
        <Text style={[styles.stateSub, { color: colors.textMuted }]}>
          Check your connection and try again.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.secondaryButton, { backgroundColor: colors.surfaceContainer }]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (profile?.is_pro) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.lockedCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      <View style={[styles.stateIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name="lock" size={20} color={colors.primary} />
      </View>
      <Text style={[styles.stateEyebrow, { color: colors.primary }]}>Pro Feature</Text>
      <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
        {featureMeta.title}
      </Text>
      <Text style={[styles.stateSub, { color: colors.textMuted }]}>
        {featureMeta.description}
      </Text>
      <View style={styles.ctaShadow}>
        <Pressable onPress={() => router.push("/pro-upgrade")} style={styles.ctaPressable}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Upgrade to Pro</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    alignItems: "center",
    gap: 8,
  },
  stateCard: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    alignItems: "center",
    gap: 10,
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stateEyebrow: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stateTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    textAlign: "center",
  },
  stateSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
    textAlign: "center",
  },
  ctaShadow: {
    width: "100%",
    marginTop: 4,
    borderRadius: radius.full,
    shadowColor: "rgba(70,71,211,1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  ctaButton: {
    borderRadius: radius.full,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  ctaButtonText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    borderRadius: radius.full,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
