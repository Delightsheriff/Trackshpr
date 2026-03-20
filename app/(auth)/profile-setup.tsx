/**
 * Profile setup screen — light mode always (DS §9.2).
 * One-time setup: business_name, phone, city, description, logo.
 * API calls live in src/lib/profiles.ts; sub-components in src/components/auth/.
 */
import {
  colors,
  font,
  gradients,
  radius,
} from "@/src/constants/tokens";
import { pickLogoUri, saveProfile, uploadLogo } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import LogoUploader from "@/src/components/auth/logo-uploader";
import SetupProgress from "@/src/components/auth/setup-progress";
import type { ProgressStep } from "@/src/components/auth/setup-progress";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

const STEPS: ProgressStep[] = [
  { num: "1", label: "Profile", status: "active" },
  { num: "2", label: "Explore", status: "pending" },
  { num: "3", label: "Dashboard", status: "pending" },
];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  // Logo state
  const [logoLocalUri, setLogoLocalUri] = useState<string | null>(null);
  const [logoPublicUrl, setLogoPublicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [requiredFocused, setRequiredFocused] = useState(false);

  const isFilled = businessName.trim().length > 0;
  const firstName = businessName.trim().split(" ")[0];

  // ── Logo ──
  const handlePickLogo = async () => {
    const uri = await pickLogoUri();
    if (!uri) return;

    setLogoLocalUri(uri);
    setLogoPublicUrl(null);
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const { publicUrl } = await uploadLogo(user.id, uri);
    setLogoPublicUrl(publicUrl);
    setUploading(false);
  };

  // ── Save ──
  const handleSave = async () => {
    const nameOk = businessName.trim().length > 0;
    const phoneOk = phone.trim().length > 0;

    if (!nameOk || !phoneOk) {
      setHasError(true);
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const { error } = await saveProfile({
        id: user.id,
        business_name: businessName.trim(),
        phone: phone.trim(),
        city: city.trim() || null,
        brand_name: description.trim() || null,
        logo_url: logoPublicUrl ?? null,
      });

      if (error) throw new Error(error);
      router.replace("/(tabs)");
    } catch {
      // Toast would go here — keeping simple for now
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => router.replace("/(tabs)");

  const requiredGroupShadow = hasError
    ? styles.fieldGroupError
    : requiredFocused
      ? styles.fieldGroupFocused
      : undefined;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
          {/* ── Header band ──────────────────────────────────────────── */}
          <LinearGradient
            colors={["#4647D3", "#5354e8", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
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

          {/* ── Avatar upload (overlaps header) ──────────────────────── */}
          <View style={styles.avatarRow}>
            <LogoUploader
              uri={logoLocalUri}
              uploading={uploading}
              onPress={handlePickLogo}
            />
          </View>

          {/* ── Progress steps ────────────────────────────────────────── */}
          <SetupProgress steps={STEPS} />

          {/* ── Form ─────────────────────────────────────────────────── */}
          <View style={styles.formBody}>
            {isFilled && (
              <View style={styles.welcomeChip}>
                <Text style={styles.welcomeChipIcon}>👋</Text>
                <Text style={styles.welcomeChipText}>
                  Looking good, {firstName}! Almost there.
                </Text>
              </View>
            )}

            {/* Required fields */}
            <View style={[styles.fieldGroup, requiredGroupShadow]}>
              <FieldRow
                icon="🏪"
                iconBg={hasError ? colors.errorBg : colors.primarySoft}
                label="Business name"
                required
                hasError={hasError}
              >
                <TextInput
                  value={businessName}
                  onChangeText={(v) => {
                    setBusinessName(v);
                    if (hasError) setHasError(false);
                  }}
                  onFocus={() => setRequiredFocused(true)}
                  onBlur={() => setRequiredFocused(false)}
                  placeholder="e.g. Zara's Closet"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                  returnKeyType="next"
                />
              </FieldRow>

              <View style={styles.rowDivider} />

              <FieldRow
                icon="📱"
                iconBg={hasError ? colors.errorBg : colors.warningBg}
                label="WhatsApp number"
                required
                hasError={hasError}
              >
                <TextInput
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    if (hasError) setHasError(false);
                  }}
                  onFocus={() => setRequiredFocused(true)}
                  onBlur={() => setRequiredFocused(false)}
                  placeholder="0800 000 0000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={styles.textInput}
                  returnKeyType="next"
                />
              </FieldRow>
            </View>

            {hasError && (
              <View style={styles.errorRow}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>
                  Business name and WhatsApp number are required
                </Text>
              </View>
            )}

            {/* Optional fields */}
            <View style={styles.fieldGroup}>
              <FieldRow
                icon="📍"
                iconBg={colors.infoBg}
                label="City"
                optional
              >
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Lagos"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                  returnKeyType="next"
                />
              </FieldRow>

              <View style={styles.rowDivider} />

              <FieldRow
                icon="✏️"
                iconBg={colors.successBg}
                label="Short description"
                optional
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What do you sell?"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                  returnKeyType="done"
                />
              </FieldRow>
            </View>

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
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtnWrap,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isFilled ? "Save & Continue →" : "Continue →"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* ── Skip ─────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleSkip}
            style={[
              styles.skipWrap,
              isFilled && { opacity: 0, pointerEvents: "none" },
            ]}
            pointerEvents={isFilled ? "none" : "auto"}
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

// ── FieldRow ──────────────────────────────────────────────────────────────────

function FieldRow({
  icon,
  iconBg,
  label,
  required,
  optional,
  hasError,
  children,
}: {
  icon: string;
  iconBg: string;
  label: string;
  required?: boolean;
  optional?: boolean;
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
          </Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
        {children}
      </View>
      {optional && (
        <View style={styles.optionalTag}>
          <Text style={styles.optionalTagText}>Optional</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    height: 116,
    overflow: "hidden",
    position: "relative",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
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

  // Avatar
  avatarRow: {
    alignItems: "center",
    marginTop: -28,
    marginBottom: 20,
    zIndex: 10,
  },

  // Form
  formBody: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 10,
  },
  welcomeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  welcomeChipIcon: { fontSize: 18 },
  welcomeChipText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.success,
    flex: 1,
  },
  fieldGroup: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    boxShadow: "0 1px 8px rgba(48, 41, 80, 0.05)",
  },
  fieldGroupFocused: {
    boxShadow:
      "0 0 0 2px rgba(70, 71, 211, 1), 0 1px 8px rgba(48, 41, 80, 0.05)",
  },
  fieldGroupError: {
    boxShadow:
      "0 0 0 2px rgba(220, 38, 38, 1), 0 1px 8px rgba(48, 41, 80, 0.05)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginLeft: 62, // icon width + padding + gap
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
    flexDirection: "row",
    alignItems: "center",
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
  textInput: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  optionalTag: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  optionalTagText: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.36,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  errorIcon: { fontSize: 12 },
  errorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.error,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
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
  saveBtnWrap: {
    marginHorizontal: 18,
    marginTop: 4,
  },
  saveBtn: {
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    boxShadow: "0 8px 24px rgba(70, 71, 211, 0.35)",
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
