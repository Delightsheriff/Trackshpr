/**
 * Add Customer bottom sheet.
 * TODO: replace addCustomer with Supabase insert.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useTheme } from "@/src/stores/themeStore";
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
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[
      si.wrap,
      { backgroundColor: colors.surface, borderColor: focused ? colors.primary : "transparent" },
    ]}>
      <Text style={[si.label, { color: colors.textMuted }]}>
        {label}{optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : ""}
      </Text>
      <TextInput
        value={value} onChangeText={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        style={[si.input, { color: colors.textPrimary }]}
        returnKeyType="next"
      />
    </View>
  );
}
const si = StyleSheet.create({
  wrap:   { borderRadius: radius.lg, padding: layout.cardPadding, borderWidth: 2 },
  label:  { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input:  { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", padding: 0 },
});

export default function AddCustomerSheet() {
  const { colors, isDark } = useTheme();
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

  const sheetShadow = isDark
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }
    : { shadowColor: 'rgba(48,41,80,1)', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 };

  return (
    <View style={styles.root}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={[500 + insets.bottom]}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add New Customer</Text>
          <View style={styles.fields}>
            <View>
              <SheetInput
                label="Full name"
                value={name}
                onChange={(v) => { setName(v); setErrors((e) => ({ ...e, name: false })); }}
                placeholder="e.g. Amara Obi"
              />
              {errors.name && <Text style={[styles.errMsg, { color: colors.error }]}>Name is required</Text>}
            </View>
            <View>
              <SheetInput
                label="Phone number"
                value={phone}
                onChange={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: false })); }}
                placeholder="0800 000 0000"
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={[styles.errMsg, { color: colors.error }]}>Enter a valid phone number</Text>}
            </View>
            <View>
              <SheetInput
                label="Delivery address"
                value={address}
                onChange={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: false })); }}
                placeholder="Street address"
              />
              {errors.address && <Text style={[styles.errMsg, { color: colors.error }]}>Address is required</Text>}
            </View>
            <SheetInput label="City" value={city} onChange={setCity} placeholder="e.g. Lagos" optional />
          </View>
          <View style={[styles.saveShadow, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Pressable
              onPress={handleSave}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={styles.savePressable}
            >
              <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.saveBtnText}>Save Customer</Text>
              </View>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "transparent" },
  sheetBg:      { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  content:      { paddingHorizontal: layout.screenPaddingH },
  sheetTitle:   { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34, marginBottom: 16 },
  fields:       { gap: 10, marginBottom: 16 },
  errMsg:       { fontSize: 11, fontFamily: font.sans.semiBold, marginTop: 4, marginLeft: 4 },
  saveShadow:   { borderRadius: radius.full, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  savePressable:{ borderRadius: radius.full, overflow: "hidden" },
  saveBtn:      { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  saveBtnText:  { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
});
