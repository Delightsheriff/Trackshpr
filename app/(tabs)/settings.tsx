/**
 * Settings tab — profile, plan upgrade, preferences, account.
 * Dark mode toggle wired to useThemeStore. DS §9.1, §7.4.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProfile, useSession } from "@/src/hooks";
import { useTheme, useThemeStore } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

// ── Toggle switch (DS §8.7) ───────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();

  const progress = useDerivedValue(() =>
    withTiming(value ? 1 : 0, { duration: 200 }),
  );

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceContainer, colors.primary],
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
  iconColor,
  iconBg,
  label,
  sublabel,
  right,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor?: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: colors.surfaceContainer, borderless: false }}
      style={styles.settingRow}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Feather
          name={icon}
          size={18}
          color={iconColor ?? colors.textPrimary}
        />
      </View>
      <View style={styles.settingBody}>
        <Text
          style={[
            styles.settingLabel,
            { color: danger ? colors.error : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {right ??
        (onPress && (
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        ))}
    </Pressable>
  );
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const groupShadow = isDark
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
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      };
  return (
    <View
      style={[
        styles.settingGroup,
        { backgroundColor: colors.surfaceCard },
        groupShadow,
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label}
    </Text>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { toggle } = useThemeStore();
  const [notifs, setNotifs] = useState(true);
  const { userId } = useSession();
  const { data: profile } = useProfile(userId);

  const profileSectionShadow = isDark
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

  const businessName = profile?.business_name ?? "My Business";
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile hero banner ───────────────────────────────────────── */}
        <View>
          <LinearGradient
            colors={["#4647D3", "#5354e8", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.profileBanner, { paddingTop: insets.top }]}
          >
            <View style={styles.bannerOrb1} />
            <View style={styles.bannerOrb2} />
          </LinearGradient>

          {/* Avatar overlapping banner */}
          <View
            style={[
              styles.profileSection,
              { backgroundColor: colors.surfaceCard },
              profileSectionShadow,
            ]}
          >
            <View style={styles.profileAvatarWrap}>
              {profile?.logo_url ? (
                <Image
                  source={{
                    uri: `${profile.logo_url}?t=${profile.updated_at}`,
                  }}
                  style={[styles.profileAvatar, styles.profileAvatarImg, { borderColor: colors.surfaceCard }]}
                  cachePolicy="none"
                />
              ) : (
                <LinearGradient
                  colors={gradients.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.profileAvatar, { borderColor: colors.surfaceCard }]}
                >
                  <Text style={styles.profileAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {businessName}
              </Text>
              <View style={styles.profileMetaRow}>
                {!!profile?.city && (
                  <Text style={[styles.profileCity, { color: colors.textMuted }]}>
                    <Feather name="map-pin" size={12} color={colors.textMuted} />{" "}
                    {profile.city}
                  </Text>
                )}
                <View
                  style={[
                    styles.planBadge,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[styles.planBadgeText, { color: colors.primary }]}
                  >
                    Free plan
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Upgrade banner ────────────────────────────────────────────── */}
        <View
          style={[
            styles.upgradeBanner,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <View style={styles.upgradeBannerLeft}>
            <Text
              style={[styles.upgradeBannerTitle, { color: colors.primary }]}
            >
              Unlock Trackshpr Pro
            </Text>
            <Text
              style={[styles.upgradeBannerSub, { color: colors.textSecondary }]}
            >
              Unlimited orders, custom branding, priority support
            </Text>
          </View>
          <View
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </View>
        </View>

        {/* ── Business ──────────────────────────────────────────────────── */}
        <SectionLabel label="Business" />
        <SettingGroup>
          <SettingRow
            icon="briefcase"
            iconColor={colors.primary}
            iconBg={colors.primarySoft}
            label="Business details"
            sublabel="Name, phone, city"
            onPress={() => router.push("/(settings)/business-details")}
          />
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: colors.surfaceContainer },
            ]}
          />
          <SettingRow
            icon="sliders"
            iconColor={colors.warning}
            iconBg={colors.warningBg}
            label="Brand customization"
            sublabel="Logo, colors"
            onPress={() => router.push("/(settings)/brand-customization")}
          />
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: colors.surfaceContainer },
            ]}
          />
          <SettingRow
            icon="download"
            iconColor={colors.success}
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
            icon="moon"
            iconColor={colors.textSecondary}
            iconBg={colors.surfaceContainer}
            label="Dark mode"
            right={<Toggle value={isDark} onChange={toggle} />}
          />
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: colors.surfaceContainer },
            ]}
          />
          <SettingRow
            icon="bell"
            iconColor={colors.primary}
            iconBg={colors.primarySoft}
            label="Push notifications"
            right={<Toggle value={notifs} onChange={setNotifs} />}
          />
        </SettingGroup>

        {/* ── Support ───────────────────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SettingGroup>
          <SettingRow
            icon="message-circle"
            iconColor={colors.info}
            iconBg={colors.infoBg}
            label="Help & support"
            sublabel="Chat with us"
            onPress={() => {}}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
          <SettingRow
            icon="user"
            iconColor={colors.textSecondary}
            iconBg={colors.surfaceContainer}
            label="Account"
            sublabel="Sign out, delete account"
            onPress={() => router.push("/(settings)/account")}
          />
        </SettingGroup>

        {/* ── Version ───────────────────────────────────────────────────── */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
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
    marginBottom: layout.sectionGap,
  },
  profileAvatarWrap: {
    marginTop: -28,
    marginBottom: 10,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  profileAvatarImg: {
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  profileAvatarText: {
    fontSize: 22,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileMeta: { gap: 4 },
  profileName: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileCity: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
  planBadge: {
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
  },

  // Upgrade banner
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.sectionGap,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
  },
  upgradeBannerLeft: { flex: 1 },
  upgradeBannerTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  upgradeBannerSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 15,
  },
  upgradeBtn: {
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.55,
    textTransform: "uppercase",
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 8,
    marginTop: 4,
  },

  // Setting group
  settingGroup: {
    borderRadius: radius.xl,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.sectionGap,
    overflow: "hidden",
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
  settingBody: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: -0.14,
  },
  settingSubLabel: {
    fontSize: 11,
    fontFamily: font.sans.regular,
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
    backgroundColor: "#FFFFFF",
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
    paddingTop: 8,
  },
});
