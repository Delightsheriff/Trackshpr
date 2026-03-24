/**
 * Business Details settings screen.
 * Back + Save header, logo upload, required/optional fields, validation.
 * TODO: upsert to Supabase profiles table on save.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
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

// ── Dummy data — TODO: replace with real Supabase session ────────────────────
const DUMMY_PROFILE = {
  business_name: "Zara's Closet",
  phone: "0803 456 7890",
  city: "Lagos",
  description: "Premium fashion delivered across Lagos",
  logo_url: null as string | null,
};

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label}
    </Text>
  );
}

// ── Form input ────────────────────────────────────────────────────────────────
function FormInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
  maxLength,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
  maxLength?: number;
  hasError?: boolean;
  errorMsg?: string;
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const showError = hasError && !focused;

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

  const fieldBg = focused ? colors.surfaceCard : colors.surfaceContainer;
  const borderColor = showError
    ? colors.error
    : focused
      ? colors.primary
      : "transparent";

  return (
    <View>
      <View
        style={[
          styles.inputField,
          { backgroundColor: fieldBg, borderColor },
          !focused && !showError && fieldShadow,
        ]}
      >
        <Text
          style={[
            styles.inputLabel,
            { color: showError ? colors.error : colors.textMuted },
          ]}
        >
          {label}
          {showError ? " — required" : ""}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType ?? "default"}
          multiline={multiline}
          maxLength={maxLength}
          style={[
            styles.inputValue,
            { color: colors.textPrimary },
            multiline && { minHeight: 56, textAlignVertical: "top" },
          ]}
          returnKeyType={multiline ? "default" : "next"}
        />
        {maxLength !== undefined && (
          <Text style={[styles.charCount, { color: colors.textMuted }]}>
            {value.length} / {maxLength}
          </Text>
        )}
      </View>
      {showError && errorMsg ? (
        <Text style={[styles.errorMsg, { color: colors.error }]}>
          {errorMsg}
        </Text>
      ) : null}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BusinessDetailsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState(DUMMY_PROFILE.business_name);
  const [phone, setPhone] = useState(DUMMY_PROFILE.phone);
  const [city, setCity] = useState(DUMMY_PROFILE.city);
  const [description, setDescription] = useState(DUMMY_PROFILE.description);
  const [logoUri, setLogoUri] = useState<string | null>(DUMMY_PROFILE.logo_url);
  const [nameErr, setNameErr] = useState(false);
  const [phoneErr, setPhoneErr] = useState(false);
  const [saved, setSaved] = useState(false);

  const bannerY = useSharedValue(-40);
  const bannerOp = useSharedValue(0);

  const hasErrors = nameErr || phoneErr;

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

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
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

  const handleSave = () => {
    const nameOk = businessName.trim().length > 0;
    const phoneOk = phone.trim().length > 0;
    setNameErr(!nameOk);
    setPhoneErr(!phoneOk);
    if (!nameOk || !phoneOk) return;
    // TODO: upsert to Supabase profiles table
    setSaved(true);
    showBanner();
    setTimeout(() => setSaved(false), 3000);
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
          Business Details
        </Text>
        <Pressable
          onPress={handleSave}
          style={[
            styles.headerSaveBtn,
            { backgroundColor: saved ? colors.successBg : colors.primarySoft },
            hasErrors && { opacity: 0.4 },
          ]}
          android_ripple={{
            color: saved ? colors.successBg : colors.primarySoft,
            borderless: false,
          }}
        >
          <Text
            style={[
              styles.headerSaveText,
              { color: saved ? colors.success : colors.primary },
            ]}
          >
            {saved ? "Saved" : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* ── Saved banner ── */}
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
          Business details saved successfully
        </Text>
      </Animated.View>

      {/* ── Form ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo upload card */}
          <View
            style={[
              styles.logoCard,
              { backgroundColor: colors.surfaceCard },
              cardShadow,
            ]}
          >
            <View
              style={[
                styles.logoPreview,
                logoUri
                  ? styles.logoPreviewFilled
                  : [
                      styles.logoPreviewEmpty,
                      {
                        backgroundColor: colors.surfaceContainer,
                        borderColor: colors.surfaceContainer,
                      },
                    ],
              ]}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <Feather name="briefcase" size={24} color={colors.textMuted} />
              )}
              <View
                style={[
                  styles.logoBadge,
                  { borderColor: colors.surfaceCard },
                  logoUri
                    ? { backgroundColor: colors.success }
                    : { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name={logoUri ? "check" : "plus"}
                  size={11}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.logoInfo}>
              <Text style={[styles.logoTitle, { color: colors.textPrimary }]}>
                Business logo
              </Text>
              <Text style={[styles.logoSub, { color: colors.textMuted }]}>
                {logoUri
                  ? "Looking great. This shows on all tracking pages."
                  : "Shows on customer tracking pages. Square image, min 200×200px."}
              </Text>
              <View style={styles.logoActions}>
                <Pressable
                  onPress={handlePickLogo}
                  style={[
                    styles.logoBtnPrimary,
                    { backgroundColor: colors.primarySoft },
                  ]}
                  android_ripple={{
                    color: colors.primarySoft,
                    borderless: false,
                  }}
                >
                  <Text
                    style={[
                      styles.logoBtnPrimaryText,
                      { color: colors.primary },
                    ]}
                  >
                    {logoUri ? "Change photo" : "Upload photo"}
                  </Text>
                </Pressable>
                {logoUri ? (
                  <Pressable
                    onPress={() => setLogoUri(null)}
                    style={[
                      styles.logoBtnDanger,
                      { backgroundColor: colors.errorBg },
                    ]}
                    android_ripple={{
                      color: colors.errorBg,
                      borderless: false,
                    }}
                  >
                    <Text
                      style={[
                        styles.logoBtnDangerText,
                        { color: colors.error },
                      ]}
                    >
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          {/* Required */}
          <SectionLabel label="Required" />

          <FormInput
            label="Business name"
            value={businessName}
            onChange={(v) => {
              setBusinessName(v);
              if (v.trim()) setNameErr(false);
            }}
            placeholder="e.g. Zara's Closet"
            hasError={nameErr}
            errorMsg="Business name cannot be empty"
          />

          <FormInput
            label="WhatsApp number"
            value={phone}
            onChange={(v) => {
              setPhone(v);
              if (v.trim()) setPhoneErr(false);
            }}
            placeholder="0800 000 0000"
            keyboardType="phone-pad"
            hasError={phoneErr}
            errorMsg="WhatsApp number cannot be empty"
          />

          {/* Optional */}
          <SectionLabel label="Optional" />

          <FormInput
            label="City"
            value={city}
            onChange={setCity}
            placeholder="e.g. Lagos"
          />

          <FormInput
            label="Short description"
            value={description}
            onChange={setDescription}
            placeholder="What do you sell? Shown on tracking pages."
            multiline
            maxLength={80}
          />

          {/* Info card */}
          <View
            style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}
          >
            <Feather
              name="eye"
              size={16}
              color={colors.primary}
              style={styles.infoCardIcon}
            />
            <Text
              style={[styles.infoCardText, { color: colors.textSecondary }]}
            >
              Your <Text style={styles.bold}>business name</Text>,{" "}
              <Text style={styles.bold}>logo</Text> and{" "}
              <Text style={styles.bold}>description</Text> appear on every
              customer tracking page you share.
            </Text>
          </View>

          {/* Save button */}
          <View
            style={[
              styles.saveShadow,
              { backgroundColor: colors.primary },
              hasErrors && styles.saveShadowDim,
            ]}
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
                  Save Changes
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 12,
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
    marginBottom: -4,
  },

  // Logo upload card
  logoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: radius.xl,
    padding: 16,
  },
  logoPreview: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  logoPreviewEmpty: {
    borderWidth: 2,
    borderStyle: "dashed",
  },
  logoPreviewFilled: {
    overflow: "hidden",
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  logoBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  logoBadgeText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  logoInfo: { flex: 1 },
  logoTitle: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
    marginBottom: 3,
  },
  logoSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 16,
  },
  logoActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  logoBtnPrimary: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  logoBtnPrimaryText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  logoBtnDanger: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  logoBtnDangerText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },

  // Input field
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
    letterSpacing: 0.06 * 10,
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
  charCount: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    textAlign: "right",
    marginTop: 4,
  },
  errorMsg: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 2,
  },

  // Info card
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

  // Save button
  saveShadow: {
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 4,
  },
  saveShadowDim: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
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
