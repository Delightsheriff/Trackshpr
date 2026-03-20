/**
 * Brand Customization settings screen.
 * Free state: upgrade banner + locked preview + feature list.
 * Pro state: live preview card, colour swatches, display options, save.
 * TODO: upsert brand_color + display_option to Supabase profiles table.
 */
import { colors, font, gradients, layout, radius } from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Toggle between 'free' and 'pro' to test states ───────────────────────────
const DUMMY_PLAN: "free" | "pro" = "pro";

const DUMMY_PROFILE = {
  business_name: "Zara's Closet",
  tagline:       "Premium fashion · Lagos",
  logo_emoji:    "👗",
};

// ── Colour options (data, not UI tokens) ─────────────────────────────────────
const ACCENT_COLORS: { name: string; hex: string; end: string }[] = [
  { name: "Indigo",       hex: "#4647D3", end: "#6366F1" },
  { name: "Burnt Orange", hex: "#C2410C", end: "#EA580C" },
  { name: "Forest Green", hex: "#00873A", end: "#00A347" },
  { name: "Ocean Blue",   hex: "#1A7FCC", end: "#2E9BE0" },
  { name: "Deep Purple",  hex: "#7C3AED", end: "#8B5CF6" },
  { name: "Warm Amber",   hex: "#B45309", end: "#D97706" },
  { name: "Teal",         hex: "#0F766E", end: "#14B8A6" },
  { name: "Raspberry",    hex: "#BE185D", end: "#DB2777" },
  { name: "Royal Blue",   hex: "#1E40AF", end: "#2563EB" },
  { name: "Olive",        hex: "#4D7C0F", end: "#65A30D" },
  { name: "Burgundy",     hex: "#9D174D", end: "#BE185D" },
  { name: "Slate",        hex: "#374151", end: "#4B5563" },
];

type DisplayOption = "logo_name" | "name_only";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

