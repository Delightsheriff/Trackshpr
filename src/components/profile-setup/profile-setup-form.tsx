import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LogoUploader from "@/src/components/auth/logo-uploader";
import { colors, font, gradients } from "@/src/constants/tokens";

import { ProfileSetupFormData, profileSetupSchema } from "./profile-setup-schema";
import { SectionLabel, FieldGroup, FieldRow, TextField, RowDivider } from "./profile-setup-fields";

interface ProfileSetupFormProps {
  initialValues: ProfileSetupFormData;
  userId: string;
  onPickLogo: () => Promise<string | null>;
  onUploadLogo: (uri: string) => Promise<{ error?: any; publicUrl?: string | null }>;
  onSave: (data: ProfileSetupFormData) => void;
  isSaving: boolean;
  onSkip: () => void;
}

export function ProfileSetupForm({
  initialValues,
  userId,
  onPickLogo,
  onUploadLogo,
  onSave,
  isSaving,
  onSkip,
}: ProfileSetupFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: initialValues,
  });

  const [uploading, setUploading] = useState(false);
  const [requiredFocused, setRequiredFocused] = useState<{ businessName: boolean; phone: boolean }>({
    businessName: false,
    phone: false,
  });

  const businessName = watch("businessName");
  const logoLocalUri = watch("logoLocalUri");
  const isFilled = (businessName?.trim().length || 0) > 0;
  const firstName = businessName?.trim().split(" ")[0];

  const hasBusinessNameError = !!errors.businessName;
  const hasPhoneError = !!errors.phone;

  const handleLogoUpload = async () => {
    const uri = await onPickLogo();
    if (!uri) return;
    
    setValue("logoLocalUri", uri);
    setValue("logoPublicUrl", null);
    
    setUploading(true);
    const result = await onUploadLogo(uri);
    if (!result.error && result.publicUrl) {
      setValue("logoPublicUrl", result.publicUrl);
    }
    setUploading(false);
  };

  const requiredBorder = hasBusinessNameError || hasPhoneError
    ? { borderWidth: 2, borderColor: colors.error }
    : requiredFocused.businessName || requiredFocused.phone
      ? { borderWidth: 2, borderColor: colors.primary }
      : { borderWidth: 0 };

  return (
    <View style={styles.formBody}>
      {/* ── Logo + avatar ─────────────────────────────────────── */}
      <View style={styles.avatarRow}>
        <LogoUploader
          uri={logoLocalUri ?? null}
          uploading={uploading}
          onPress={handleLogoUpload}
        />
      </View>

      {isFilled && (
        <View style={styles.welcomeChip}>
          <Feather
            name="smile"
            size={18}
            color={colors.success}
            style={styles.welcomeChipIcon}
          />
          <Text style={styles.welcomeChipText}>
            Looking good, {firstName}! Almost there.
          </Text>
        </View>
      )}

      {/* ── Required: Business info ────────────────────────────── */}
      <SectionLabel label="Business info" />
      <FieldGroup>
        <View style={[styles.requiredGroup, requiredBorder]}>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldRow
                icon="briefcase"
                iconBg={hasBusinessNameError ? colors.errorBg : colors.primarySoft}
                label="Business name"
                required
                hasError={hasBusinessNameError}
              >
                <TextField
                  value={value}
                  onChange={onChange}
                  onFocus={() => setRequiredFocused((prev) => ({ ...prev, businessName: true }))}
                  onBlur={() => {
                    setRequiredFocused((prev) => ({ ...prev, businessName: false }));
                    onBlur();
                  }}
                  placeholder="e.g. Zara's Closet"
                />
              </FieldRow>
            )}
          />
          <RowDivider />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldRow
                icon="phone"
                iconBg={hasPhoneError ? colors.errorBg : colors.warningBg}
                label="WhatsApp number"
                required
                hasError={hasPhoneError}
              >
                <TextField
                  value={value}
                  onChange={onChange}
                  onFocus={() => setRequiredFocused((prev) => ({ ...prev, phone: true }))}
                  onBlur={() => {
                    setRequiredFocused((prev) => ({ ...prev, phone: false }));
                    onBlur();
                  }}
                  placeholder="0800 000 0000"
                  keyboardType="phone-pad"
                />
              </FieldRow>
            )}
          />
        </View>
      </FieldGroup>

      {(hasBusinessNameError || hasPhoneError) && (
        <View style={styles.errorRow}>
          <Feather
            name="alert-triangle"
            size={12}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>
            Business name and WhatsApp number are required
          </Text>
        </View>
      )}

      {/* ── Optional: Contact & Location ─────────────────────────── */}
      <SectionLabel label="Contact & Location" />
      <FieldGroup>
        <Controller
          control={control}
          name="secondaryPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow
              icon="phone-call"
              iconBg={colors.surfaceContainer}
              label="Secondary phone"
            >
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Optional — second line"
                keyboardType="phone-pad"
              />
            </FieldRow>
          )}
        />
        <RowDivider />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow icon="map-pin" iconBg={colors.infoBg} label="City">
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. Lagos"
              />
            </FieldRow>
          )}
        />
        <RowDivider />
        <Controller
          control={control}
          name="pickupAddress"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow
              icon="home"
              iconBg={colors.successBg}
              label="Pickup address"
            >
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Where riders collect packages from"
                multiline
              />
            </FieldRow>
          )}
        />
      </FieldGroup>

      {/* ── Optional: About ─────────────────────────────────────── */}
      <SectionLabel label="About" />
      <FieldGroup>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow
              icon="edit-2"
              iconBg={colors.primarySoft}
              label="Short description"
            >
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="What do you sell?"
                multiline
              />
            </FieldRow>
          )}
        />
      </FieldGroup>

      {/* ── Optional: Social ────────────────────────────────────── */}
      <SectionLabel label="Social handles" />
      <FieldGroup>
        <Controller
          control={control}
          name="instagramHandle"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow
              icon="instagram"
              iconBg={colors.surfaceContainer}
              label="Instagram"
            >
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="@yourbusiness"
              />
            </FieldRow>
          )}
        />
        <RowDivider />
        <Controller
          control={control}
          name="tiktokHandle"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldRow
              icon="music"
              iconBg={colors.surfaceContainer}
              label="TikTok"
            >
              <TextField
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="@yourbusiness"
              />
            </FieldRow>
          )}
        />
      </FieldGroup>

      {!isFilled && (
        <View style={styles.infoNote}>
          <Feather
            name="eye"
            size={16}
            color={colors.primary}
            style={styles.infoNoteIcon}
          />
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

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <View style={styles.saveBtnShadow}>
        <Pressable
          onPress={handleSubmit(onSave)}
          disabled={isSaving}
          android_ripple={{
            color: "rgba(255,255,255,0.20)",
            borderless: false,
          }}
          style={styles.saveBtnPressable}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnGradient}
          >
            {isSaving ? (
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
        onPress={onSkip}
        style={[styles.skipWrap, isFilled && { opacity: 0 }]}
        disabled={isFilled}
      >
        <Text style={styles.skipText}>
          Fill in later? <Text style={styles.skipLink}>Skip for now</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formBody: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 6,
  },
  avatarRow: {
    alignItems: "center",
    paddingVertical: 20,
  },
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
  welcomeChipIcon: { flexShrink: 0 },
  welcomeChipText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.success,
    flex: 1,
  },
  requiredGroup: {
    overflow: "hidden",
    borderRadius: 16,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  errorIcon: { flexShrink: 0 },
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
    marginTop: 6,
  },
  infoNoteIcon: { flexShrink: 0 },
  infoNoteText: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    lineHeight: 16.5,
    flex: 1,
  },
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
