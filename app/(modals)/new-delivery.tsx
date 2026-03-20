/**
 * New Delivery — 3-step order creation modal.
 * Step 1: Item details + customer selection
 * Step 2: Rider assignment
 * Step 3: Confirm & send
 * TODO: replace dummy data and addOrder with real Supabase insert.
 */
import { colors, font, gradients, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useOrderStore } from "@/src/stores/orderStore";
import { useToastStore } from "@/src/stores/toastStore";
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
const AVATAR_COLORS = [
  { bg: colors.primarySoft, fg: colors.primary },
  { bg: colors.successBg,   fg: colors.success },
  { bg: colors.warningBg,   fg: colors.warning },
];
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 | 3 }) {
  const dots = [1, 2, 3] as const;
  return (
    <View style={sd.row}>
      {dots.map((n) => {
        const isDone    = n < step;
        const isActive  = n === step;
        return (
          <View
            key={n}
            style={[
              sd.dot,
              isActive  && sd.dotActive,
              isDone    && sd.dotDone,
              !isActive && !isDone && sd.dotPending,
            ]}
          />
        );
      })}
    </View>
  );
}
const sd = StyleSheet.create({
  row:        { flexDirection: "row", gap: 6, justifyContent: "center", paddingVertical: 10 },
  dot:        { height: 4, borderRadius: 2 },
  dotActive:  { width: 24, backgroundColor: colors.primary },
  dotDone:    { width: 8,  backgroundColor: colors.success },
  dotPending: { width: 8,  backgroundColor: colors.surfaceContainer },
});

// ── Form header ───────────────────────────────────────────────────────────────
function FormHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={fh.row}>
      <Pressable onPress={onBack} style={fh.backBtn} android_ripple={{ color: colors.surfaceContainer, borderless: false }}>
        <Feather name="arrow-left" size={18} color={colors.textPrimary} />
      </Pressable>
      <Text style={fh.title}>{title}</Text>
    </View>
  );
}
const fh = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: layout.screenPaddingH, paddingBottom: 14 },
  backBtn:{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surfaceCard, alignItems: "center", justifyContent: "center",
            shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  title:  { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34, color: colors.textPrimary },
});

