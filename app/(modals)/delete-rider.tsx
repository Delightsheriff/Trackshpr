/**
 * Delete Rider confirmation sheet (DS §11.4 destructive action pattern).
 * Receives riderId and riderName as search params.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useDeleteRider, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeleteRiderSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const sheetRef = useRef<BottomSheet>(null);
  const showToast = useToastStore((s) => s.show);
  const { userId } = useSession();
  const deleteRider = useDeleteRider(userId);

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

  const handleDelete = () => {
    deleteRider.mutate(id, {
      onSuccess: () => {
        showToast(`${name} removed`, "error");
        router.back();
      },
      onError: () => {
        showToast("Could not remove rider. Please try again.", "error");
      },
    });
  };

  const sheetShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 };

  return (
    <View style={styles.root}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={[320 + insets.bottom]}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.errorBg }]}>
            <Feather name="trash-2" size={24} color={colors.error} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Remove {name}?
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            This removes them from your rider registry.{"\n"}Their delivery
            history stays on record.
          </Text>
          <View style={styles.btnWrap}>
            <Pressable
              onPress={handleDelete}
              disabled={deleteRider.isPending}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={[styles.dangerBtn, { backgroundColor: colors.error }]}
            >
              {deleteRider.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.dangerBtnText}>Yes, Remove Rider</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              disabled={deleteRider.isPending}
              android_ripple={{ color: colors.textMuted, borderless: false }}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceContainer }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
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
  iconWrap: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  title: {
    fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700",
    textAlign: "center", letterSpacing: -0.34, marginBottom: 6,
  },
  sub: {
    fontSize: 13, fontFamily: font.sans.regular,
    textAlign: "center", lineHeight: 19.5, marginBottom: 20,
  },
  btnWrap: { width: "100%", gap: 8 },
  dangerBtn: {
    borderRadius: radius.full, paddingVertical: 14,
    alignItems: "center", overflow: "hidden", minHeight: 50, justifyContent: "center",
  },
  dangerBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
  cancelBtn: {
    borderRadius: radius.full, paddingVertical: 14,
    alignItems: "center", overflow: "hidden",
  },
  cancelBtnText: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600" },
});
