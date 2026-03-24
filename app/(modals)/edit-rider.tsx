/**
 * Edit Rider bottom sheet — pre-filled with current rider data.
 * Receives riderId as a search param; fetches the rider then renders a form.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useRider, useSession, useUpdateRider } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { zodResolver } from "@hookform/resolvers/zod";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
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
        <BottomSheetTextInput
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

const si = StyleSheet.create({
  wrap: { borderRadius: radius.lg, padding: layout.cardPadding, borderWidth: 2 },
  label: { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", padding: 0 },
  errMsg: { fontSize: 11, fontFamily: font.sans.semiBold, marginTop: 4, marginLeft: 4 },
});

// ── Sheet ─────────────────────────────────────────────────────────────────────
export default function EditRiderSheet() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const showToast = useToastStore((s) => s.show);
  const { id: riderId } = useLocalSearchParams<{ id: string }>();
  const { userId } = useSession();

  const { data: rider, isLoading } = useRider(riderId);
  const updateRider = useUpdateRider(userId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RiderFormData>({
    resolver: zodResolver(riderSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  // Pre-fill form once rider data arrives
  useEffect(() => {
    if (rider) {
      reset({
        name: rider.name,
        phone: rider.phone,
        notes: rider.notes ?? "",
      });
    }
  }, [rider, reset]);

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
    updateRider.mutate(
      {
        riderId,
        data: {
          name: data.name,
          phone: data.phone,
          notes: data.notes || null,
        },
      },
      {
        onSuccess: () => {
          showToast("Rider updated", "success");
          router.back();
        },
        onError: () => {
          showToast("Could not update rider. Please try again.", "error");
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
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.surfaceElevated }, sheetShadow]}
        handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            Edit Rider
          </Text>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <>
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
                  disabled={updateRider.isPending}
                  android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
                  style={styles.savePressable}
                >
                  <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                    {updateRider.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </View>
                </Pressable>
              </View>
            </>
          )}
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
  loadingWrap: { paddingVertical: 32, alignItems: "center" },
  fields: { gap: 10, marginBottom: 16 },
  saveShadow: { borderRadius: radius.full, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  savePressable: { borderRadius: radius.full, overflow: "hidden" },
  saveBtn: { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  saveBtnText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
});