/** Live preview card — header bg uses selected accent color */
function PreviewCard({
  accentHex,
  accentEnd,
  isPro,
}: {
  accentHex: string;
  accentEnd: string;
  isPro: boolean;
}) {
  return (
    <View style={styles.previewCard}>
      {/* Header */}
      <LinearGradient
        colors={[accentHex, accentEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewHeader}
      >
        {/* Decorative orb */}
        <View style={styles.previewOrb} />

        <View style={styles.previewBrandRow}>
          <View style={styles.previewLogo}>
            <Text style={styles.previewLogoEmoji}>
              {isPro ? DUMMY_PROFILE.logo_emoji : "📦"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewBrandName}>
              {isPro ? DUMMY_PROFILE.business_name : "Trackshpr"}
            </Text>
            <Text style={styles.previewBrandTag}>
              {isPro ? DUMMY_PROFILE.tagline : "Delivery tracking"}
            </Text>
          </View>
          <View style={styles.previewVerified}>
            <Text style={styles.previewVerifiedText}>
              {isPro ? "✓ Verified" : "Free"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.previewBody}>
        <Text style={styles.previewBodyLabel}>Customer sees this</Text>
        <View style={styles.previewProgressTrack}>
          <View style={[styles.previewProgressFill, { backgroundColor: accentHex }]} />
        </View>
        <View style={styles.previewPillRow}>
          <Text style={styles.previewStatusText}>In Transit → Lekki</Text>
          <View style={[styles.previewPill, { backgroundColor: accentHex }]}>
            <View style={styles.previewPillDot} />
            <Text style={styles.previewPillText}>Tracking</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Feature list row used in free tier */
function FeatureRow({
  emoji,
  bg,
  title,
  sub,
  divider,
}: {
  emoji: string;
  bg: string;
  title: string;
  sub: string;
  divider?: boolean;
}) {
  return (
    <View style={[styles.featureRow, divider && styles.featureRowDivider]}>
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>
        <Text style={styles.featureIconEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{sub}</Text>
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
        <Text style={styles.swatchCheck}>✓</Text>
      ) : null}
    </Pressable>
  );
}

/** Radio option row for display type */
function DisplayOptionRow({
  icon,
  label,
  sub,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.displayOption, selected && styles.displayOptionSelected]}
      android_ripple={{ color: colors.primarySoft, borderless: false }}
    >
      <View style={[styles.displayOptionIcon, selected && styles.displayOptionIconSelected]}>
        <Text style={styles.displayOptionEmoji}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.displayOptionLabel}>{label}</Text>
        <Text style={styles.displayOptionSub}>{sub}</Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterChecked]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BrandCustomizationScreen() {
  const insets = useSafeAreaInsets();

  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [displayOption,  setDisplayOption]  = useState<DisplayOption>("logo_name");
  const [saved,          setSaved]          = useState(false);

  const bannerY   = useSharedValue(-40);
  const bannerOp  = useSharedValue(0);

  const isPro = DUMMY_PLAN === "pro";
  const accent = ACCENT_COLORS[selectedIdx];

  const showBanner = () => {
    bannerY.value  = -40;
    bannerOp.value = 0;
    bannerY.value  = withSpring(0, { damping: 22, stiffness: 320 });
    bannerOp.value = withTiming(1, { duration: 250 });
    setTimeout(() => {
      bannerOp.value = withTiming(0, { duration: 200 });
    }, 2800);
  };

  const handleSave = () => {
    // TODO: upsert brand_color + display_option to Supabase profiles
    setSaved(true);
    showBanner();
    setTimeout(() => setSaved(false), 3000);
  };

  const bannerStyle = useAnimatedStyle(() => ({
    opacity:   bannerOp.value,
    transform: [{ translateY: bannerY.value }],
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          android_ripple={{ color: colors.surfaceContainer, borderless: false }}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Brand Customization</Text>
        {isPro ? (
          <Pressable
            onPress={handleSave}
            style={[styles.headerSaveBtn, saved && styles.headerSaveBtnSaved]}
            android_ripple={{ color: saved ? colors.successBg : colors.primarySoft, borderless: false }}
          >
            <Text style={[styles.headerSaveText, saved && styles.headerSaveTextSaved]}>
              {saved ? "Saved ✓" : "Save"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Saved banner ── */}
      {isPro ? (
        <Animated.View style={[styles.savedBanner, bannerStyle]} pointerEvents="none">
          <Text style={styles.savedBannerIcon}>✅</Text>
          <Text style={styles.savedBannerText}>Brand settings saved · Changes are live</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
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
              <View style={styles.upgradeBannerOrb} />
              <Text style={styles.upgradeBannerCaps}>Pro Feature</Text>
              <Text style={styles.upgradeBannerTitle}>Make it yours</Text>
              <Text style={styles.upgradeBannerSub}>
                Remove Trackshpr branding from every customer tracking page.
                Show your logo, your colours, your name.
              </Text>
              <View style={styles.upgradeCtaShadow}>
                <Pressable
                  style={styles.upgradeCtaPressable}
                  android_ripple={{ color: colors.primarySoft, borderless: false }}
                >
                  <View style={styles.upgradeCta}>
                    <Text style={styles.upgradeCtaText}>Upgrade to Pro — ₦3,500/mo</Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Locked preview */}
            <SectionLabel label="Preview" />
            <View style={styles.proLock}>
              <PreviewCard accentHex={colors.primary} accentEnd="#6366F1" isPro={false} />
              {/* Overlay */}
              <View style={styles.proLockOverlay}>
                <View style={styles.proLockBadge}>
                  <Text style={styles.proLockBadgeText}>⚡ Pro only</Text>
                </View>
                <Text style={styles.proLockText}>Upgrade to customise</Text>
              </View>
            </View>

            {/* Feature list */}
            <View style={styles.featureList}>
              <FeatureRow
                emoji="🎨"
                bg={colors.primarySoft}
                title="Custom accent colour"
                sub="12 colours to match your brand"
                divider
              />
              <FeatureRow
                emoji="🏪"
                bg={colors.warningBg}
                title="Your logo on tracking pages"
                sub="Replaces Trackshpr branding"
                divider
              />
              <FeatureRow
                emoji="✨"
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
            <PreviewCard accentHex={accent.hex} accentEnd={accent.end} isPro={true} />

            {/* Colour picker */}
            <SectionLabel label="Accent colour" />
            <View style={styles.swatchCard}>
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
              <View style={styles.swatchDivider} />

              {/* Selected label */}
              <View style={styles.swatchLabel}>
                <View style={[styles.swatchLabelDot, { backgroundColor: accent.hex }]} />
                <Text style={styles.swatchLabelName}>{accent.name}</Text>
                <Text style={styles.swatchLabelHex}>{accent.hex}</Text>
              </View>
            </View>

            {/* Display options */}
            <SectionLabel label="What shows on tracking pages" />
            <DisplayOptionRow
              icon="🏪"
              label="Logo + business name"
              sub="Replaces all Trackshpr branding"
              selected={displayOption === "logo_name"}
              onPress={() => setDisplayOption("logo_name")}
            />
            <DisplayOptionRow
              icon="✏️"
              label="Business name only"
              sub="No logo, just your name"
              selected={displayOption === "name_only"}
              onPress={() => setDisplayOption("name_only")}
            />

            {/* Info card (shown after save) */}
            {saved ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>🔗</Text>
                <Text style={styles.infoCardText}>
                  All{" "}
                  <Text style={styles.bold}>new tracking links</Text>{" "}
                  you send will use these brand settings immediately.
                </Text>
              </View>
            ) : null}

            {/* Save button */}
            <View style={styles.saveShadow}>
              <Pressable
                onPress={handleSave}
                style={styles.savePressable}
                android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Save Brand Settings</Text>
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
  root: { flex: 1, backgroundColor: colors.surface },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 34, height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceCard,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    color: colors.textPrimary,
  },
  headerSaveBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  headerSaveBtnSaved: { backgroundColor: colors.successBg },
  headerSaveText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.primary,
  },
  headerSaveTextSaved: { color: colors.success },

  // Saved banner
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 4,
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  savedBannerIcon: { fontSize: 16 },
  savedBannerText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.success,
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
    color: colors.textMuted,
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
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -30, right: -15,
  },
  upgradeBannerCaps: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  },
  upgradeBannerTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    color: colors.white,
    marginBottom: 6,
  },
  upgradeBannerSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 18,
    marginBottom: 14,
  },
  upgradeCtaShadow: {
    borderRadius: radius.full,
    backgroundColor: colors.white,
    shadowColor: "#000",
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
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  upgradeCtaText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.primary,
  },

  // ── Pro lock overlay ─────────────────────────────────────────────────────
  proLock: {
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  proLockOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(250,244,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proLockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  proLockBadgeText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },
  proLockText: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.textMuted,
  },

  // ── Feature list ─────────────────────────────────────────────────────────
  featureList: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
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
    borderBottomColor: colors.surfaceContainer,
  },
  featureIcon: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  featureIconEmoji: { fontSize: 15 },
  featureTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    color: colors.textPrimary,
  },
  featureSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    marginTop: 1,
  },

  // ── Preview card (shared) ────────────────────────────────────────────────
  previewCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 3,
  },
  previewHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  previewOrb: {
    position: "absolute",
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -30, right: -15,
  },
  previewBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 2,
  },
  previewLogo: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  previewLogoEmoji: { fontSize: 16 },
  previewBrandName: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
    color: colors.white,
  },
  previewBrandTag: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.55)",
    marginTop: 1,
  },
  previewVerified: {
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  previewVerifiedText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  previewBody: {
    backgroundColor: colors.surfaceCard,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  previewBodyLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.08 * 9,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 8,
  },
  previewProgressTrack: {
    height: 4,
    backgroundColor: colors.surfaceContainer,
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
    color: colors.textMuted,
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
    width: 5, height: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },

  // ── Colour swatches ──────────────────────────────────────────────────────
  swatchCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 14,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  swatchCheck: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },
  swatchDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginVertical: 10,
  },
  swatchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatchLabelDot: {
    width: 20, height: 20,
    borderRadius: 7,
    flexShrink: 0,
  },
  swatchLabelName: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  swatchLabelHex: {
    fontSize: 11,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
    marginLeft: "auto",
  },

  // ── Display options ──────────────────────────────────────────────────────
  displayOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    overflow: "hidden",
  },
  displayOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  displayOptionIcon: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  displayOptionIconSelected: {
    backgroundColor: colors.primarySoft,
  },
  displayOptionEmoji: { fontSize: 16 },
  displayOptionLabel: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    color: colors.textPrimary,
  },
  displayOptionSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  radioOuter: {
    width: 20, height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.surfaceContainer,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  radioOuterChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDot: {
    width: 7, height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },

  // ── Info card ────────────────────────────────────────────────────────────
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 12,
    paddingHorizontal: 14,
  },
  infoCardIcon: { fontSize: 16, marginTop: 1 },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: { fontFamily: font.sans.bold, fontWeight: "700" },

  // ── Save button ──────────────────────────────────────────────────────────
  saveShadow: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
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
    color: colors.white,
  },
});
