/**
 * New Delivery — 3-step order creation modal.
 * Step 1: Item details + customer selection
 * Step 2: Rider assignment
 * Step 3: Confirm & send
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useCreateOrder } from "@/src/hooks/useOrders";
import { useRiders } from "@/src/hooks/useRiders";
import { useSession } from "@/src/hooks/useSession";
import { useOrderStore } from "@/src/stores/orderStore";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 | 3 }) {
  const { colors } = useTheme();
  const dots = [1, 2, 3] as const;
  return (
    <View style={sd.row}>
      {dots.map((n) => {
        const isDone = n < step;
        const isActive = n === step;
        return (
          <View
            key={n}
            style={[
              sd.dot,
              isActive && { width: 24, backgroundColor: colors.primary },
              isDone && { width: 8, backgroundColor: colors.success },
              !isActive &&
                !isDone && {
                  width: 8,
                  backgroundColor: colors.surfaceContainer,
                },
            ]}
          />
        );
      })}
    </View>
  );
}
const sd = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 10,
  },
  dot: { height: 4, borderRadius: 2 },
});

// ── Form header ───────────────────────────────────────────────────────────────
function FormHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={fh.row}>
      <Pressable
        onPress={onBack}
        style={[fh.backBtn, { backgroundColor: colors.surfaceCard }]}
        android_ripple={{ color: colors.surfaceContainer, borderless: false }}
      >
        <Feather name="arrow-left" size={18} color={colors.textPrimary} />
      </Pressable>
      <Text style={[fh.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}
const fh = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
});

// ── Shared input ──────────────────────────────────────────────────────────────
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  prefix,
  multiline,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  prefix?: string;
  multiline?: boolean;
  optional?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        fi.wrap,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: focused ? colors.primary : "transparent",
        },
      ]}
    >
      <Text style={[fi.label, { color: colors.textMuted }]}>
        {label}
        {optional ? (
          <Text style={{ color: colors.textMuted }}> · Optional</Text>
        ) : (
          ""
        )}
      </Text>
      <View style={fi.inputRow}>
        {prefix && (
          <Text style={[fi.prefix, { color: colors.textSecondary }]}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[fi.input, { color: colors.textPrimary }]}
          returnKeyType="next"
        />
      </View>
    </View>
  );
}
const fi = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    borderWidth: 2,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  label: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  prefix: { fontSize: 14, fontFamily: font.sans.semiBold, marginRight: 4 },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    padding: 0,
  },
});

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({
  label,
  onPress,
  disabled,
  loading,
  success,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        sb.shadow,
        {
          backgroundColor: disabled
            ? colors.surfaceContainer
            : success
              ? colors.success
              : colors.primary,
          shadowColor: disabled
            ? "transparent"
            : success
              ? colors.success
              : colors.primary,
          shadowOpacity: disabled ? 0 : success ? 0.3 : 0.35,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        style={sb.pressable}
      >
        <LinearGradient
          colors={
            success
              ? gradients.success
              : disabled
                ? [colors.surfaceContainer, colors.surfaceContainer]
                : gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={sb.btn}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[sb.text, disabled && { color: colors.textMuted }]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}
const sb = StyleSheet.create({
  shadow: {
    borderRadius: radius.full,
    marginHorizontal: layout.screenPaddingH,
    marginTop: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  pressable: { borderRadius: radius.full, overflow: "hidden" },
  btn: {
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  text: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "white",
  },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label}
    </Text>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  item: z.string().min(1, "Item description is required"),
  deliveryFee: z.string().optional(),
  notes: z.string().optional(),
});
type Step1Values = z.infer<typeof step1Schema>;

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NewDeliveryScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sending, setSending] = useState(false);

  const { userId } = useSession();
  const { data: riders = [] } = useRiders(userId);
  const createOrder = useCreateOrder(userId);

  const draft = useOrderStore((s) => s.draft);
  const addPhotoUri = useOrderStore((s) => s.addPhotoUri);
  const removePhotoUri = useOrderStore((s) => s.removePhotoUri);
  const setDirectPhone = useOrderStore((s) => s.setDirectPhone);
  const resetDraft = useOrderStore((s) => s.reset);

  const { control, handleSubmit, formState: { errors } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { item: draft.item, deliveryFee: draft.deliveryFee, notes: draft.notes },
  });

  const showToast = useToastStore((s) => s.show);

  // Captured step-1 values after validation
  const [step1Values, setStep1Values] = useState<Step1Values>({ item: "", deliveryFee: "", notes: "" });

  const handleBack = () => {
    if (step === 1) {
      resetDraft();
      router.back();
    } else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: false,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      result.assets.forEach((asset) => addPhotoUri(asset.uri));
    }
  }, [addPhotoUri]);

  const handleStep1Next = handleSubmit((values) => {
    setStep1Values(values);
    setStep(2);
  });

  const handleStep2Next = () => {
    if (!draft.rider && !draft.directPhone.trim()) return;
    setStep(3);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const order = await createOrder.mutateAsync({
        item: step1Values.item,
        delivery_fee: step1Values.deliveryFee ? parseFloat(step1Values.deliveryFee) : null,
        notes: step1Values.notes || null,
        // customer_id references customers.id (customers table, post-migration from address_book)
        customer_id: draft.customer?.id ?? null,
        customer_name: draft.customer?.name ?? null,
        customer_phone: draft.customer?.phone ?? null,
        delivery_address: draft.customer?.address ?? null, // denormalized default address
        city: draft.customer?.city ?? null,
        rider_id: draft.rider?.id ?? null,
        rider_name: draft.rider?.name ?? null,
        rider_phone: draft.rider?.phone ?? null,
        direct_phone: draft.directPhone || null,
      });
      showToast("Order created!", "success");
      resetDraft();
      router.dismissAll();
      router.push({ pathname: "/(screens)/order-detail", params: { id: order.id } });
    } catch {
      showToast("Failed to create order", "error");
      setSending(false);
    }
  };

  const riderCanProceed =
    !!draft.rider || draft.directPhone.trim().length >= 10;

  // Avatar colors are theme-aware via color tokens
  const AVATAR_COLORS = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg, fg: colors.success },
    { bg: colors.warningBg, fg: colors.warning },
  ];

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Step 1: Item Details ──────────────────────────────────── */}
      {step === 1 && (
        <>
          <FormHeader title="New Delivery" onBack={handleBack} />
          <StepDots step={1} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.formBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SectionLabel label="Item details" />
              <Controller
                control={control}
                name="item"
                render={({ field: { value, onChange } }) => (
                  <FieldInput
                    label="Item description"
                    value={value}
                    onChange={onChange}
                    placeholder="e.g. Adire Maxi Dress × 2"
                  />
                )}
              />
              {errors.item && (
                <Text style={[styles.fieldError, { color: colors.error }]}>{errors.item.message}</Text>
              )}
              <Controller
                control={control}
                name="deliveryFee"
                render={({ field: { value, onChange } }) => (
                  <FieldInput
                    label="Delivery fee"
                    value={value ? Number(value).toLocaleString("en-NG") : ""}
                    onChange={(text) => onChange(text.replace(/,/g, "").replace(/[^0-9]/g, ""))}
                    placeholder="0"
                    keyboardType="numeric"
                    prefix="₦"
                    optional
                  />
                )}
              />
              <Controller
                control={control}
                name="notes"
                render={({ field: { value, onChange } }) => (
                  <FieldInput
                    label="Notes for rider"
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder="e.g. Call customer on arrival"
                    optional
                    multiline
                  />
                )}
              />

              {/* Photo strip */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoStrip}
                keyboardShouldPersistTaps="handled"
              >
                {draft.photoUris.map((uri) => (
                  <Pressable
                    key={uri}
                    onPress={() => removePhotoUri(uri)}
                    style={styles.photoThumbWrap}
                  >
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <View style={styles.photoRemove}>
                      <Feather name="x" size={10} color="#fff" />
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  onPress={pickPhoto}
                  style={[styles.photoAddBtn, { backgroundColor: colors.surfaceCard }]}
                >
                  <View style={[styles.photoAddIcon, { backgroundColor: colors.primarySoft }]}>
                    <Feather name="camera" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.photoAddLabel, { color: colors.primary }]}>
                    {draft.photoUris.length === 0 ? "Add photos" : "Add more"}
                  </Text>
                  <Text style={[styles.photoAddSub, { color: colors.textMuted }]}>
                    Tap to select
                  </Text>
                </Pressable>
              </ScrollView>

              <SectionLabel label="Customer" />

              {/* Customer selector */}
              <Pressable
                onPress={() => router.push("/(modals)/select-customer")}
                style={[
                  styles.selectorField,
                  { backgroundColor: colors.surfaceCard },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[fi.label, { color: colors.textMuted }]}>
                    Customer name & address
                  </Text>
                  {draft.customer ? (
                    <>
                      <Text
                        style={[
                          styles.selectorValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {draft.customer.name}
                      </Text>
                      <Text
                        style={[
                          styles.selectorSub,
                          { color: colors.textMuted },
                        ]}
                      >
                        {draft.customer.address}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.selectorPlaceholder,
                        { color: colors.textMuted },
                      ]}
                    >
                      Search address book or type new
                    </Text>
                  )}
                </View>
                <Feather name="user" size={18} color={colors.textMuted} />
              </Pressable>

              <View style={{ height: 8 }} />
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
            <SubmitBtn
              label="Assign Rider"
              onPress={handleStep1Next}
            />
          </View>
        </>
      )}

      {/* ── Step 2: Assign Rider ──────────────────────────────────── */}
      {step === 2 && (
        <>
          <FormHeader title="Assign Rider" onBack={handleBack} />
          <StepDots step={2} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.formBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SectionLabel label="Saved riders" />
              <View
                style={[
                  styles.riderSelectCard,
                  { backgroundColor: colors.surfaceCard },
                ]}
              >
                {riders.map((r, i) => {
                  const selected = draft.rider?.id === r.id;
                  const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => useOrderStore.getState().setRider(r)}
                      style={[
                        styles.riderSelItem,
                        selected && { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <View
                        style={[
                          styles.riderSelAvatar,
                          { backgroundColor: ac.bg },
                        ]}
                      >
                        <Text
                          style={[styles.riderSelAvatarText, { color: ac.fg }]}
                        >
                          {initials(r.name)}
                        </Text>
                      </View>
                      <View style={styles.riderSelInfo}>
                        <Text
                          style={[
                            styles.riderSelName,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {r.name}
                        </Text>
                        <Text
                          style={[
                            styles.riderSelMeta,
                            { color: colors.textMuted },
                          ]}
                        >
                          {r.delivered} deliveries · {r.phone}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioDot,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.surfaceContainer,
                            backgroundColor: selected
                              ? colors.primary
                              : "transparent",
                          },
                        ]}
                      >
                        {selected && <View style={styles.radioDotInner} />}
                      </View>
                    </Pressable>
                  );
                })}
                {/* Add new rider row */}
                <Pressable
                  onPress={() => router.push("/(modals)/add-rider")}
                  style={[
                    styles.addRiderRow,
                    { borderTopColor: colors.surfaceContainer },
                  ]}
                >
                  <View
                    style={[
                      styles.addRiderPlus,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Feather name="plus" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.addRiderTxt, { color: colors.primary }]}>
                    Add a new rider
                  </Text>
                </Pressable>
              </View>

              {/* OR divider */}
              <View style={styles.orRow}>
                <View
                  style={[
                    styles.orLine,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                />
                <Text style={[styles.orText, { color: colors.textMuted }]}>
                  or
                </Text>
                <View
                  style={[
                    styles.orLine,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                />
              </View>

              {/* Direct phone input */}
              <FieldInput
                label="Enter phone number directly"
                value={draft.directPhone}
                onChange={(v) => useOrderStore.getState().setDirectPhone(v)}
                placeholder="0800 000 0000"
                keyboardType="phone-pad"
              />
              <View style={{ height: 8 }} />
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
            <SubmitBtn
              label="Review & Send →"
              onPress={handleStep2Next}
              disabled={!riderCanProceed}
            />
          </View>
        </>
      )}

      {/* ── Step 3: Confirm & Send ────────────────────────────────── */}
      {step === 3 && (
        <>
          <FormHeader title="Confirm Order" onBack={handleBack} />
          <StepDots step={3} />
          <ScrollView
            contentContainerStyle={styles.formBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Summary card */}
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.surfaceCard },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>
                Order Summary
              </Text>
              {[
                { label: "Item", value: step1Values.item || "—" },
                { label: "Customer", value: draft.customer?.name ?? "—" },
                { label: "Address", value: draft.customer?.address ?? "—" },
                {
                  label: "Rider",
                  value: (draft.rider?.name ?? draft.directPhone) || "—",
                },
                {
                  label: "Amount",
                  value: step1Values.deliveryFee
                    ? `₦${Number(step1Values.deliveryFee).toLocaleString("en-NG")}`
                    : "—",
                  isAmount: true,
                },
              ].map(({ label, value, isAmount }, idx, arr) => (
                <View
                  key={label}
                  style={[
                    styles.summaryRow,
                    idx < arr.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.surfaceContainer,
                    },
                  ]}
                >
                  <Text
                    style={[styles.summaryLabel, { color: colors.textMuted }]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.textPrimary },
                      isAmount && {
                        fontSize: 15,
                        fontFamily: font.mono.medium,
                        color: colors.success,
                      },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            {/* WhatsApp notice */}
            <View
              style={[styles.waCard, { backgroundColor: colors.successBg }]}
            >
              <Feather
                name="message-circle"
                size={18}
                color={colors.success}
                style={styles.waIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.waTitle, { color: colors.success }]}>
                  WhatsApp links sent automatically
                </Text>
                <Text
                  style={[
                    styles.waSub,
                    { color: isDark ? colors.textSecondary : colors.success },
                  ]}
                >
                  {draft.rider?.name ?? "Rider"} gets a rider link.{" "}
                  {draft.customer?.name ?? "Customer"} gets a tracking link.
                  Both via WhatsApp.
                </Text>
              </View>
            </View>
            <View style={{ height: 8 }} />
          </ScrollView>
          <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
            <SubmitBtn
              label="Send Delivery"
              onPress={handleSend}
              loading={sending}
              success
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  formBody: {
    paddingHorizontal: layout.screenPaddingH,
    gap: 12,
    paddingBottom: 16,
  },
  ctaRow: { paddingTop: 4 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: -4,
    marginTop: 4,
  },
  fieldError: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    marginTop: -6,
    marginLeft: 4,
  },
  // Photo strip
  photoStrip: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 4,
  },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 72, height: 72, borderRadius: 14 },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  photoAddIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  photoAddLabel: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700" },
  photoAddSub: { fontSize: 9, fontFamily: font.sans.regular },
  // Customer selector
  selectorField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  selectorValue: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
  },
  selectorSub: { fontSize: 11, fontFamily: font.sans.regular, marginTop: 1 },
  selectorPlaceholder: { fontSize: 14, fontFamily: font.sans.regular },
  // Rider select
  riderSelectCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  riderSelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  riderSelAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  riderSelAvatarText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  riderSelInfo: { flex: 1 },
  riderSelName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  riderSelMeta: { fontSize: 11, fontFamily: font.sans.regular, marginTop: 1 },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDotInner: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: "white",
  },
  addRiderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  addRiderPlus: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addRiderTxt: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  orRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 11, fontFamily: font.sans.semiBold },
  // Summary
  summaryCard: {
    borderRadius: radius.xl,
    padding: 16,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 9,
  },
  summaryLabel: { fontSize: 12, fontFamily: font.sans.regular },
  summaryValue: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "55%",
  },
  // WhatsApp card
  waCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
  },
  waIcon: { flexShrink: 0 },
  waTitle: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    marginBottom: 2,
  },
  waSub: { fontSize: 11, fontFamily: font.sans.regular, lineHeight: 15.4 },
});
