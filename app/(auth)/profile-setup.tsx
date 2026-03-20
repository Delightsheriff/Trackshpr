/**
 * Profile setup screen — light mode always (DS §9.2)
 * One-time setup: business_name, phone, city, description, logo
 */
import {
  colors,
  font,
  gradients,
  radius,
  type as t,
} from "@/src/constants/tokens";
import { supabase } from "@/src/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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

// ── Sub-components ────────────────────────────────────────────────────────────

type StepStatus = "active" | "pending" | "done";

function ProgressStep({
  num,
  label,
  status,
}: {
  num: string;
  label: string;
  status: StepStatus;
}) {
  const circleStyle = [
    styles.stepCircle,
    status === "active" && styles.stepCircleActive,
    status === "done" && styles.stepCircleDone,
    status === "pending" && styles.stepCirclePending,
  ];
  const labelStyle = [
    styles.stepLabel,
    status === "active" && styles.stepLabelActive,
    status === "done" && styles.stepLabelDone,
  ];

  return (
    <View style={styles.stepItem}>
      <View style={circleStyle}>
        <Text
          style={[
            styles.stepNum,
            status === "active" && { color: colors.white },
            status === "done" && { color: colors.success },
            status === "pending" && { color: colors.textMuted },
          ]}
        >
          {status === "done" ? "✓" : num}
        </Text>
      </View>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

function StepConnector({ done = false }: { done?: boolean }) {
  return (
    <View
      style={[
        styles.stepConnector,
        done && { backgroundColor: colors.successBg },
      ]}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();

  // ── Form state ──
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  // ── Logo state ──
  const [logoLocalUri, setLogoLocalUri] = useState<string | null>(null);
  const [logoPublicUrl, setLogoPublicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── UI state ──
  const [saving, setSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [requiredFocused, setRequiredFocused] = useState(false);

  // ── Derived ──
  const isFilled = businessName.trim().length > 0;
  const firstName = businessName.trim().split(" ")[0];

  // ── Logo upload ──
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLogoLocalUri(asset.uri);
    setLogoPublicUrl(null);
    uploadLogo(asset.uri);
  };

  const uploadLogo = async (uri: string) => {
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${user.id}.${ext}`;
      const contentType = ext === "png" ? "image/png" : "image/jpeg";

      const res = await fetch(uri);
      const blob = await res.blob();

      const { error } = await supabase.storage
        .from("logos")
        .upload(fileName, blob, { upsert: true, contentType });

      if (!error) {
        const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
        setLogoPublicUrl(data.publicUrl);
      }
    } finally {
      setUploading(false);
    }
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

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        business_name: businessName.trim(),
        phone: phone.trim(),
        city: city.trim() || null,
        brand_name: description.trim() || null, // maps description → brand_name
        logo_url: logoPublicUrl ?? null,
        onboarding_complete: true,
      });

      if (error) throw error;
      router.replace("/(tabs)");
    } catch {
      // Could show a toast here — keeping it simple for now
    } finally {
      setSaving(false);
    }
  };

  // ── Skip ──
  const handleSkip = () => {
    // Navigate without setting onboarding_complete
    router.replace("/(tabs)");
  };

  // ── Field group shadow ──
  const requiredGroupShadow = hasError
    ? styles.fieldGroupError
    : requiredFocused
      ? styles.fieldGroupFocused
      : undefined;

  // ── Render ──
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
            {/* Decorative orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* Content */}
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

          {/* ── Avatar upload (overlaps header) ───────────────────────── */}
          <View style={styles.avatarWrapRow}>
            <Pressable
              onPress={pickLogo}
              style={[
                styles.avatarWrap,
                logoLocalUri && styles.avatarWrapFilled,
              ]}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : logoLocalUri ? (
                <Image
                  source={{ uri: logoLocalUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <>
                  <Text style={styles.avatarEmoji}>🏪</Text>
                  <Text style={styles.avatarLabel}>Add logo</Text>
                </>
              )}

              <View
                style={[
                  styles.avatarBadge,
                  logoLocalUri && {
                    backgroundColor: uploading
                      ? colors.primary
                      : colors.success,
                  },
                ]}
              >
                <Text style={styles.avatarBadgeText}>
                  {logoLocalUri && !uploading ? "✓" : "+"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* ── Progress steps ────────────────────────────────────────── */}
          <View style={styles.progressRow}>
            <ProgressStep num="1" label="Profile" status="active" />
            <StepConnector />
            <ProgressStep num="2" label="Explore" status="pending" />
            <StepConnector />
            <ProgressStep num="3" label="Dashboard" status="pending" />
          </View>

          {/* ── Form body ─────────────────────────────────────────────── */}
          <View style={styles.formBody}>
            {/* Welcome chip — appears when business name has a value */}
            {isFilled && (
              <View style={styles.welcomeChip}>
                <Text style={styles.welcomeChipIcon}>👋</Text>
                <Text style={styles.welcomeChipText}>
                  Looking good, {firstName}! Almost there.
                </Text>
              </View>
            )}

            {/* Required fields group */}
            <View style={[styles.fieldGroup, requiredGroupShadow]}>
              {/* Business name */}
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.rowIcon,
                    {
                      backgroundColor: hasError
                        ? colors.errorBg
                        : colors.primarySoft,
                    },
                  ]}
                >
                  <Text style={styles.rowIconEmoji}>🏪</Text>
                </View>
                <View style={styles.inputInner}>
                  <View style={styles.labelRow}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        hasError && { color: colors.error },
                      ]}
                    >
                      Business name
                    </Text>
                    <Text style={styles.requiredAsterisk}> *</Text>
                  </View>
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
                </View>
              </View>

              <View style={styles.rowDivider} />

              {/* WhatsApp number */}
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.rowIcon,
                    {
                      backgroundColor: hasError
                        ? colors.errorBg
                        : colors.warningBg,
                    },
                  ]}
                >
                  <Text style={styles.rowIconEmoji}>📱</Text>
                </View>
                <View style={styles.inputInner}>
                  <View style={styles.labelRow}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        hasError && { color: colors.error },
                      ]}
                    >
                      WhatsApp number
                    </Text>
                    <Text style={styles.requiredAsterisk}> *</Text>
                  </View>
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
                </View>
              </View>
            </View>

            {/* Validation error message */}
            {hasError && (
              <View style={styles.errorRow}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>
                  Business name and WhatsApp number are required
                </Text>
              </View>
            )}

            {/* Optional fields group */}
            <View style={styles.fieldGroup}>
              {/* City */}
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.infoBg },
                  ]}
                >
                  <Text style={styles.rowIconEmoji}>📍</Text>
                </View>
                <View style={styles.inputInner}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Lagos"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.optionalTag}>
                  <Text style={styles.optionalTagText}>Optional</Text>
                </View>
              </View>

              <View style={styles.rowDivider} />

              {/* Short description */}
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.successBg },
                  ]}
                >
                  <Text style={styles.rowIconEmoji}>✏️</Text>
                </View>
                <View style={styles.inputInner}>
                  <Text style={styles.fieldLabel}>Short description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What do you sell?"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.optionalTag}>
                  <Text style={styles.optionalTagText}>Optional</Text>
                </View>
              </View>
            </View>

            {/* Info note — only when no welcome chip */}
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

          {/* ── CTA button ────────────────────────────────────────────── */}
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

          {/* ── Skip link ─────────────────────────────────────────────── */}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Header ──
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
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.06 * 10,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: font.sans.bold,
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

  // ── Avatar ──
  avatarWrapRow: {
    alignItems: "center",
    marginTop: -28,
    marginBottom: 20,
    zIndex: 10,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surfaceCard,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    boxShadow: "0 4px 20px rgba(48, 41, 80, 0.15)",
  },
  avatarWrapFilled: {
    backgroundColor: "#FFF7ED",
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    color: colors.primary,
    letterSpacing: 0.04 * 9,
    textTransform: "uppercase",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    boxShadow: "0 2px 8px rgba(70, 71, 211, 0.40)",
  },
  avatarBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: font.sans.bold,
  },

  // ── Progress steps ──
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingBottom: 6,
  },
  stepItem: {
    alignItems: "center",
    gap: 5,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: colors.successBg,
  },
  stepCirclePending: {
    backgroundColor: colors.surfaceContainer,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: font.sans.bold,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "500",
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    letterSpacing: 0.02 * 9,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: font.sans.bold,
  },
  stepLabelDone: {
    color: colors.success,
  },
  stepConnector: {
    width: 24,
    height: 2,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 2,
    marginBottom: 14,
  },

  // ── Form ──
  formBody: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 10,
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
  },
  welcomeChipIcon: {
    fontSize: 18,
  },
  welcomeChipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    color: colors.success,
    flex: 1,
  },

  // Field group card
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

  // Input row inside card
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
    marginLeft: 14 + 36 + 12, // align with text content
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowIconEmoji: {
    fontSize: 16,
  },
  inputInner: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.05 * 10,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  requiredAsterisk: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    color: colors.error,
  },
  textInput: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: font.sans.semiBold,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },

  // Optional tag
  optionalTag: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  optionalTagText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.04 * 9,
    textTransform: "uppercase",
    color: colors.textMuted,
  },

  // Validation error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  errorIcon: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: font.sans.semiBold,
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
  },
  infoNoteIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  infoNoteText: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    lineHeight: 16.5,
    flex: 1,
  },

  // ── CTA ──
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
    fontWeight: "700",
    fontFamily: font.sans.bold,
    color: colors.white,
  },

  // ── Skip ──
  skipWrap: {
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 16,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },
  skipLink: {
    color: colors.textSecondary,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
});
