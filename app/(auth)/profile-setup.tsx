/**
 * Profile setup screen — light mode always (DS §9.2).
 * One-time setup: business details, contact, socials, pickup info.
 */
import { colors } from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useUploadLogo } from "@/src/hooks";
import { pickLogoUri } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import { useToastStore } from "@/src/stores/toastStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileSetupHeader } from "@/src/components/profile-setup/profile-setup-header";
import { ProfileSetupForm } from "@/src/components/profile-setup/profile-setup-form";
import { ProfileSetupFormData, defaultProfileSetupValues } from "@/src/components/profile-setup/profile-setup-schema";

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToastStore();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: profileData, isLoading: profileLoading } = useProfile(userId);
  const saveMutation = useSaveProfile();
  const uploadMutation = useUploadLogo();

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (data: ProfileSetupFormData) => {
      if (!userId) {
        showToast("Session error. Please sign in again.", "error");
        return;
      }

      saveMutation.mutate(
        {
          id: userId,
          business_name: data.businessName.trim(),
          phone: data.phone.trim(),
          secondary_phone: data.secondaryPhone?.trim() || null,
          city: data.city?.trim() || null,
          brand_name: data.description?.trim() || null,
          logo_url: data.logoPublicUrl ?? null,
          pickup_address: data.pickupAddress?.trim() || null,
          instagram_handle: data.instagramHandle?.trim() || null,
          tiktok_handle: data.tiktokHandle?.trim() || null,
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
    },
    [userId, saveMutation, showToast]
  );

  // ── Skip ─────────────────────────────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({ onboarding_complete: false })
      .eq("id", userId);

    router.replace("/(tabs)");
  }, [userId]);

  const handleUploadLogo = useCallback(
    async (uri: string) => {
      if (!userId) return { error: new Error("No user id") };
      const result = await uploadMutation.mutateAsync({ userId, uri });
      if (result.error) {
        showToast("Logo upload failed. Try again.", "error");
      }
      return result;
    },
    [userId, uploadMutation, showToast]
  );

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

  const initialValues: ProfileSetupFormData = profileData
    ? {
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
      }
    : defaultProfileSetupValues;

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
          <ProfileSetupHeader />

          <ProfileSetupForm
            initialValues={initialValues}
            userId={userId ?? ""}
            onPickLogo={pickLogoUri}
            onUploadLogo={handleUploadLogo}
            onSave={handleSave}
            isSaving={saveMutation.isPending}
            onSkip={handleSkip}
          />
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
});
