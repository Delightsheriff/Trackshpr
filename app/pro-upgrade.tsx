import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useSession } from "@/src/hooks";
import { PRO_FEATURES } from "@/src/lib/proFeatures";
import { supabase } from "@/src/lib/supabase";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURE_LIST = [
  PRO_FEATURES.inventory,
  PRO_FEATURES["voice-entry"],
  PRO_FEATURES["white-label-branding"],
];

export default function ProUpgradeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const showToast = useToastStore((state) => state.show);
  const [isPending, setIsPending] = useState(false);

  const backBtnShadow = isDark
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
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
      };

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

  const handleNotifyMe = async () => {
    if (!userId || isPending) return;

    setIsPending(true);

    try {
      const { error } = await supabase
        .from("pro_waitlist")
        .upsert({ seller_id: userId }, { onConflict: "seller_id" });

      if (error) {
        throw error;
      }

      showToast(
        "You're on the Pro waitlist. We'll keep you posted.",
        "success",
      );
    } catch {
      showToast(
        "Couldn't save your interest right now. Please try again.",
        "error",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, backgroundColor: colors.surface },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { backgroundColor: colors.surfaceCard }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: colors.surfaceContainer },
            backBtnShadow,
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Pro Upgrade
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroOrb} />
          <Text style={styles.heroEyebrow}>Pro coming soon</Text>
          <Text style={styles.heroTitle}>We&apos;re getting Pro ready</Text>
          <Text style={styles.heroSub}>
            Join the waitlist to hear when advanced seller tools are ready for
            your account.
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.featureCard,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
          ]}
        >
          {FEATURE_LIST.map((feature, index) => (
            <View key={feature.title}>
              {index > 0 ? (
                <View
                  style={[
                    styles.featureDivider,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                />
              ) : null}
              <View style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather name="zap" size={15} color={colors.primary} />
                </View>
                <View style={styles.featureBody}>
                  <Text
                    style={[styles.featureTitle, { color: colors.textPrimary }]}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={[styles.featureSub, { color: colors.textMuted }]}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}
        >
          <Feather
            name="bell"
            size={16}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            The notify button stores your interest against your seller account
            so we can prioritize the right launch list.
          </Text>
        </View>

        <View style={[styles.saveShadow, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={handleNotifyMe}
            disabled={isPending}
            style={styles.savePressable}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Notify me</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 8,
    paddingTop: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  headerSpacer: { width: 34 },
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 12,
    gap: 12,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: 18,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -20,
    top: -25,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: "#FFFFFF",
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
    color: "rgba(255,255,255,0.72)",
  },
  featureCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  featureDivider: {
    height: 1,
    marginLeft: 60,
  },
  featureRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureBody: { flex: 1 },
  featureTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.lg,
    padding: 12,
    paddingHorizontal: 14,
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  saveShadow: {
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 4,
  },
  savePressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
