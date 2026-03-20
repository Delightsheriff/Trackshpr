/**
 * Delete Customer confirmation sheet (DS §11.4).
 * Receives customerId and customerName as search params.
 * TODO: replace deleteCustomer with Supabase delete.
 */
import { colors, font, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useToastStore } from "@/src/stores/toastStore";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeleteCustomerSheet() {
  const insets        = useSafeAreaInsets();
  const { id, name }  = useLocalSearchParams<{ id: string; name: string }>();
  const sheetRef      = useRef<BottomSheet>(null);
  const deleteCustomer= useDataStore((s) => s.deleteCustomer);
  const showToast     = useToastStore((s) => s.show);

  const handleClose    = useCallback(() => router.back(), []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ), []
  );

  const handleDelete = () => {
    deleteCustomer(id);
    showToast(`${name} removed`, "error");
    router.back();
  };

  return (
    <View style={styles.root}>
      <BottomSheet ref={sheetRef} index={0} snapPoints={[320 + insets.bottom]} enablePanDownToClose onClose={handleClose}
        backdropComponent={renderBackdrop} backgroundStyle={styles.sheetBg} handleIndicatorStyle={styles.handle}>
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.iconWrap}><Text style={styles.icon}>🗑️</Text></View>
          <Text style={styles.title}>Remove {name}?</Text>
          <Text style={styles.sub}>
            This removes them from your address book.{"\n"}Their order history stays on record.
          </Text>
          <View style={styles.btnWrap}>
            <Pressable onPress={handleDelete} android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }} style={styles.dangerBtn}>
              <Text style={styles.dangerBtnText}>Yes, Remove Customer</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} android_ripple={{ color: colors.textMuted, borderless: false }} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  sheetBg: { backgroundColor: colors.surfaceCard },
  handle: { backgroundColor: colors.surfaceContainer },
  content: { paddingHorizontal: layout.screenPaddingH, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.errorBg, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  icon: { fontSize: 24 },
  title: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", color: colors.textPrimary, textAlign: "center", letterSpacing: -0.34, marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: font.sans.regular, color: colors.textMuted, textAlign: "center", lineHeight: 19.5, marginBottom: 20 },
  btnWrap: { width: "100%", gap: 8 },
  dangerBtn: { backgroundColor: colors.error, borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden" },
  dangerBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: colors.white },
  cancelBtn: { backgroundColor: colors.surfaceContainer, borderRadius: radius.full, paddingVertical: 14, alignItems: "center", overflow: "hidden" },
  cancelBtnText: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600", color: colors.textSecondary },
});
