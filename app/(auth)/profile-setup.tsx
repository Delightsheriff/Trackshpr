/**
 * Profile setup screen — light mode always (DS §9.2).
 * One-time setup: business details, contact, socials, pickup info.
 */
import {
  colors,
  font,
  gradients,
  radius,
} from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useUploadLogo } from "@/src/hooks";
import { pickLogoUri } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import LogoUploader from "@/src/components/auth/logo-uploader";
import { useToastStore } from "@/src/stores/toastStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  businessName: string;
  phone: string;
  secondaryPhone: string;
  city: string;
  description: string;
  pickupAddress: string;
  instagramHandle: string;
  tiktokHandle: string;
  logoLocalUri: string | null;
  logoPublicUrl: string | null;
}

const EMPTY: FormState = {
  businessName: "",
  phone: "",
  secondaryPhone: "",
  city: "",
  description: "",
  pickupAddress: "",
  instagramHandle: "",
  tiktokHandle: "",
  logoLocalUri: null,
  logoPublicUrl: null,
};

// ── Field components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={styles.sectionLabel}>{label}</Text>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      {children}
    </View>
  );
}

function FieldRow({
  icon,
  iconBg,
  label,
  required,
  hasError,
  children,
}: {
  icon: string;
  iconBg: string;
  label: string;
  required?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.inputRow}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.rowIconEmoji}>{icon}</Text>
      </View>
      <View style={styles.inputInner}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.fieldLabel,
              hasError && required && { color: colors.error },
            ]}
          >
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
        {children}
      </View>
    </View>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  prefix,
  multiline,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  prefix?: string;
  multiline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.textFieldWrap}>
      {prefix && <Text style={styles.fieldPrefix}>{prefix}</Text>}
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.textInput,
          focused && { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.lg },
          multiline && { height: 60, textAlignVertical: "top" as const },
        ]}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToastStore();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [requiredFocused, setRequiredFocused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: profileData, isLoading: profileLoading } = useProfile(userId);
  const saveMutation = useSaveProfile();
  const uploadMutation = useUploadLogo();

  useEffect(() => {
    if (!profileData) return;
    setForm({
      businessName: profileData.business_name ?? "",
      phone: profileData.phone ?? "",
      secondaryPhone: profileData.secondary_phone ?? "",
      city: profileData.city ?? "",
      description: profileData.brand_name ?? "",
      pickupAddress: profileData.pickup_address ?? "",
      instagramHandle: profileData.instagram_handle ?? "",
      tiktokHandle: profileData.tiktok_handle ?? "",
      logoLocalUri: profileData.logo_url,
      logoPublicUrl: profileData.logo_url,
    });
  }, [profileData]);

  const isFilled = form.businessName.trim().length > 0;
  const firstName = form.businessName.trim().split(" ")[0];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Logo ────────────────────────────────────────────────────────────────────
  const handlePickLogo = useCallback(async () => {
    const uri = await pickLogoUri();
    if (!uri || !userId) return;

    setForm((prev) => ({ ...prev, logoLocalUri: uri, logoPublicUrl: null }));
    setUploading(true);

    const result = await uploadMutation.mutateAsync({ userId, uri });
    if (result.error) showToast("Logo upload failed. Try again.", "error");
    setForm((prev) => ({ ...prev, logoPublicUrl: result.publicUrl ?? prev.logoPublicUrl }));
    setUploading(false);
  }, [userId, uploadMutation, showToast]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const nameOk = form.businessName.trim().length > 0;
    const phoneOk = form.phone.trim().length > 0;

    if (!nameOk || !phoneOk) {
      setHasError(true);
      showToast("Business name and WhatsApp number are required", "error");
      return;
    }

    if (!userId) {
      showToast("Session error. Please sign in again.", "error");
      return;
    }

    saveMutation.mutate(
      {
        id: userId,
        business_name: form.businessName.trim(),
        phone: form.phone.trim(),
        secondary_phone: form.secondaryPhone.trim() || null,
        city: form.city.trim() || null,
        brand_name: form.description.trim() || null,
        logo_url: form.logoPublicUrl ?? null,
        pickup_address: form.pickupAddress.trim() || null,
        instagram_handle: form.instagramHandle.trim() || null,
        tiktok_handle: form.tiktokHandle.trim() || null,
        onboarding_complete: true,
      },
      {
        onSuccess: () => {
          showToast("Profile saved! Let's go.", "success");
          router.replace("/(tabs)");
        },
        onError: () => {
          showToast("Could not save profile. Please try again.", "error");
        },
      },
    );
  }, [form, userId, saveMutation, showToast]);

  // ── Skip ─────────────────────────────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (!userId) return;
    
    await supabase.from("profiles").upsert({
      id: userId,
      onboarding_complete: false,
    });
    
    router.replace("/(tabs)");
  }, [userId]);

  const requiredBorder = hasError
    ? { borderWidth: 2, borderColor: colors.error }
    : requiredFocused
      ? { borderWidth: 2, borderColor: colors.primary }
      : { borderWidth: 0 };

  if (profileLoading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ───────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#4647D3", "#5354e8", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top }]}
          >
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.headerContent}>
              <View style={styles.stepTag}>
                <View style={styles.stepTagDot} />
                <Text style={styles.stepTagText}>One-time setup</Text>
              </View>
              <Text style={styles.headerTitle}>
                {"Set up your\nbusiness profile"}
              </Text>
              <Text style={styles.headerSub}>
                Shown on every customer tracking page
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.formBody}>
            {/* ── Logo + avatar ─────────────────────────────────────── */}
            <View style={styles.avatarRow}>
              <LogoUploader
                uri={form.logoLocalUri}
                uploading={uploading}
                onPress={handlePickLogo}
              />
            </View>

            {isFilled && (
              <View style={styles.welcomeChip}>
                <Text style={styles.welcomeChipIcon}>👋</Text>
                <Text style={styles.welcomeChipText}>
                  Looking good, {firstName}! Almost there.
                </Text>
              </View>
            )}

            {/* ── Required: Business info ────────────────────────────── */}
            <SectionLabel label="Business info" />
            <FieldGroup>
              <View style={[styles.requiredGroup, requiredBorder]}>
                <FieldRow
                  icon="🏪"
                  iconBg={hasError ? colors.errorBg : colors.primarySoft}
                  label="Business name"
                  required
                  hasError={hasError}
                >
                  <TextField
                    value={form.businessName}
                    onChange={(v) => {
                      set("businessName", v);
                      if (hasError) setHasError(false);
                    }}
                    onFocus={() => setRequiredFocused(true)}
                    onBlur={() => setRequiredFocused(false)}
                    placeholder="e.g. Zara's Closet"
                  />
                </FieldRow>
                <RowDivider />
                <FieldRow
                  icon="📱"
                  iconBg={hasError ? colors.errorBg : colors.warningBg}
                  label="WhatsApp number"
                  required
                  hasError={hasError}
                >
                  <TextField
                    value={form.phone}
                    onChange={(v) => {
                      set("phone", v);
                      if (hasError) setHasError(false);
                    }}
                    onFocus={() => setRequiredFocused(true)}
                    onBlur={() => setRequiredFocused(false)}
                    placeholder="0800 000 0000"
                    keyboardType="phone-pad"
                  />
                </FieldRow>
              </View>
            </FieldGroup>

            {hasError && (
              <View style={styles.errorRow}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>
                  Business name and WhatsApp number are required
                </Text>
              </View>
            )}

            {/* ── Optional: Contact & Location ─────────────────────────── */}
            <SectionLabel label="Contact & Location" />
            <FieldGroup>
              <FieldRow
                icon="📞"
                iconBg={colors.surfaceContainer}
                label="Secondary phone"
              >
                <TextField
                  value={form.secondaryPhone}
                  onChange={(v) => set("secondaryPhone", v)}
                  placeholder="Optional — second line"
                  keyboardType="phone-pad"
                />
              </FieldRow>
              <RowDivider />
              <FieldRow
                icon="📍"
                iconBg={colors.infoBg}
                label="City"
              >
                <TextField
                  value={form.city}
                  onChange={(v) => set("city", v)}
                  placeholder="e.g. Lagos"
                />
              </FieldRow>
              <RowDivider />
              <FieldRow
                icon="🏠"
                iconBg={colors.successBg}
                label="Pickup address"
              >
                <TextField
                  value={form.pickupAddress}
                  onChange={(v) => set("pickupAddress", v)}
                  placeholder="Where riders collect packages from"
                  multiline
                />
              </FieldRow>
            </FieldGroup>

            {/* ── Optional: About ─────────────────────────────────────── */}
            <SectionLabel label="About" />
            <FieldGroup>
              <FieldRow
                icon="✏️"
                iconBg={colors.primarySoft}
                label="Short description"
              >
                <TextField
                  value={form.description}
                  onChange={(v) => set("description", v)}
                  placeholder="What do you sell?"
                  multiline
                />
              </FieldRow>
            </FieldGroup>

            {/* ── Optional: Social ────────────────────────────────────── */}
            <SectionLabel label="Social handles" />
            <FieldGroup>
              <FieldRow
                icon="📸"
                iconBg={colors.surfaceContainer}
                label="Instagram"
              >
                <TextField
                  value={form.instagramHandle}
                  onChange={(v) => set("instagramHandle", v)}
                  placeholder="@yourbusiness"
                />
              </FieldRow>
              <RowDivider />
              <FieldRow
                icon="🎵"
                iconBg={colors.surfaceContainer}
                label="TikTok"
              >
                <TextField
                  value={form.tiktokHandle}
                  onChange={(v) => set("tiktokHandle", v)}
                  placeholder="@yourbusiness"
                />
              </FieldRow>
            </FieldGroup>

            {!isFilled && (
              <View style={styles.infoNote}>
                <Text style={styles.infoNoteIcon}>👁️</Text>
                <Text style={styles.infoNoteText}>
                  Your{" "}
                  <Text style={{ fontFamily: font.sans.semiBold }}>
                    business name
                  </Text>{" "}
                  and{" "}
                  <Text style={{ fontFamily: font.sans.semiBold }}>logo</Text>{" "}
                  appear on every customer tracking page you share.
                </Text>
              </View>
            )}
          </View>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <View style={styles.saveBtnShadow}>
            <Pressable
              onPress={handleSave}
              disabled={saveMutation.isPending}
              android_ripple={{ color: "rgba(255,255,255,0.20)", borderless: false }}
              style={styles.saveBtnPressable}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtnGradient}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isFilled ? "Save & Continue →" : "Continue →"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Skip ────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleSkip}
            style={[styles.skipWrap, isFilled && { opacity: 0 }]}
            disabled={isFilled}
          >
            <Text style={styles.skipText}>
              Fill in later?{" "}
              <Text style={styles.skipLink}>Skip for now</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    minHeight: 120,
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  orb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: 24,
  },
  headerContent: {
    padding: 16,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  stepTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stepTagDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  stepTagText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
  },

  // Form
  formBody: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 6,
  },

  // Logo
  avatarRow: {
    alignItems: "center",
    paddingVertical: 20,
  },

  // Welcome chip
  welcomeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  welcomeChipIcon: { fontSize: 18 },
  welcomeChipText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.success,
    flex: 1,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Field group
  fieldGroup: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Required group
  requiredGroup: {
    overflow: "hidden",
    borderRadius: radius.xl,
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginLeft: 62,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowIconEmoji: { fontSize: 16 },
  inputInner: { flex: 1 },
  labelRow: {
    marginBottom: 3,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  requiredAsterisk: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.error,
  },

  // Text field
  textFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldPrefix: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    color: colors.textSecondary,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
    paddingVertical: 2,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  errorIcon: { fontSize: 12 },
  errorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.error,
  },

  // Info note
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  infoNoteIcon: { fontSize: 16, flexShrink: 0 },
  infoNoteText: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    lineHeight: 16.5,
    flex: 1,
  },

  // CTA
  saveBtnShadow: {
    marginHorizontal: 18,
    marginTop: 8,
    borderRadius: 100,
    shadowColor: "rgba(70,71,211,1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    backgroundColor: colors.primary,
  },
  saveBtnPressable: {
    borderRadius: 100,
    overflow: "hidden",
  },
  saveBtnGradient: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
  },

  // Skip
  skipWrap: {
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 16,
  },
  skipText: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },
  skipLink: {
    color: colors.textSecondary,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
});
