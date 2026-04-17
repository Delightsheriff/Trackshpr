/**
 * Settings tab - profile, plan upgrade, preferences, account.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import {
  useNotificationFailures,
  useProfile,
  useSession,
} from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useTheme, useThemeStore } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
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
        <Feather name={icon} size={18} color={iconColor ?? colors.textPrimary} />
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
        {sublabel ? (
          <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        ) : null)}
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
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>
  );
}

function StateCard({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  cta,
  ctaLabel,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  cta?: () => void;
  ctaLabel?: string;
}) {
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
    <View style={[styles.stateCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      <View style={[styles.stateIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.stateSub, { color: colors.textMuted }]}>{sub}</Text>
      {cta && ctaLabel ? (
        <Pressable onPress={cta} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.retryButtonText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatCsvValue(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatExportDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString();
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { userId } = useSession();
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useProfile(userId);
  const { data: failures = [] } = useNotificationFailures(userId);
  const showToast = useToastStore((state) => state.show);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setNotifEnabled(!!profile?.push_token);
  }, [profile?.push_token]);

  const businessName = profile?.business_name ?? "My Business";
  const initials = useMemo(
    () =>
      businessName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [businessName],
  );

  const exportCSV = async () => {
    if (!userId || exporting) return;

    setExporting(true);

    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "order_number, item, customer_name, rider_name, status, delivery_fee, created_at, delivered_at",
        )
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!orders?.length) {
        showToast("No order history to export yet.", "info");
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        showToast("Sharing is not available on this device.", "error");
        return;
      }

      const header = [
        "order number",
        "item",
        "customer name",
        "rider name",
        "status",
        "delivery fee",
        "created at",
        "delivered at",
      ]
        .map(formatCsvValue)
        .join(",");

      const rows = orders
        .map((order) =>
          [
            order.order_number,
            order.item,
            order.customer_name,
            order.rider_name,
            order.status,
            order.delivery_fee,
            formatExportDate(order.created_at),
            formatExportDate(order.delivered_at),
          ]
            .map(formatCsvValue)
            .join(","),
        )
        .join("\n");

      const filePath = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}trackshpr-order-history.csv`;
      await FileSystem.writeAsStringAsync(filePath, `${header}\n${rows}`);
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Export order history",
        UTI: "public.comma-separated-values-text",
      });
    } catch {
      showToast("Couldn't export your order history. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleNotifToggle = () => {
    showToast("Notifications are not available yet.", "info");
  };

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

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <StateCard
            icon="loader"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            title="Loading settings"
            sub="We&apos;re pulling your latest business details."
          />
        ) : isError ? (
          <StateCard
            icon="wifi-off"
            iconBg={colors.errorBg}
            iconColor={colors.error}
            title="Couldn't load your settings"
            sub="Check your connection and try again."
            cta={() => refetch()}
            ctaLabel="Try Again"
          />
        ) : (
          <>
            <View>
              <LinearGradient
                colors={["#4647D3", "#5354E8", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profileBanner, { paddingTop: insets.top }]}
              >
                <View style={styles.bannerOrb1} />
                <View style={styles.bannerOrb2} />
              </LinearGradient>

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
                        uri: profile.updated_at
                          ? `${profile.logo_url}?v=${new Date(profile.updated_at).getTime()}`
                          : profile.logo_url,
                      }}
                      style={[
                        styles.profileAvatar,
                        styles.profileAvatarImg,
                        { borderColor: colors.surfaceCard },
                      ]}
                      contentFit="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={gradients.avatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.profileAvatar,
                        { borderColor: colors.surfaceCard },
                      ]}
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
                    {profile?.city ? (
                      <Text style={[styles.profileCity, { color: colors.textMuted }]}>
                        {profile.city}
                      </Text>
                    ) : null}
                    <View
                      style={[
                        styles.planBadge,
                        {
                          backgroundColor: profile?.is_pro
                            ? colors.successBg
                            : colors.primarySoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.planBadgeText,
                          {
                            color: profile?.is_pro ? colors.success : colors.primary,
                          },
                        ]}
                      >
                        {profile?.is_pro ? "Pro plan" : "Free plan"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {!profile?.is_pro ? (
              <Pressable onPress={() => router.push("/pro-upgrade")}>
                <View style={[styles.upgradeBanner, { backgroundColor: colors.primarySoft }]}>
                  <View style={styles.upgradeBannerLeft}>
                    <Text style={[styles.upgradeBannerTitle, { color: colors.primary }]}>
                      Unlock Trackshpr Pro
                    </Text>
                    <Text
                      style={[
                        styles.upgradeBannerSub,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Inventory tracking, voice entry, and white-label branding are coming soon.
                    </Text>
                  </View>
                  <View style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.upgradeBtnText}>Upgrade</Text>
                  </View>
                </View>
              </Pressable>
            ) : null}

            {failures.length > 0 && (
              <View
                style={[
                  styles.alertBanner,
                  { backgroundColor: colors.warningBg },
                ]}
              >
                <View style={styles.alertRow}>
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={colors.warning}
                  />
                  <View style={styles.alertBody}>
                    <Text
                      style={[styles.alertTitle, { color: colors.warning }]}
                    >
                      {failures.length === 1
                        ? "1 delivery SMS didn't go through"
                        : `${failures.length} delivery messages didn't go through`}
                    </Text>
                    <Text
                      style={[styles.alertSub, { color: colors.textSecondary }]}
                    >
                      Last 24h. Check the order, confirm the number, or contact
                      the recipient directly.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <SectionLabel label="Business" />
            <SettingGroup>
              <SettingRow
                icon="briefcase"
                iconColor={colors.primary}
                iconBg={colors.primarySoft}
                label="Business details"
                sublabel="Name, city, logo, contact numbers"
                onPress={() => router.push("/(settings)/business-details")}
              />
              <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
              <SettingRow
                icon="sliders"
                iconColor={colors.warning}
                iconBg={colors.warningBg}
                label="Brand customization"
                sublabel="Display name and accent colour"
                onPress={() => router.push("/(settings)/brand-customization")}
              />
              <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
              <SettingRow
                icon="package"
                iconColor={colors.primary}
                iconBg={colors.primarySoft}
                label="Inventory"
                sublabel="Products, stock levels, and restocks"
                onPress={() => router.push("/(screens)/inventory")}
              />
              <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
              <SettingRow
                icon="users"
                iconColor={colors.info}
                iconBg={colors.infoBg}
                label="Customers"
                sublabel="Saved delivery contacts"
                onPress={() => router.push("/(screens)/customers")}
              />
              <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
              <SettingRow
                icon="download"
                iconColor={colors.success}
                iconBg={colors.successBg}
                label={exporting ? "Exporting history..." : "Export history"}
                sublabel="Share all orders as CSV"
                onPress={exportCSV}
              />
            </SettingGroup>

            <SectionLabel label="Preferences" />
            <SettingGroup>
              <SettingRow
                icon="moon"
                iconColor={colors.textSecondary}
                iconBg={colors.surfaceContainer}
                label="Dark mode"
                right={<Toggle value={isDark} onChange={() => toggleTheme()} />}
              />
              <View style={[styles.rowDivider, { backgroundColor: colors.surfaceContainer }]} />
              <SettingRow
                icon="bell"
                iconColor={colors.primary}
                iconBg={colors.primarySoft}
                label="Push notifications"
                right={
                  <Toggle value={notifEnabled} onChange={handleNotifToggle} />
                }
              />
            </SettingGroup>

            <SectionLabel label="Support" />
            <SettingGroup>
              <SettingRow
                icon="message-circle"
                iconColor={colors.info}
                iconBg={colors.infoBg}
                label="Help & support"
                sublabel="Chat with us"
                onPress={() => Linking.openURL("mailto:support@trackshpr.app")}
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

            <Text style={[styles.version, { color: colors.textMuted }]}>v1.0.0</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},
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
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarImg: {
    borderWidth: 3,
    overflow: "hidden",
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
  alertBanner: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.sectionGap,
    borderRadius: radius.xl,
    padding: 14,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  alertBody: { flex: 1 },
  alertTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 15,
  },
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
  version: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: font.mono.regular,
    paddingTop: 8,
  },
  stateCard: {
    marginHorizontal: layout.screenPaddingH,
    marginTop: 24,
    padding: 18,
    borderRadius: radius.xl,
    alignItems: "center",
    gap: 8,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  retryButton: {
    borderRadius: radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
