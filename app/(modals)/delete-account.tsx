/**
 * Delete account confirmation bottom sheet.
 * Calls the delete_user() Supabase RPC then signs out.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useDeleteAccount } from "@/src/hooks";
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
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeleteAccountSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const showToast = useToastStore((s) => s.show);
  const deleteAccount = useDeleteAccount();
  const queryClient = useQueryClient();
  const [confirmationText, setConfirmationText] = useState("");

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

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      await supabase.auth.signOut().catch(() => undefined);
      await resetLocalSessionState(queryClient);
      router.replace("/(auth)/sign-in");
    } catch {
      showToast("Could not delete your account. Please try again.", "error");
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
        snapPoints={[360 + insets.bottom]}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.errorBg }]}>
            <Feather name="trash-2" size={24} color={colors.error} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Delete account?</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            This permanently deletes your Trackshpr account,{"\n"}
            all your riders, orders, and data.{"\n"}
            <Text style={{ color: colors.error, fontFamily: font.sans.semiBold }}>
              This cannot be undone.
            </Text>
          </Text>
          <View
            style={[
              styles.confirmWrap,
              { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceContainer },
            ]}
          >
            <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>
              Type DELETE to confirm
            </Text>
            <TextInput
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleteAccount.isPending}
              placeholder="DELETE"
              placeholderTextColor={colors.textMuted}
              style={[styles.confirmInput, { color: colors.textPrimary }]}
            />
          </View>
          <View style={styles.btnWrap}>
            <Pressable
              onPress={handleDelete}
              disabled={deleteAccount.isPending || confirmationText !== "DELETE"}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={[
                styles.dangerBtn,
                { backgroundColor: colors.error },
                confirmationText !== "DELETE" && styles.dangerBtnDisabled,
              ]}
            >
              {deleteAccount.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.dangerBtnText}>Yes, delete my account</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              disabled={deleteAccount.isPending}
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
  confirmWrap: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  confirmInput: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    padding: 0,
    margin: 0,
  },
  btnWrap: { width: "100%", gap: 8 },
  dangerBtn: { borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden", minHeight: 50, justifyContent: "center" },
  dangerBtnDisabled: { opacity: 0.45 },
  dangerBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
  cancelBtn: { borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden" },
  cancelBtnText: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600" },
});
