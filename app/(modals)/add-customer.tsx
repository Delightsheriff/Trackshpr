/**
 * Add Customer bottom sheet.
 * TODO: replace addCustomer with Supabase insert.
 */
import { colors, font, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useToastStore } from "@/src/stores/toastStore";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function SheetInput({ label, value, onChange, placeholder, keyboardType, optional }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: "default" | "phone-pad"; optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[si.wrap, focused && si.focused]}>
      <Text style={si.label}>{label}{optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : ""}</Text>
      <TextInput value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={keyboardType} style={si.input} returnKeyType="next" />
    </View>
  );
}
const si = StyleSheet.create({
  wrap:   { backgroundColor: colors.surface, borderRadius: radius.lg, padding: layout.cardPadding, borderWidth: 2, borderColor: "transparent" },
  focused:{ borderColor: colors.primary },
  label:  { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", color: colors.textMuted, marginBottom: 4 },
  input:  { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", color: colors.textPrimary, padding: 0 },
});

export default function AddCustomerSheet() {
  const insets      = useSafeAreaInsets();
  const sheetRef    = useRef<BottomSheet>(null);
  const addCustomer = useDataStore((s) => s.addCustomer);
  const showToast   = useToastStore((s) => s.show);

  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity]       = useState("");
  const [errors, setErrors]   = useState({ name: false, phone: false, address: false });

  const handleClose = useCallback(() => router.back(), []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ), []
  );

  const handleSave = () => {
    const errs = { name: !name.trim(), phone: phone.trim().length < 10, address: !address.trim() };
    setErrors(errs);
    if (errs.name || errs.phone || errs.address) return;
    addCustomer({ name: name.trim(), phone: phone.trim(), address: address.trim(), city: city.trim() || undefined });
    showToast("Customer saved ✓", "success");
    router.back();
  };

  return (
    <View style={styles.root}>
      <BottomSheet ref={sheetRef} index={0} snapPoints={[500 + insets.bottom]} enablePanDownToClose onClose={handleClose}
        backdropComponent={renderBackdrop} backgroundStyle={styles.sheetBg} handleIndicatorStyle={styles.handle}>
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>Add New Customer</Text>
          <View style={styles.fields}>
            <View>
              <SheetInput label="Full name" value={name} onChange={(v) => { setName(v); setErrors((e) => ({ ...e, name: false })); }} placeholder="e.g. Amara Obi" />
              {errors.name && <Text style={styles.errMsg}>Name is required</Text>}
            </View>
            <View>
              <SheetInput label="Phone number" value={phone} onChange={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: false })); }} placeholder="0800 000 0000" keyboardType="phone-pad" />
              {errors.phone && <Text style={styles.errMsg}>Enter a valid phone number</Text>}
            </View>
            <View>
              <SheetInput label="Delivery address" value={address} onChange={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: false })); }} placeholder="Street address" />
              {errors.address && <Text style={styles.errMsg}>Address is required</Text>}
            </View>
            <SheetInput label="City" value={city} onChange={setCity} placeholder="e.g. Lagos" optional />
          </View>
          <View style={styles.saveShadow}>
            <Pressable onPress={handleSave} android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }} style={styles.savePressable}>
              <View style={styles.saveBtn}><Text style={styles.saveBtnText}>Save Customer</Text></View>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  sheetBg: { backgroundColor: colors.surfaceCard },
  handle: { backgroundColor: colors.surfaceContainer },
  content: { paddingHorizontal: layout.screenPaddingH },
  sheetTitle: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34, color: colors.textPrimary, marginBottom: 16 },
  fields: { gap: 10, marginBottom: 16 },
  errMsg: { fontSize: 11, fontFamily: font.sans.semiBold, color: colors.error, marginTop: 4, marginLeft: 4 },
  saveShadow: { borderRadius: radius.full, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  savePressable: { borderRadius: radius.full, overflow: "hidden" },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: colors.white },
});
