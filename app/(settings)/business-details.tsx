/**
 * Business Details settings screen.
 * Saves name, city, logo, description, and seller contact numbers.
 */
import ContactNumbersSection from "@/src/components/profile-setup/contact-numbers-section";
import type { ContactNumberData } from "@/src/components/profile-setup/profile-setup-schema";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useSession, useUploadLogo } from "@/src/hooks";
import {
  getLegacyPhoneFields,
  getProfileContactNumbers,
} from "@/src/lib/profiles";
import type { ContactNumber } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

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
  keyboardType,
  multiline,
  maxLength,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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

  return (
    <View>
      <View
        style={[
          styles.inputField,
          {
            backgroundColor: focused ? colors.surfaceCard : colors.surfaceContainer,
            borderColor: showError
              ? colors.error
              : focused
                ? colors.primary
                : "transparent",
          },
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
        />
        {maxLength !== undefined ? (
          <Text style={[styles.charCount, { color: colors.textMuted }]}>
            {value.length} / {maxLength}
          </Text>
        ) : null}
      </View>
      {showError && errorMsg ? (
        <Text style={[styles.errorMsg, { color: colors.error }]}>{errorMsg}</Text>
      ) : null}
    </View>
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
        <Pressable onPress={cta} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.retryBtnText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function validateContactNumbers(values: ContactNumberData[]) {
  const entryErrors = values.map((entry) => {
    const next: { number?: string; label?: string } = {};

    if (!entry.number.trim() || !E164_REGEX.test(entry.number.trim())) {
      next.number = "Enter a valid phone number with country code";
    }

    if (!entry.label.trim()) {
      next.label = "Add a label";
    }

    return Object.keys(next).length > 0 ? next : undefined;
  });

  let globalError: string | undefined;

  if (!values.length) {
    globalError = "Add at least one contact number";
  } else if (values.filter((entry) => entry.is_primary).length !== 1) {
    globalError = "One number must be set as primary";
  }

  return {
    entryErrors,
    globalError,
    isValid:
      !globalError && entryErrors.every((entry) => entry == null),
  };
}

export default function BusinessDetailsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const { userId } = useSession();
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
    refetch,
  } = useProfile(userId);
  const saveProfileMutation = useSaveProfile();
  const uploadLogoMutation = useUploadLogo();

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [contactNumbers, setContactNumbers] = useState<ContactNumberData[]>([
    {
      number: "",
      label: "WhatsApp",
      is_whatsapp: true,
      is_primary: true,
    },
  ]);
  const [contactErrors, setContactErrors] = useState<
    ({ number?: string; label?: string } | undefined)[]
  >([]);
  const [contactGlobalError, setContactGlobalError] = useState<string>();
  const [nameErr, setNameErr] = useState(false);

  const bannerY = useSharedValue(-40);
  const bannerOp = useSharedValue(0);

  useEffect(() => {
    if (!profile) return;

    setBusinessName(profile.business_name ?? "");
    setCity(profile.city ?? "");
    setDescription(profile.description ?? "");
    setLogoUri(profile.logo_url ?? null);
    setContactNumbers(getProfileContactNumbers(profile) as ContactNumberData[]);
  }, [profile]);

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
    if (status !== "granted") {
      showToast("Please allow photo access to upload your logo.", "info");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const isPending =
    saveProfileMutation.isPending || uploadLogoMutation.isPending;

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
    if (!userId || isPending) return;

    const trimmedName = businessName.trim();
    setNameErr(!trimmedName);

    const validation = validateContactNumbers(contactNumbers);
    setContactErrors(validation.entryErrors);
    setContactGlobalError(validation.globalError);

    if (!trimmedName || !validation.isValid) {
      return;
    }

    let finalLogoUrl: string | null = logoUri?.startsWith("https://")
      ? logoUri
      : (profile?.logo_url ?? null);

    if (logoUri && !logoUri.startsWith("https://")) {
      try {
        const result = await uploadLogoMutation.mutateAsync({
          userId,
          uri: logoUri,
        });

        if (result.error) {
          showToast("Couldn't upload your logo. Please try again.", "error");
        } else {
          finalLogoUrl = result.publicUrl;
        }
      } catch {
        showToast("Couldn't upload your logo. Please try again.", "error");
      }
    } else if (!logoUri) {
      finalLogoUrl = null;
    }

    const { phone, secondary_phone } = getLegacyPhoneFields(
      contactNumbers as ContactNumber[],
    );

    try {
      await saveProfileMutation.mutateAsync({
        id: userId,
        business_name: trimmedName,
        phone,
        secondary_phone,
        city: city.trim() || null,
        description: description.trim() || null,
        logo_url: finalLogoUrl,
        contact_numbers: contactNumbers as ContactNumber[],
        onboarding_complete: true,
      });

      await refetch();
      showBanner();
    } catch {
      showToast("Couldn't save your business details. Please try again.", "error");
    }
  };

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOp.value,
    transform: [{ translateY: bannerY.value }],
  }));

  const logoPreviewUri = useMemo(() => {
    if (!logoUri) return null;
    if (logoUri.startsWith("https://") && profile?.updated_at) {
      return `${logoUri}?v=${new Date(profile.updated_at).getTime()}`;
    }
    return logoUri;
  }, [logoUri, profile?.updated_at]);

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
          android_ripple={{ color: colors.surfaceContainer, borderless: false }}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Business Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

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

      {profileLoading ? (
        <View style={styles.centeredState}>
          <StateCard
            icon="loader"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            title="Loading business details"
            sub="We&apos;re fetching your current profile."
          />
        </View>
      ) : isError ? (
        <View style={styles.centeredState}>
          <StateCard
            icon="wifi-off"
            iconBg={colors.errorBg}
            iconColor={colors.error}
            title="Couldn't load your profile"
            sub="Check your connection and try again."
            cta={() => refetch()}
            ctaLabel="Try Again"
          />
        </View>
      ) : (
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
                  logoPreviewUri
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
                {logoPreviewUri ? (
                  <Image
                    source={{ uri: logoPreviewUri }}
                    style={styles.logoImage}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="briefcase" size={24} color={colors.textMuted} />
                )}
                <View
                  style={[
                    styles.logoBadge,
                    { borderColor: colors.surfaceCard },
                    logoPreviewUri
                      ? { backgroundColor: colors.success }
                      : { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather
                    name={logoPreviewUri ? "check" : "plus"}
                    size={11}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.logoInfo}>
                <Text style={[styles.logoTitle, { color: colors.textPrimary }]}>
                  Business logo
                </Text>
                <Text style={[styles.logoSub, { color: colors.textMuted }]}>
                  {logoPreviewUri
                    ? "Looking good. This shows on all tracking pages."
                    : "Shows on customer tracking pages. Square image, min 200x200px."}
                </Text>
                <View style={styles.logoActions}>
                  <Pressable
                    onPress={handlePickLogo}
                    style={[
                      styles.logoBtnPrimary,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logoBtnPrimaryText,
                        { color: colors.primary },
                      ]}
                    >
                      {logoPreviewUri ? "Change photo" : "Upload photo"}
                    </Text>
                  </Pressable>
                  {logoPreviewUri ? (
                    <Pressable
                      onPress={() => setLogoUri(null)}
                      style={[
                        styles.logoBtnDanger,
                        { backgroundColor: colors.errorBg },
                      ]}
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

            <SectionLabel label="Required" />
            <FormInput
              label="Business name"
              value={businessName}
              onChange={(value) => {
                setBusinessName(value);
                if (value.trim()) setNameErr(false);
              }}
              placeholder="e.g. Zara's Closet"
              hasError={nameErr}
              errorMsg="Business name cannot be empty"
            />

            <ContactNumbersSection
              values={contactNumbers}
              onChange={(updated) => {
                setContactNumbers(updated);
                setContactErrors([]);
                setContactGlobalError(undefined);
              }}
              errors={contactErrors}
              globalError={contactGlobalError}
            />

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

            <View style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}>
              <Feather
                name="eye"
                size={16}
                color={colors.primary}
                style={styles.infoCardIcon}
              />
              <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                Your <Text style={styles.bold}>business name</Text>,{" "}
                <Text style={styles.bold}>logo</Text>,{" "}
                <Text style={styles.bold}>contact numbers</Text>, and{" "}
                <Text style={styles.bold}>description</Text> appear on the pages
                your customers see.
              </Text>
            </View>

            <View
              style={[
                styles.saveShadow,
                { backgroundColor: colors.primary },
                isPending && styles.saveShadowDim,
              ]}
            >
              <Pressable onPress={handleSave} disabled={isPending} style={styles.savePressable}>
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtn}
                >
                  {isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 12,
    gap: 12,
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
  },
  stateCard: {
    marginHorizontal: layout.screenPaddingH,
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
  retryBtn: {
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: -4,
  },
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
  saveShadow: {
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 4,
  },
  saveShadowDim: {
    opacity: 0.6,
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
    minHeight: 50,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
