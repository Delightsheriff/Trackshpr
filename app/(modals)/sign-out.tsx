/**
 * Sign out confirmation bottom sheet.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { resetLocalSessionState } from "@/src/lib/sessionReset";
import { supabase } from "@/src/lib/supabase";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignOutSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const handleClose = useCallback(() => router.back(), []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await resetLocalSessionState(queryClient);
      router.replace("/(auth)/sign-in");
    } catch {
      setLoading(false);
      showToast("Sign out failed. Please try again.", "error");
    }
  };

  const sheetShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 };

  return (
    <View style={styles.root}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={[300 + insets.bottom]}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.errorBg }]}>
            <Feather name="log-out" size={24} color={colors.error} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Sign out?</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            You&apos;ll need to sign back in to access your{"\n"}Trackshpr account.
          </Text>
          <View style={styles.btnWrap}>
            <Pressable
              onPress={handleSignOut}
              disabled={loading}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={[styles.dangerBtn, { backgroundColor: colors.error }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.dangerBtnText}>Yes, sign out</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              android_ripple={{ color: colors.textMuted, borderless: false }}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceContainer }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  sheetBg: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  content: { paddingHorizontal: layout.screenPaddingH, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", textAlign: "center", letterSpacing: -0.34, marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: font.sans.regular, textAlign: "center", lineHeight: 19.5, marginBottom: 20 },
  btnWrap: { width: "100%", gap: 8 },
  dangerBtn: { borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden", minHeight: 50, justifyContent: "center" },
  dangerBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
  cancelBtn: { borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden" },
  cancelBtnText: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600" },
});
