/**
 * Brand Customization settings screen.
 */
import { ProGate } from "@/src/components/shared";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useSession } from "@/src/hooks";
import { queryKeys } from "@/src/lib/queryKeys";
import { fetchProfile } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const fieldShadow = isDark
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
    <View
      style={[
        styles.inputField,
        {
          backgroundColor: focused ? colors.surfaceCard : colors.surfaceContainer,
          borderColor: focused ? colors.primary : "transparent",
        },
        !focused && fieldShadow,
      ]}
    >
      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.inputValue, { color: colors.textPrimary }]}
      />
    </View>
  );
}

function PreviewCard({
  accentHex,
  accentEnd,
  brandName,
  displayOption,
}: {
  accentHex: string;
  accentEnd: string;
  brandName: string;
  displayOption: DisplayOption;
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
      <LinearGradient
        colors={[accentHex, accentEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewHeader}
      >
        <View style={styles.previewOrb} />
        <View style={styles.previewBrandRow}>
          {displayOption !== "name_only" ? (
            <View style={styles.previewLogo}>
              <Feather name="briefcase" size={16} color="#FFFFFF" />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.previewBrandName}>{brandName}</Text>
            <Text style={styles.previewBrandTag}>Delivery tracking</Text>
          </View>
          <View style={styles.previewVerified}>
            <Text style={styles.previewVerifiedText}>Pro</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.previewBody, { backgroundColor: colors.surfaceCard }]}>
        <Text style={[styles.previewBodyLabel, { color: colors.textMuted }]}>
          Customer sees this
        </Text>
        <View
          style={[
            styles.previewProgressTrack,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <View style={[styles.previewProgressFill, { backgroundColor: accentHex }]} />
        </View>
        <View style={styles.previewPillRow}>
          <Text style={[styles.previewStatusText, { color: colors.textMuted }]}>
            In Transit to Lekki
          </Text>
          <View style={[styles.previewPill, { backgroundColor: accentHex }]}>
            <View style={styles.previewPillDot} />
            <Text style={styles.previewPillText}>Tracking</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

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
      {selected ? <Text style={styles.swatchCheck}>✓</Text> : null}
    </Pressable>
  );
}

function DisplayOptionRow({
  icon,
  label,
  sub,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
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
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.displayOptionLabel, { color: colors.textPrimary }]}>
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
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function BrandCustomizationContent() {
  const { colors, isDark } = useTheme();
  const showToast = useToastStore((state) => state.show);
  const queryClient = useQueryClient();
  const { userId } = useSession();
  const { data: profile } = useProfile(userId);
  const saveProfileMutation = useSaveProfile();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [displayOption, setDisplayOption] =
    useState<DisplayOption>("logo_name");
  const [brandDisplayName, setBrandDisplayName] = useState("");

  const bannerY = useSharedValue(-40);
  const bannerOp = useSharedValue(0);

  useEffect(() => {
    if (!profile) return;

    if (profile.brand_color) {
      const idx = ACCENT_COLORS.findIndex((color) => color.hex === profile.brand_color);
      if (idx >= 0) {
        setSelectedIdx(idx);
      }
    }

    if (
      profile.display_option === "name_only" ||
      profile.display_option === "logo_name"
    ) {
      setDisplayOption(profile.display_option);
    }

    setBrandDisplayName(profile.brand_name ?? "");
  }, [profile]);

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

  const showBanner = () => {
    bannerY.value = -40;
    bannerOp.value = 0;
    bannerY.value = withSpring(0, { damping: 22, stiffness: 320 });
    bannerOp.value = withTiming(1, { duration: 250 });
    setTimeout(() => {
      bannerOp.value = withTiming(0, { duration: 200 });
    }, 2800);
  };

  const handleSave = async () => {
    if (!userId) return;

    const normalizedBrandName = brandDisplayName.trim() || null;

    try {
      await saveProfileMutation.mutateAsync({
        id: userId,
        brand_name: normalizedBrandName,
        brand_color: accent.hex,
        display_option: displayOption,
      });

      const latest = await queryClient.fetchQuery({
        queryKey: queryKeys.profile(userId),
        queryFn: () => fetchProfile(userId),
      });

      if (
        latest?.brand_color !== accent.hex ||
        (latest?.brand_name ?? null) !== normalizedBrandName
      ) {
        throw new Error("verification_failed");
      }

      showBanner();
      showToast("Brand settings saved.", "success");
    } catch {
      showToast("Couldn't save your brand settings. Please try again.", "error");
    }
  };

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOp.value,
    transform: [{ translateY: bannerY.value }],
  }));

  const previewBrandName = useMemo(
    () =>
      brandDisplayName.trim() ||
      profile?.brand_name ||
      profile?.business_name ||
      "Your Business",
    [brandDisplayName, profile?.brand_name, profile?.business_name],
  );

  return (
    <>
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
          Brand settings saved and verified
        </Text>
      </Animated.View>

      <SectionLabel label="Brand display name" />
      <FormInput
        label="Display name"
        value={brandDisplayName}
        onChange={setBrandDisplayName}
        placeholder={profile?.business_name ?? "Your business name"}
      />

      <SectionLabel label="Live preview" />
      <PreviewCard
        accentHex={accent.hex}
        accentEnd={accent.end}
        brandName={previewBrandName}
        displayOption={displayOption}
      />

      <SectionLabel label="Accent colour" />
      <View style={[styles.swatchCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
        <View style={styles.swatchGrid}>
          {ACCENT_COLORS.map((color, index) => (
            <Swatch
              key={color.hex}
              color={color}
              selected={index === selectedIdx}
              onPress={() => setSelectedIdx(index)}
            />
          ))}
        </View>

        <View style={[styles.swatchDivider, { backgroundColor: colors.surfaceContainer }]} />

        <View style={styles.swatchLabel}>
          <View style={[styles.swatchLabelDot, { backgroundColor: accent.hex }]} />
          <Text style={[styles.swatchLabelName, { color: colors.textPrimary }]}>
            {accent.name}
          </Text>
          <Text style={[styles.swatchLabelHex, { color: colors.textMuted }]}>
            {accent.hex}
          </Text>
        </View>
      </View>

      <SectionLabel label="What shows on tracking pages" />
      <DisplayOptionRow
        icon="briefcase"
        label="Logo + display name"
        sub="Show your logo and display name together"
        selected={displayOption === "logo_name"}
        onPress={() => setDisplayOption("logo_name")}
      />
      <DisplayOptionRow
        icon="type"
        label="Display name only"
        sub="Hide the logo and keep the name front and center"
        selected={displayOption === "name_only"}
        onPress={() => setDisplayOption("name_only")}
      />

      <View style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}>
        <Feather
          name="link-2"
          size={16}
          color={colors.primary}
          style={styles.infoCardIcon}
        />
        <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
          Your saved colour and display name will appear on new tracking links as
          soon as Pro is enabled for your profile.
        </Text>
      </View>

      <View style={[styles.saveShadow, { backgroundColor: colors.primary }]}>
        <Pressable
          onPress={handleSave}
          disabled={saveProfileMutation.isPending}
          style={styles.savePressable}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            {saveProfileMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Brand Settings</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

export default function BrandCustomizationScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
          Brand Customization
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
        <ProGate feature="brand-customization">
          <BrandCustomizationContent />
        </ProGate>
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
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 8,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: -2,
  },
  inputField: {
    borderRadius: radius.lg,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  previewBrandName: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
    color: "#FFFFFF",
  },
  previewBrandTag: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 1,
    color: "rgba(255,255,255,0.65)",
  },
  previewVerified: {
    marginLeft: "auto",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  previewVerifiedText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  previewBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  previewBodyLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.72,
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
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
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
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },
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
