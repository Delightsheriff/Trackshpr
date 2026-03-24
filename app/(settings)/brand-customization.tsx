/**
 * Brand Customization settings screen.
 * Free state: upgrade banner + locked preview + feature list.
 * Pro state: live preview card, colour swatches, display options, save.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Colour options (data, not UI tokens) ─────────────────────────────────────
const ACCENT_COLORS: { name: string; hex: string; end: string }[] = [
  { name: "Indigo", hex: "#4647D3", end: "#6366F1" },
  { name: "Burnt Orange", hex: "#C2410C", end: "#EA580C" },
  { name: "Forest Green", hex: "#00873A", end: "#00A347" },
  { name: "Ocean Blue", hex: "#1A7FCC", end: "#2E9BE0" },
  { name: "Deep Purple", hex: "#7C3AED", end: "#8B5CF6" },
  { name: "Warm Amber", hex: "#B45309", end: "#D97706" },
  { name: "Teal", hex: "#0F766E", end: "#14B8A6" },
  { name: "Raspberry", hex: "#BE185D", end: "#DB2777" },
  { name: "Royal Blue", hex: "#1E40AF", end: "#2563EB" },
  { name: "Olive", hex: "#4D7C0F", end: "#65A30D" },
  { name: "Burgundy", hex: "#9D174D", end: "#BE185D" },
  { name: "Slate", hex: "#374151", end: "#4B5563" },
];

type DisplayOption = "logo_name" | "name_only";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label}
    </Text>
  );
}

/** Live preview card — header bg uses selected accent color */
function PreviewCard({
  accentHex,
  accentEnd,
  isPro,
  businessName,
}: {
  accentHex: string;
  accentEnd: string;
  isPro: boolean;
  businessName?: string;
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 3,
      };

  return (
    <View style={[styles.previewCard, cardShadow]}>
      {/* Header */}
      <LinearGradient
        colors={[accentHex, accentEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewHeader}
      >
        {/* Decorative orb */}
        <View
          style={[
            styles.previewOrb,
            { backgroundColor: "rgba(255,255,255,0.08)" },
          ]}
        />

        <View style={styles.previewBrandRow}>
          <View
            style={[
              styles.previewLogo,
              { backgroundColor: "rgba(255,255,255,0.15)" },
            ]}
          >
            <Feather
              name={isPro ? "shopping-bag" : "package"}
              size={16}
              color="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewBrandName, { color: "#fff" }]}>
              {isPro ? (businessName ?? "Your Business") : "Trackshpr"}
            </Text>
            <Text
              style={[
                styles.previewBrandTag,
                { color: "rgba(255,255,255,0.55)" },
              ]}
            >
              {isPro ? "Delivery tracking" : "Delivery tracking"}
            </Text>
          </View>
          <View
            style={[
              styles.previewVerified,
              { backgroundColor: "rgba(255,255,255,0.12)" },
            ]}
          >
            <Text
              style={[
                styles.previewVerifiedText,
                { color: "rgba(255,255,255,0.7)" },
              ]}
            >
              {isPro ? "✓ Verified" : "Free"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <View
        style={[styles.previewBody, { backgroundColor: colors.surfaceCard }]}
      >
        <Text style={[styles.previewBodyLabel, { color: colors.textMuted }]}>
          Customer sees this
        </Text>
        <View
          style={[
            styles.previewProgressTrack,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <View
            style={[styles.previewProgressFill, { backgroundColor: accentHex }]}
          />
        </View>
        <View style={styles.previewPillRow}>
          <Text style={[styles.previewStatusText, { color: colors.textMuted }]}>
            In Transit → Lekki
          </Text>
          <View style={[styles.previewPill, { backgroundColor: accentHex }]}>
            <View
              style={[
                styles.previewPillDot,
                { backgroundColor: "rgba(255,255,255,0.7)" },
              ]}
            />
            <Text style={[styles.previewPillText, { color: "#fff" }]}>
              Tracking
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Feature list row used in free tier */
function FeatureRow({
  icon,
  iconColor,
  bg,
  title,
  sub,
  divider,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  bg: string;
  title: string;
  sub: string;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.featureRow,
        divider && [
          styles.featureRowDivider,
          { borderBottomColor: colors.surfaceContainer },
        ],
      ]}
    >
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>
        <Feather
          name={icon}
          size={15}
          color={iconColor ?? colors.textPrimary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.featureSub, { color: colors.textMuted }]}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

/** Single swatch cell */
function Swatch({
  color,
  selected,
  onPress,
}: {
  color: { hex: string; end: string; name: string };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.swatch,
        { backgroundColor: color.hex },
        selected && styles.swatchSelected,
      ]}
    >
      {selected ? (
        <Text style={[styles.swatchCheck, { color: "#fff" }]}>✓</Text>
      ) : null}
    </Pressable>
  );
}

/** Radio option row for display type */
function DisplayOptionRow({
  icon,
  iconColor,
  label,
  sub,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();

  const rowShadow = isDark
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
        shadowRadius: 6,
        elevation: 1,
      };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.displayOption,
        { backgroundColor: selected ? colors.primarySoft : colors.surfaceCard },
        !selected && rowShadow,
      ]}
      android_ripple={{ color: colors.primarySoft, borderless: false }}
    >
      <View
        style={[
          styles.displayOptionIcon,
          {
            backgroundColor: selected
              ? colors.primarySoft
              : colors.surfaceContainer,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={
            iconColor ?? (selected ? colors.primary : colors.textSecondary)
          }
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.displayOptionLabel, { color: colors.textPrimary }]}
        >
          {label}
        </Text>
        <Text style={[styles.displayOptionSub, { color: colors.textMuted }]}>
          {sub}
        </Text>
      </View>
      <View
        style={[
          styles.radioOuter,
          { borderColor: selected ? colors.primary : colors.surfaceContainer },
          selected && { backgroundColor: colors.primary },
        ]}
      >
        {selected ? (
          <View style={[styles.radioDot, { backgroundColor: colors.white }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BrandCustomizationScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.show);
  const { userId } = useSession();

  const { data: profile } = useProfile(userId);
  const saveProfileMutation = useSaveProfile();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [displayOption, setDisplayOption] =
    useState<DisplayOption>("logo_name");
  const [saved, setSaved] = useState(false);

  const bannerY = useSharedValue(-40);
  const bannerOp = useSharedValue(0);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.brand_color) {
        const idx = ACCENT_COLORS.findIndex((c) => c.hex === profile.brand_color);
        if (idx !== -1) setSelectedIdx(idx);
      }
      if (profile.display_option === "name_only" || profile.display_option === "logo_name") {
        setDisplayOption(profile.display_option);
      }
    }
  }, [profile]);

  const isPro = true; // plan gating to be added later
  const accent = ACCENT_COLORS[selectedIdx];

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
        shadowRadius: 6,
        elevation: 1,
      };

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

  const lockOverlayBg = isDark
    ? "rgba(15,14,26,0.88)"
    : "rgba(250,244,255,0.88)";

  const showBanner = () => {
    bannerY.value = -40;
    bannerOp.value = 0;
    bannerY.value = withSpring(0, { damping: 22, stiffness: 320 });
    bannerOp.value = withTiming(1, { duration: 250 });
    setTimeout(() => {
      bannerOp.value = withTiming(0, { duration: 200 });
    }, 2800);
  };

  const handleSave = () => {
    if (!userId || !profile) return;
    saveProfileMutation.mutate(
      {
        id: userId,
        business_name: profile.business_name ?? "",
        phone: profile.phone ?? "",
        brand_color: accent.hex,
        display_option: displayOption,
      },
      {
        onSuccess: () => {
          setSaved(true);
          showBanner();
          setTimeout(() => setSaved(false), 3000);
        },
        onError: () => {
          showToast("Could not save brand settings. Please try again.", "error");
        },
      },
    );
  };

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOp.value,
    transform: [{ translateY: bannerY.value }],
  }));

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, backgroundColor: colors.surface },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: colors.surfaceContainer },
            backBtnShadow,
          ]}
          android_ripple={{ color: colors.surfaceContainer, borderless: false }}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Brand Customization
        </Text>
        {isPro ? (
          <Pressable
            onPress={handleSave}
            disabled={saveProfileMutation.isPending}
            style={[
              styles.headerSaveBtn,
              {
                backgroundColor: saved ? colors.successBg : colors.primarySoft,
                opacity: saveProfileMutation.isPending ? 0.5 : 1,
              },
            ]}
            android_ripple={{
              color: saved ? colors.successBg : colors.primarySoft,
              borderless: false,
            }}
          >
            {saveProfileMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.headerSaveText,
                  { color: saved ? colors.success : colors.primary },
                ]}
              >
                {saved ? "Saved" : "Save"}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>

      {/* ── Saved banner ── */}
      {isPro ? (
        <Animated.View
          style={[
            styles.savedBanner,
            { backgroundColor: colors.successBg },
            bannerStyle,
          ]}
          pointerEvents="none"
        >
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={[styles.savedBannerText, { color: colors.success }]}>
            Brand settings saved · Changes are live
          </Text>
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════
            FREE STATE
        ══════════════════════════════ */}
        {!isPro ? (
          <>
            {/* Upgrade banner */}
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeBanner}
            >
              <View
                style={[
                  styles.upgradeBannerOrb,
                  { backgroundColor: "rgba(255,255,255,0.07)" },
                ]}
              />
              <Text
                style={[
                  styles.upgradeBannerCaps,
                  { color: "rgba(255,255,255,0.6)" },
                ]}
              >
                Pro Feature
              </Text>
              <Text style={[styles.upgradeBannerTitle, { color: "#fff" }]}>
                Make it yours
              </Text>
              <Text
                style={[
                  styles.upgradeBannerSub,
                  { color: "rgba(255,255,255,0.65)" },
                ]}
              >
                Remove Trackshpr branding from every customer tracking page.
                Show your logo, your colours, your name.
              </Text>
              <View style={styles.upgradeCtaShadow}>
                <Pressable
                  style={styles.upgradeCtaPressable}
                  android_ripple={{
                    color: colors.primarySoft,
                    borderless: false,
                  }}
                >
                  <View
                    style={[
                      styles.upgradeCta,
                      { backgroundColor: colors.white },
                    ]}
                  >
                    <Text
                      style={[styles.upgradeCtaText, { color: colors.primary }]}
                    >
                      Upgrade to Pro — ₦3,500/mo
                    </Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Locked preview */}
            <SectionLabel label="Preview" />
            <View style={styles.proLock}>
              <PreviewCard
                accentHex={colors.primary}
                accentEnd="#6366F1"
                isPro={false}
              />
              {/* Overlay */}
              <View
                style={[
                  styles.proLockOverlay,
                  { backgroundColor: lockOverlayBg },
                ]}
              >
                <View
                  style={[
                    styles.proLockBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather name="zap" size={12} color={colors.white} />
                  <Text
                    style={[styles.proLockBadgeText, { color: colors.white }]}
                  >
                    Pro only
                  </Text>
                </View>
                <Text style={[styles.proLockText, { color: colors.textMuted }]}>
                  Upgrade to customise
                </Text>
              </View>
            </View>

            {/* Feature list */}
            <View
              style={[
                styles.featureList,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <FeatureRow
                icon="droplet"
                iconColor={colors.primary}
                bg={colors.primarySoft}
                title="Custom accent colour"
                sub="12 colours to match your brand"
                divider
              />
              <FeatureRow
                icon="briefcase"
                iconColor={colors.warning}
                bg={colors.warningBg}
                title="Your logo on tracking pages"
                sub="Replaces Trackshpr branding"
                divider
              />
              <FeatureRow
                icon="star"
                iconColor={colors.success}
                bg={colors.successBg}
                title="Look like a big brand"
                sub="Customers trust sellers who look professional"
              />
            </View>
          </>
        ) : null}

        {/* ══════════════════════════════
            PRO STATE
        ══════════════════════════════ */}
        {isPro ? (
          <>
            {/* Live preview */}
            <SectionLabel label="Live preview" />
            <PreviewCard
              accentHex={accent.hex}
              accentEnd={accent.end}
              isPro={true}
              businessName={profile?.business_name ?? undefined}
            />

            {/* Colour picker */}
            <SectionLabel label="Accent colour" />
            <View
              style={[
                styles.swatchCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <View style={styles.swatchGrid}>
                {ACCENT_COLORS.map((c, i) => (
                  <Swatch
                    key={c.hex}
                    color={c}
                    selected={i === selectedIdx}
                    onPress={() => setSelectedIdx(i)}
                  />
                ))}
              </View>

              {/* Divider */}
              <View
                style={[
                  styles.swatchDivider,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              />

              {/* Selected label */}
              <View style={styles.swatchLabel}>
                <View
                  style={[
                    styles.swatchLabelDot,
                    { backgroundColor: accent.hex },
                  ]}
                />
                <Text
                  style={[
                    styles.swatchLabelName,
                    { color: colors.textPrimary },
                  ]}
                >
                  {accent.name}
                </Text>
                <Text
                  style={[styles.swatchLabelHex, { color: colors.textMuted }]}
                >
                  {accent.hex}
                </Text>
              </View>
            </View>

            {/* Display options */}
            <SectionLabel label="What shows on tracking pages" />
            <DisplayOptionRow
              icon="briefcase"
              iconColor={colors.primary}
              label="Logo + business name"
              sub="Replaces all Trackshpr branding"
              selected={displayOption === "logo_name"}
              onPress={() => setDisplayOption("logo_name")}
            />
            <DisplayOptionRow
              icon="type"
              iconColor={colors.textSecondary}
              label="Business name only"
              sub="No logo, just your name"
              selected={displayOption === "name_only"}
              onPress={() => setDisplayOption("name_only")}
            />

            {/* Info card (shown after save) */}
            {saved ? (
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Feather
                  name="link-2"
                  size={16}
                  color={colors.primary}
                  style={styles.infoCardIcon}
                />
                <Text
                  style={[styles.infoCardText, { color: colors.textSecondary }]}
                >
                  All <Text style={styles.bold}>new tracking links</Text> you
                  send will use these brand settings immediately.
                </Text>
              </View>
            ) : null}

            {/* Save button */}
            <View
              style={[styles.saveShadow, { backgroundColor: colors.primary }]}
            >
              <Pressable
                onPress={handleSave}
                style={styles.savePressable}
                android_ripple={{
                  color: "rgba(255,255,255,0.2)",
                  borderless: false,
                }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtn}
                >
                  <Text style={[styles.saveBtnText, { color: "#fff" }]}>
                    Save Brand Settings
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
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
  headerSaveBtn: {
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  headerSaveText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Saved banner
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 4,
    borderRadius: radius.lg,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  savedBannerText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },

  // Scroll
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 8,
    gap: 12,
    flexDirection: "column",
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1 * 10,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: -2,
  },

  // ── FREE: Upgrade banner ─────────────────────────────────────────────────
  upgradeBanner: {
    borderRadius: radius.xl,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  upgradeBannerOrb: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -15,
  },
  upgradeBannerCaps: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.55,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  upgradeBannerTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    marginBottom: 6,
  },
  upgradeBannerSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
    marginBottom: 14,
  },
  upgradeCtaShadow: {
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    alignSelf: "flex-start",
  },
  upgradeCtaPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  upgradeCta: {
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  upgradeCtaText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // ── Pro lock overlay ─────────────────────────────────────────────────────
  proLock: {
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  proLockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proLockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  proLockBadgeText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  proLockText: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
  },

  // ── Feature list ─────────────────────────────────────────────────────────
  featureList: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureRowDivider: {
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  featureSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 1,
  },

  // ── Preview card (shared) ────────────────────────────────────────────────
  previewCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  previewHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  previewOrb: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -15,
  },
  previewBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 2,
  },
  previewLogo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  previewBrandName: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  previewBrandTag: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 1,
  },
  previewVerified: {
    marginLeft: "auto",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  previewVerifiedText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  previewBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  previewBodyLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.08 * 9,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  previewProgressTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: 10,
  },
  previewProgressFill: {
    height: "100%",
    width: "65%",
    borderRadius: radius.full,
    opacity: 0.85,
  },
  previewPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewStatusText: {
    fontSize: 11,
    fontFamily: font.sans.regular,
  },
  previewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.full,
  },
  previewPillDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // ── Colour swatches ──────────────────────────────────────────────────────
  swatchCard: {
    borderRadius: radius.xl,
    padding: 14,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatch: {
    width: "14.2%",
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    transform: [{ scale: 1.08 }],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  swatchCheck: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  swatchDivider: {
    height: 1,
    marginVertical: 10,
  },
  swatchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatchLabelDot: {
    width: 20,
    height: 20,
    borderRadius: 7,
    flexShrink: 0,
  },
  swatchLabelName: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  swatchLabelHex: {
    fontSize: 11,
    fontFamily: font.mono.regular,
    marginLeft: "auto",
  },

  // ── Display options ──────────────────────────────────────────────────────
  displayOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  displayOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  displayOptionLabel: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  displayOptionSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },

  // ── Info card ────────────────────────────────────────────────────────────
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.lg,
    padding: 12,
    paddingHorizontal: 14,
  },
  infoCardIcon: { marginTop: 1 },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  bold: { fontFamily: font.sans.bold, fontWeight: "700" },

  // ── Save button ──────────────────────────────────────────────────────────
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
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
});
