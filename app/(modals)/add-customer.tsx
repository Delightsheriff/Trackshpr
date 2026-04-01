/**
 * Add Customer bottom sheet.
 * TODO: replace addCustomer with Supabase insert.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { font, layout, radius } from "@/src/constants/tokens";
import { supabase } from "@/src/lib/supabase";
import { queryKeys } from "@/src/lib/queryKeys";
import { useSession } from "@/src/hooks/useSession";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
});
type CustomerValues = z.infer<typeof customerSchema>;

export default function AddCustomerSheet() {
  const { colors, isDark } = useTheme();
  const insets      = useSafeAreaInsets();
  const sheetRef    = useRef<BottomSheet>(null);
  const { userId }  = useSession();
  const queryClient = useQueryClient();
  const showToast   = useToastStore((s) => s.show);

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; address: string; city?: string }) => {
      const { error } = await supabase
        .from('address_book')
        .insert({
          seller_id: userId!,
          customer_name: data.name,
          customer_phone: data.phone,
          address: data.address,
          city: data.city ?? null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(userId ?? '') });
      showToast('Customer saved', 'success');
      router.back();
    },
    onError: () => showToast('Could not save customer. Try again.', 'error'),
  });

  const { control, handleSubmit, formState: { errors } } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", address: "", city: "" },
  });

  const handleClose = useCallback(() => router.back(), []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ), []
  );

  const handleSave = handleSubmit((values) => {
    addMutation.mutate({ name: values.name, phone: values.phone, address: values.address, city: values.city || undefined });
  });

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
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <SheetInput label="Full name" value={value} onChange={onChange} placeholder="e.g. Amara Obi" />
                )}
              />
              {errors.name && <Text style={[styles.errMsg, { color: colors.error }]}>{errors.name.message}</Text>}
            </View>
            <View>
              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange } }) => (
                  <SheetInput label="Phone number" value={value} onChange={onChange} placeholder="0800 000 0000" keyboardType="phone-pad" />
                )}
              />
              {errors.phone && <Text style={[styles.errMsg, { color: colors.error }]}>{errors.phone.message}</Text>}
            </View>
            <View>
              <Controller
                control={control}
                name="address"
                render={({ field: { value, onChange } }) => (
                  <SheetInput label="Delivery address" value={value} onChange={onChange} placeholder="Street address" />
                )}
              />
              {errors.address && <Text style={[styles.errMsg, { color: colors.error }]}>{errors.address.message}</Text>}
            </View>
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <SheetInput label="City" value={value ?? ""} onChange={onChange} placeholder="e.g. Lagos" optional />
              )}
            />
          </View>
          <View style={[styles.saveShadow, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Pressable
              onPress={handleSave}
              disabled={addMutation.isPending}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={styles.savePressable}
            >
              <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                {addMutation.isPending
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.saveBtnText}>Save Customer</Text>}
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
