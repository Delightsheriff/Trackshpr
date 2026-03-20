/**
 * Settings tab — profile, plan upgrade, preferences, sign out.
 * Dark mode toggle wired to useThemeStore. DS §9.1, §7.4.
 * TODO: replace DUMMY_PROFILE with real Supabase session.
 * TODO: wire sign-out to supabase.auth.signOut() + confirmation sheet.
 */
import { colors, font, gradients, layout, radius } from "@/src/constants/tokens";
import { router } from "expo-router";
import { useThemeStore } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Dummy data — TODO: replace with real Supabase session ────────────────────
const DUMMY_PROFILE = {
  business_name: "Zara's Closet",
  city: "Lagos",
  plan: "free" as const,
};

// ── Toggle switch (DS §8.7) ───────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const progress = useDerivedValue(() =>
    withTiming(value ? 1 : 0, { duration: 200 })
  );

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceContainer, colors.primary]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 20 : 2, { duration: 200 }) }],
  }));

  return (
    <Pressable onPress={() => onChange(!value)}>
      <Animated.View style={[styles.toggleTrack, trackStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────
function SettingRow({
  icon,
  iconBg,
  label,
  sublabel,
  right,
  onPress,
  danger,
}: {
  icon: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: colors.surfaceContainer, borderless: false }}
      style={styles.settingRow}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.settingIconEmoji}>{icon}</Text>
      </View>
      <View style={styles.settingBody}>
        <Text style={[styles.settingLabel, danger && { color: colors.error }]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
      </View>
      {right ?? (
        onPress && <Feather name="chevron-right" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingGroup}>{children}</View>;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggle } = useThemeStore();
  const [notifs, setNotifs] = useState(true);

  const initials = DUMMY_PROFILE.business_name
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile hero banner ───────────────────────────────────────── */}
        <View style={{ paddingTop: insets.top }}>
          <LinearGradient
            colors={["#4647D3", "#5354e8", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileBanner}
          >
            <View style={styles.bannerOrb1} />
            <View style={styles.bannerOrb2} />
          </LinearGradient>

          {/* Avatar overlapping banner */}
          <View style={styles.profileSection}>
            <View style={styles.profileAvatarWrap}>
              <LinearGradient
                colors={gradients.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileAvatar}
              >
                <Text style={styles.profileAvatarText}>{initials}</Text>
              </LinearGradient>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{DUMMY_PROFILE.business_name}</Text>
              <View style={styles.profileMetaRow}>
                <Text style={styles.profileCity}>📍 {DUMMY_PROFILE.city}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Free plan</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Upgrade banner ────────────────────────────────────────────── */}
        <View style={styles.upgradeBanner}>
          <View style={styles.upgradeBannerLeft}>
            <Text style={styles.upgradeBannerTitle}>Unlock Trackshpr Pro</Text>
            <Text style={styles.upgradeBannerSub}>
              Unlimited orders, custom branding, priority support
            </Text>
          </View>
          <View style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </View>
        </View>

        {/* ── Business ──────────────────────────────────────────────────── */}
        <SectionLabel label="Business" />
        <SettingGroup>
          <SettingRow
            icon="🏪"
            iconBg={colors.primarySoft}
            label="Business details"
            sublabel="Name, phone, city"
            onPress={() => router.push("/(settings)/business-details")}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="🎨"
            iconBg={colors.warningBg}
            label="Brand customization"
            sublabel="Logo, colors"
            onPress={() => router.push("/(settings)/brand-customization")}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="📊"
            iconBg={colors.successBg}
            label="Export history"
            sublabel="Download CSV"
            onPress={() => {}}
          />
        </SettingGroup>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <SectionLabel label="Preferences" />
        <SettingGroup>
          <SettingRow
            icon="🌙"
            iconBg={colors.surfaceContainer}
            label="Dark mode"
            right={<Toggle value={isDark} onChange={toggle} />}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="🔔"
            iconBg={colors.primarySoft}
            label="Push notifications"
            right={<Toggle value={notifs} onChange={setNotifs} />}
          />
        </SettingGroup>

        {/* ── Support ───────────────────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SettingGroup>
          <SettingRow
            icon="💬"
            iconBg={colors.infoBg}
            label="Help & support"
            sublabel="Chat with us"
            onPress={() => {}}
          />
        </SettingGroup>

        {/* ── Danger zone ───────────────────────────────────────────────── */}
        <SettingGroup>
          {/* TODO: show confirmation sheet (DS §11.4) before signing out */}
          <SettingRow
            icon="🚪"
            iconBg={colors.errorBg}
            label="Sign out"
            danger
            onPress={() => {}}
          />
        </SettingGroup>

        {/* ── Version ───────────────────────────────────────────────────── */}
        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: {},

  // Profile banner
  profileBanner: {
    height: 100,
    overflow: "hidden",
  },
  bannerOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  bannerOrb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: 24,
  },

  // Profile section
  profileSection: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 16,
    backgroundColor: colors.surfaceCard,
    marginBottom: layout.sectionGap,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatarWrap: {
    marginTop: -28,
    marginBottom: 10,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surfaceCard,
  },
  profileAvatarText: {
    fontSize: 22,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },
  profileMeta: { gap: 4 },
  profileName: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileCity: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },
  planBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
    color: colors.primary,
  },

  // Upgrade banner
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.sectionGap,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
  },
  upgradeBannerLeft: { flex: 1 },
  upgradeBannerTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  upgradeBannerSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 8,
    marginTop: 4,
  },

  // Setting group
  settingGroup: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.sectionGap,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginLeft: 62,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingIconEmoji: { fontSize: 16 },
  settingBody: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.14,
  },
  settingSubLabel: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Toggle switch (DS §8.7) — 40×22px
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: radius.full,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // Version
  version: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
    paddingTop: 8,
  },
});
