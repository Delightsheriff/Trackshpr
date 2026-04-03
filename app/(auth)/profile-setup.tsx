/**
 * Profile setup screen — light mode always (DS §9.2).
 * One-time setup: business name, contact numbers, location, socials, logo.
 */
import { colors, font } from "@/src/constants/tokens";
import { useProfile, useSaveProfile, useUploadLogo } from "@/src/hooks";
import { triggerAuthRecheck } from "@/src/lib/authRecheck";
import { pickLogoUri } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import type { ContactNumber } from "@/src/lib/supabaseQueries";
import { useToastStore } from "@/src/stores/toastStore";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ProfileSetupFormData,
  defaultContactNumber,
  defaultProfileSetupValues,
} from "@/src/components/profile-setup/profile-setup-schema";
import { ProfileSetupForm } from "@/src/components/profile-setup/profile-setup-form";
import { ProfileSetupHeader } from "@/src/components/profile-setup/profile-setup-header";

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToastStore();

  const [userId, setUserId] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
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

      const primaryContact = data.contactNumbers.find((n) => n.is_primary);
      const secondContact = data.contactNumbers.find(
        (n) => !n.is_primary && n.number,
      );

      saveMutation.mutate(
        {
          id: userId,
          business_name: data.businessName.trim(),
          // Derive phone/secondary_phone from contact_numbers for backward compat
          phone: primaryContact?.number ?? "",
          secondary_phone: secondContact?.number ?? null,
          city: data.city?.trim() || null,
          brand_name: data.description?.trim() || null,
          logo_url: data.logoPublicUrl ?? null,
          pickup_address: data.pickupAddress?.trim() || null,
          instagram_handle: data.instagramHandle?.trim() || null,
          tiktok_handle: data.tiktokHandle?.trim() || null,
          contact_numbers: data.contactNumbers as ContactNumber[],
          onboarding_complete: true,
        },
        {
          onSuccess: () => {
            showToast("Profile saved!", "success");
            // Re-evaluate auth status from DB — useAuthState will see
            // onboarding_complete: true and update to "authenticated".
            // _layout.tsx then redirects to /(tabs) automatically.
            // Do NOT call router.replace here: status is still "profile_incomplete"
            // until the recheck completes, which would cause a redirect loop.
            triggerAuthRecheck();
          },
          onError: () => {
            showToast("Could not save profile. Please try again.", "error");
          },
        },
      );
    },
    [userId, saveMutation, showToast],
  );

  // ── Skip ────────────────────────────────────────────────────────────────────
  // SAFETY: skip MUST navigate to /(tabs), never back to onboarding.
  // Setting onboarding_complete: true here ensures useAuthState resolves to
  // "authenticated" on recheck, which causes _layout.tsx to redirect to /(tabs).
  // If this ever navigates back to onboarding, check routeMap.ts — the
  // "authenticated" case must never return "/onboarding" as a target.
  const handleSkip = useCallback(async () => {
    if (!userId || skipping) return;
    setSkipping(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, onboarding_complete: true });
      if (error) throw new Error(error.message);
    } catch {
      // Non-critical: if this fails, the user will be re-routed to setup
      // on next app start. IncompleteProfileBanner will prompt them to finish.
    }
    setSkipping(false);
    triggerAuthRecheck(); // see SAFETY comment above
  }, [userId, skipping]);

  // ── Logo upload ─────────────────────────────────────────────────────────────
  const handleUploadLogo = useCallback(
    async (uri: string) => {
      if (!userId) return { error: new Error("No user id") };
      const result = await uploadMutation.mutateAsync({ userId, uri });
      if (result.error) {
        showToast("Logo upload failed. Try again.", "error");
      }
      return result;
    },
    [userId, uploadMutation, showToast],
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

  // ── Pre-populate from DB on return visits ───────────────────────────────────
  const initialValues: ProfileSetupFormData = profileData
    ? {
        businessName: profileData.business_name ?? "",
        contactNumbers:
          profileData.contact_numbers && profileData.contact_numbers.length > 0
            ? profileData.contact_numbers
            : [defaultContactNumber],
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

      {/* Skip button — floats over gradient header */}
      <View style={[styles.skipWrap, { top: insets.top + 12 }]}>
        <Pressable
          onPress={handleSkip}
          disabled={skipping || !userId}
          hitSlop={8}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnText}>
            {skipping ? "Skipping…" : "Skip for now"}
          </Text>
        </Pressable>
      </View>

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
  skipWrap: {
    position: "absolute",
    right: 18,
    zIndex: 10,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: -0.13,
    color: "rgba(255,255,255,0.65)",
  },
});
