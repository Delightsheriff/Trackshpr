/**
 * Add Rider bottom sheet — react-hook-form + zod, real Supabase insert.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useAddRider, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { zodResolver } from "@hookform/resolvers/zod";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

// ── Schema ────────────────────────────────────────────────────────────────────
const riderSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  notes: z.string().trim().optional(),
});
type RiderFormData = z.infer<typeof riderSchema>;

// ── Input component ───────────────────────────────────────────────────────────
function SheetInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  keyboardType,
  optional,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  optional?: boolean;
  hasError?: boolean;
  errorMsg?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View
        style={[
          si.wrap,
          {
            backgroundColor: colors.surface,
            borderColor: hasError
              ? colors.error
              : focused
                ? colors.primary
                : "transparent",
          },
        ]}
      >
        <Text style={[si.label, { color: hasError ? colors.error : colors.textMuted }]}>
          {label}
          {optional && <Text style={{ color: colors.textMuted }}> · Optional</Text>}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          style={[si.input, { color: colors.textPrimary }]}
          returnKeyType="next"
        />
      </View>
      {hasError && errorMsg && (
        <Text style={[si.errMsg, { color: colors.error }]}>{errorMsg}</Text>
      )}
    </View>
  );
}

const si = StyleSheet.create({
  wrap: { borderRadius: radius.lg, padding: layout.cardPadding, borderWidth: 2 },
  label: { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", padding: 0 },
  errMsg: { fontSize: 11, fontFamily: font.sans.semiBold, marginTop: 4, marginLeft: 4 },
});

// ── Sheet ─────────────────────────────────────────────────────────────────────
export default function AddRiderSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const showToast = useToastStore((s) => s.show);
  const { userId } = useSession();
  const addRider = useAddRider(userId);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RiderFormData>({
    resolver: zodResolver(riderSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

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

  const onSubmit = (data: RiderFormData) => {
    if (!userId) {
      showToast("Session error. Please sign in again.", "error");
      return;
    }
    addRider.mutate(
      { name: data.name, phone: data.phone, notes: data.notes || undefined },
      {
        onSuccess: () => {
          showToast(`${data.name} added`, "success");
          router.back();
        },
        onError: () => {
          showToast("Could not save rider. Please try again.", "error");
        },
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
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            Add New Rider
          </Text>

          <View style={styles.fields}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <SheetInput
                  label="Full name"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Emeka Okafor"
                  hasError={!!errors.name}
                  errorMsg={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <SheetInput
                  label="WhatsApp number"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="0800 000 0000"
                  keyboardType="phone-pad"
                  hasError={!!errors.phone}
                  errorMsg={errors.phone?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <SheetInput
                  label="Notes"
                  value={value ?? ""}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Covers Mainland only"
                  optional
                />
              )}
            />
          </View>

          <View style={[styles.saveShadow, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={addRider.isPending}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
              style={styles.savePressable}
            >
              <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                {addRider.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Rider</Text>
                )}
              </View>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  sheetBg: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  content: { paddingHorizontal: layout.screenPaddingH },
  sheetTitle: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34, marginBottom: 16 },
  fields: { gap: 10, marginBottom: 16 },
  saveShadow: { borderRadius: radius.full, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  savePressable: { borderRadius: radius.full, overflow: "hidden" },
  saveBtn: { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  saveBtnText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
});
