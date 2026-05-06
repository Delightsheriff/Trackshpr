/**
 * Edit Customer bottom sheet.
 * Pre-populates from useCustomer(id) and submits via useUpdateCustomer.
 * Phone validated to E.164 via libphonenumber-js + PhoneNumberInput.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { font, layout, radius } from "@/src/constants/tokens";
import { useCustomer, useUpdateCustomer, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import PhoneNumberInput from "@/src/components/profile-setup/phone-number-input";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Schema ────────────────────────────────────────────────────────────────────
const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => { try { return isValidPhoneNumber(val); } catch { return false; } },
      "Enter a valid phone number",
    ),
  notes: z.string().trim().optional(),
});
type EditValues = z.infer<typeof editSchema>;

// ── Text field ────────────────────────────────────────────────────────────────
function SheetInput({
  label, value, onChange, onBlur, placeholder, optional, hasError, errorMsg,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  placeholder?: string; optional?: boolean; hasError?: boolean; errorMsg?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View style={[si.wrap, {
        backgroundColor: colors.surface,
        borderColor: hasError ? colors.error : focused ? colors.primary : "transparent",
      }]}>
        <Text style={[si.label, { color: hasError ? colors.error : colors.textMuted }]}>
          {label}{optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : ""}
        </Text>
        <BottomSheetTextInput
          value={value} onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur(); }}
          placeholder={placeholder} placeholderTextColor={colors.textMuted}
          style={[si.input, { color: colors.textPrimary } as any]}
          returnKeyType="next"
        />
      </View>
      {hasError && errorMsg && (
        <Text style={[si.errMsg, { color: colors.error }]}>{errorMsg}</Text>
      )}
    </View>
  );
}

// ── Phone field ───────────────────────────────────────────────────────────────
function SheetPhoneField({
  value, onChange, onBlur, hasError, errorMsg,
}: {
  value: string; onChange: (e164: string) => void; onBlur: () => void;
  hasError?: boolean; errorMsg?: string;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={[si.wrap, {
        backgroundColor: colors.surface,
        borderColor: hasError ? colors.error : "transparent",
      }]}>
        <Text style={[si.label, { color: hasError ? colors.error : colors.textMuted }]}>
          Phone number
        </Text>
        <PhoneNumberInput value={value} onChange={onChange} onBlur={onBlur} hasError={hasError} />
      </View>
      {hasError && errorMsg && (
        <Text style={[si.errMsg, { color: colors.error }]}>{errorMsg}</Text>
      )}
    </View>
  );
}

const si = StyleSheet.create({
  wrap:   { borderRadius: radius.lg, padding: layout.cardPadding, borderWidth: 2 },
  label:  { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input:  { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", padding: 0 },
  errMsg: { fontSize: 11, fontFamily: font.sans.semiBold, marginTop: 4, marginLeft: 4 },
});

// ── Sheet ─────────────────────────────────────────────────────────────────────
export default function EditCustomerSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useSession();
  const showToast = useToastStore((s) => s.show);

  const { data: customer } = useCustomer(id ?? null);
  const updateCustomer = useUpdateCustomer(userId);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  // Pre-populate when customer data loads
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone ?? "",
        notes: customer.notes ?? "",
      });
    }
  }, [customer, reset]);

  const handleClose = useCallback(() => router.back(), []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ), [],
  );

  const onSubmit = (values: EditValues) => {
    if (!id) return;
    updateCustomer.mutate(
      {
        customerId: id,
        data: {
          name: values.name,
          phone: values.phone,
          notes: values.notes || null,
        },
      },
      {
        onSuccess: () => {
          showToast("Customer updated", "success");
          router.back();
        },
        onError: () => showToast("Could not update customer. Try again.", "error"),
      },
    );
  };

  const sheetShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 };

  return (
    <View style={styles.root}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={[460 + insets.bottom]}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Edit Customer</Text>

          <View style={styles.fields}>
            <Controller control={control} name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <SheetInput
                  label="Full name" value={value} onChange={onChange} onBlur={onBlur}
                  placeholder="e.g. Amara Obi"
                  hasError={!!errors.name} errorMsg={errors.name?.message}
                />
              )} />

            <Controller control={control} name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <SheetPhoneField
                  value={value} onChange={onChange} onBlur={onBlur}
                  hasError={!!errors.phone} errorMsg={errors.phone?.message}
                />
              )} />

            <Controller control={control} name="notes"
              render={({ field: { value, onChange, onBlur } }) => (
                <SheetInput
                  label="Notes" value={value ?? ""} onChange={onChange} onBlur={onBlur}
                  placeholder="e.g. Business customer" optional
                />
              )} />
          </View>

          <View style={[styles.saveShadow, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={updateCustomer.isPending}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={styles.savePressable}
            >
              <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                {updateCustomer.isPending
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
  saveShadow:   { borderRadius: radius.full, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  savePressable:{ borderRadius: radius.full, overflow: "hidden" },
  saveBtn:      { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  saveBtnText:  { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
});