// ── Shared input ──────────────────────────────────────────────────────────────
function FieldInput({
  label, value, onChange, placeholder, keyboardType, prefix, multiline, optional,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad"; prefix?: string; multiline?: boolean; optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fi.wrap, focused && fi.focused]}>
      <Text style={fi.label}>
        {label}{optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : ""}
      </Text>
      <View style={fi.inputRow}>
        {prefix && <Text style={fi.prefix}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={fi.input}
          returnKeyType="next"
        />
      </View>
    </View>
  );
}
const fi = StyleSheet.create({
  wrap:     { backgroundColor: colors.surfaceCard, borderRadius: radius.lg, padding: layout.cardPadding,
              borderWidth: 2, borderColor: "transparent",
              shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  focused:  { borderColor: colors.primary },
  label:    { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", color: colors.textMuted, marginBottom: 4 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  prefix:   { fontSize: 14, fontFamily: font.sans.semiBold, color: colors.textSecondary, marginRight: 4 },
  input:    { flex: 1, fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", color: colors.textPrimary, padding: 0 },
});

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({ label, onPress, disabled, loading, success }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; success?: boolean;
}) {
  return (
    <View style={[sb.shadow, disabled && sb.shadowDisabled, success && sb.shadowSuccess]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        style={sb.pressable}
      >
        <LinearGradient
          colors={success ? gradients.success : (disabled ? [colors.surfaceContainer, colors.surfaceContainer] : gradients.primary)}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={sb.btn}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[sb.text, disabled && sb.textDisabled]}>{label}</Text>
          }
        </LinearGradient>
      </Pressable>
    </View>
  );
}
const sb = StyleSheet.create({
  shadow:        { borderRadius: radius.full, marginHorizontal: layout.screenPaddingH, marginTop: 8, backgroundColor: colors.primary,
                   shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  shadowDisabled:{ backgroundColor: colors.surfaceContainer, shadowOpacity: 0 },
  shadowSuccess: { backgroundColor: colors.success, shadowColor: colors.success, shadowOpacity: 0.30 },
  pressable:     { borderRadius: radius.full, overflow: "hidden" },
  btn:           { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  text:          { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: colors.white },
  textDisabled:  { color: colors.textMuted },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NewDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sending, setSending] = useState(false);

  const draft         = useOrderStore((s) => s.draft);
  const setItem       = useOrderStore((s) => s.setItem);
  const setDeliveryFee= useOrderStore((s) => s.setDeliveryFee);
  const setNotes      = useOrderStore((s) => s.setNotes);
  const setPhotoUri   = useOrderStore((s) => s.setPhotoUri);
  const setDirectPhone= useOrderStore((s) => s.setDirectPhone);
  const resetDraft    = useOrderStore((s) => s.reset);

  const addOrder      = useDataStore((s) => s.addOrder);
  const showToast     = useToastStore((s) => s.show);

  const handleBack = () => {
    if (step === 1) { resetDraft(); router.back(); }
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleStep1Next = () => {
    if (!draft.item.trim()) return;
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!draft.rider && !draft.directPhone.trim()) return;
    setStep(3);
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API
    addOrder({
      item: draft.item,
      customer: draft.customer?.name ?? "Unknown",
      area: draft.customer?.city ?? draft.customer?.address.split(",").pop()?.trim() ?? "—",
      status: "pending",
      riderId: draft.rider?.id,
      riderName: draft.rider?.name,
      deliveryFee: draft.deliveryFee,
    });
    showToast("Delivery created! Links sent via WhatsApp 📲", "success");
    resetDraft();
    router.dismissAll();
  };

  const riders = useDataStore((s) => s.riders);
  const selectedRiderId = useOrderStore((s) => s.draft.rider?.id);

  const riderCanProceed = !!draft.rider || draft.directPhone.trim().length >= 10;
  const step2Title = step === 2 ? "Assign Rider" : step === 3 ? "Confirm Order" : "New Delivery";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Step 1: Item Details ──────────────────────────────────── */}
      {step === 1 && (
        <>
          <FormHeader title="New Delivery" onBack={handleBack} />
          <StepDots step={1} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.formBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionLabel label="Item details" />
              <FieldInput label="Item description" value={draft.item} onChange={setItem} placeholder="e.g. Adire Maxi Dress × 2" />
              <FieldInput label="Delivery fee" value={draft.deliveryFee} onChange={setDeliveryFee} placeholder="0" keyboardType="numeric" prefix="₦" optional />
              <FieldInput label="Notes for rider" value={draft.notes} onChange={setNotes} placeholder="e.g. Call customer on arrival" optional multiline />

              {/* Photo upload */}
              <Pressable onPress={pickPhoto} style={styles.photoCard}>
                {draft.photoUri ? (
                  <Image source={{ uri: draft.photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoIconWrap}>
                    <Text style={styles.photoIcon}>📸</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.photoLabel}>{draft.photoUri ? "Change item photo" : "Add item photo"}</Text>
                  <Text style={styles.photoSub}>Evidence if dispute arises</Text>
                </View>
              </Pressable>

              <SectionLabel label="Customer" />

              {/* Customer selector */}
              <Pressable
                onPress={() => router.push("/(modals)/select-customer")}
                style={styles.selectorField}
              >
                <View style={{ flex: 1 }}>
                  <Text style={fi.label}>Customer name & address</Text>
                  {draft.customer ? (
                    <>
                      <Text style={styles.selectorValue}>{draft.customer.name}</Text>
                      <Text style={styles.selectorSub}>{draft.customer.address}</Text>
                    </>
                  ) : (
                    <Text style={styles.selectorPlaceholder}>Search address book or type new</Text>
                  )}
                </View>
                <Text style={styles.selectorIcon}>👤</Text>
              </Pressable>

              <View style={{ height: 8 }} />
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
            <SubmitBtn label="Next — Assign Rider →" onPress={handleStep1Next} disabled={!draft.item.trim()} />
          </View>
        </>
      )}

      {/* ── Step 2: Assign Rider ──────────────────────────────────── */}
      {step === 2 && (
        <>
          <FormHeader title="Assign Rider" onBack={handleBack} />
          <StepDots step={2} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.formBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionLabel label="Saved riders" />
              <View style={styles.riderSelectCard}>
                {riders.map((r, i) => {
                  const selected = draft.rider?.id === r.id;
                  const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => useOrderStore.getState().setRider(r)}
                      style={[styles.riderSelItem, selected && styles.riderSelItemActive]}
                    >
                      <View style={[styles.riderSelAvatar, { backgroundColor: ac.bg }]}>
                        <Text style={[styles.riderSelAvatarText, { color: ac.fg }]}>{initials(r.name)}</Text>
                      </View>
                      <View style={styles.riderSelInfo}>
                        <Text style={styles.riderSelName}>{r.name}</Text>
                        <Text style={styles.riderSelMeta}>{r.delivered} deliveries · {r.phone}</Text>
                      </View>
                      <View style={[styles.radioDot, selected && styles.radioDotActive]}>
                        {selected && <View style={styles.radioDotInner} />}
                      </View>
                    </Pressable>
                  );
                })}
                {/* Add new rider row */}
                <Pressable onPress={() => router.push("/(modals)/add-rider")} style={styles.addRiderRow}>
                  <View style={styles.addRiderPlus}>
                    <Feather name="plus" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.addRiderTxt}>Add a new rider</Text>
                </Pressable>
              </View>

              {/* OR divider */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.orLine} />
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
            <SubmitBtn label="Review & Send →" onPress={handleStep2Next} disabled={!riderCanProceed} />
          </View>
        </>
      )}

      {/* ── Step 3: Confirm & Send ────────────────────────────────── */}
      {step === 3 && (
        <>
          <FormHeader title="Confirm Order" onBack={handleBack} />
          <StepDots step={3} />
          <ScrollView contentContainerStyle={styles.formBody} showsVerticalScrollIndicator={false}>
            {/* Summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {[
                { label: "Item",    value: draft.item || "—" },
                { label: "Customer", value: draft.customer?.name ?? "—" },
                { label: "Address",  value: draft.customer?.address ?? "—" },
                { label: "Rider",    value: (draft.rider?.name ?? draft.directPhone) || "—" },
                { label: "Amount",   value: draft.deliveryFee ? `₦${draft.deliveryFee}` : "—", isAmount: true },
              ].map(({ label, value, isAmount }, idx, arr) => (
                <View key={label} style={[styles.summaryRow, idx < arr.length - 1 && styles.summaryRowDivider]}>
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={[styles.summaryValue, isAmount && styles.summaryAmount]}>{value}</Text>
                </View>
              ))}
            </View>

            {/* WhatsApp notice */}
            <View style={styles.waCard}>
              <Text style={styles.waIcon}>📲</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.waTitle}>WhatsApp links sent automatically</Text>
                <Text style={styles.waSub}>
                  {draft.rider?.name ?? "Rider"} gets a rider link.{" "}
                  {draft.customer?.name ?? "Customer"} gets a tracking link. Both via WhatsApp.
                </Text>
              </View>
            </View>
            <View style={{ height: 8 }} />
          </ScrollView>
          <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
            <SubmitBtn label="🚀  Send Delivery" onPress={handleSend} loading={sending} success />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  formBody: { paddingHorizontal: layout.screenPaddingH, gap: 12, paddingBottom: 16 },
  ctaRow: { paddingTop: 4 },
  sectionLabel: {
    fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700",
    letterSpacing: 0.1 * 10, textTransform: "uppercase", color: colors.textMuted,
    marginBottom: -4, marginTop: 4,
  },
  // Photo
  photoCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surfaceCard, borderRadius: radius.lg, padding: layout.cardPadding,
    shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  photoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  photoIcon: { fontSize: 20 },
  photoPreview: { width: 44, height: 44, borderRadius: 12, flexShrink: 0 },
  photoLabel: { fontSize: 13, fontFamily: font.sans.semiBold, fontWeight: "600", color: colors.primary },
  photoSub: { fontSize: 11, fontFamily: font.sans.regular, color: colors.textMuted, marginTop: 1 },
  // Customer selector
  selectorField: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.surfaceCard, borderRadius: radius.lg, padding: layout.cardPadding,
    shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  selectorValue: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "500", color: colors.textPrimary },
  selectorSub: { fontSize: 11, fontFamily: font.sans.regular, color: colors.textMuted, marginTop: 1 },
  selectorPlaceholder: { fontSize: 14, fontFamily: font.sans.regular, color: colors.textMuted },
  selectorIcon: { fontSize: 18, color: colors.textMuted },
  // Rider select
  riderSelectCard: {
    backgroundColor: colors.surfaceCard, borderRadius: radius.lg, overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  riderSelItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, paddingHorizontal: 14 },
  riderSelItemActive: { backgroundColor: colors.primarySoft },
  riderSelAvatar: { width: 38, height: 38, borderRadius: radius.full, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  riderSelAvatarText: { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700" },
  riderSelInfo: { flex: 1 },
  riderSelName: { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.13 },
  riderSelMeta: { fontSize: 11, fontFamily: font.sans.regular, color: colors.textMuted, marginTop: 1 },
  radioDot: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 2, borderColor: colors.surfaceContainer, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDotInner: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.white },
  addRiderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.surfaceContainer },
  addRiderPlus: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addRiderTxt: { fontSize: 13, fontFamily: font.sans.semiBold, fontWeight: "600", color: colors.primary },
  orRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.surfaceContainer },
  orText: { fontSize: 11, fontFamily: font.sans.semiBold, color: colors.textMuted },
  // Summary
  summaryCard: {
    backgroundColor: colors.surfaceCard, borderRadius: radius.xl, padding: 16,
    shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: { fontSize: 11, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase", color: colors.textMuted, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 9 },
  summaryRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer },
  summaryLabel: { fontSize: 12, fontFamily: font.sans.regular, color: colors.textMuted },
  summaryValue: { fontSize: 13, fontFamily: font.sans.semiBold, fontWeight: "600", color: colors.textPrimary, textAlign: "right", maxWidth: "55%" },
  summaryAmount: { fontSize: 15, fontFamily: font.mono.medium, color: colors.success },
  // WhatsApp card
  waCard: { flexDirection: "row", gap: 10, backgroundColor: colors.successBg, borderRadius: 14, padding: 12, paddingHorizontal: 14 },
  waIcon: { fontSize: 18, flexShrink: 0 },
  waTitle: { fontSize: 12, fontFamily: font.sans.bold, fontWeight: "700", color: colors.success, marginBottom: 2 },
  waSub: { fontSize: 11, fontFamily: font.sans.regular, color: "#3d7a5c", lineHeight: 15.4 },
});
