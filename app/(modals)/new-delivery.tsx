/**
 * New Delivery — 3-step order creation modal.
 * Step 1: Item details + customer selection
 * Step 2: Rider assignment
 * Step 3: Confirm & send
 */
import { zodResolver } from "@hookform/resolvers/zod";
import QuickAddCustomerSheet from "@/src/components/orders/quick-add-customer-sheet";
import QuickAddRiderSheet from "@/src/components/orders/quick-add-rider-sheet";
import ProGate from "@/src/components/shared/ProGate";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import {
  useCreateOrder,
  useCustomerAddresses,
  useCustomers,
  useProducts,
  useProfile,
  useRiders,
} from "@/src/hooks";
import { formatNaira } from "@/src/lib/inventory";
import type { CustomerAddress } from "@/src/lib/supabaseQueries";
import { useSession } from "@/src/hooks/useSession";
import { useOrderStore } from "@/src/stores/orderStore";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function buildProductSummary(products: { name: string; quantity: number }[]) {
  return products
    .map((product) => `${product.name} x${product.quantity}`)
    .join(", ");
}

function formatFeeInput(value: string) {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-NG");
}

function parseFeeInput(value: string) {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  return digitsOnly ? Number(digitsOnly) : null;
}

function getDeliveryAddressSelection(
  selectedAddress: CustomerAddress | null,
  oneOffAddress: string,
  oneOffCity: string,
) {
  if (oneOffAddress.trim()) {
    return {
      deliveryAddress: oneOffAddress.trim(),
      city: oneOffCity.trim() || null,
    };
  }

  return {
    deliveryAddress: selectedAddress?.address?.trim() ?? "",
    city: selectedAddress?.city ?? null,
  };
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.searchWrap,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: focused ? colors.primary : "transparent",
        },
      ]}
    >
      <Feather name="search" size={15} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.textPrimary }]}
      />
    </View>
  );
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
  error,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  prefix?: string;
  multiline?: boolean;
  optional?: boolean;
  error?: string;
  editable?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View
      style={[
        fi.wrap,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: error
            ? colors.error
            : focused
              ? colors.primary
              : "transparent",
        },
      ]}
      >
      <Text style={[fi.label, { color: error ? colors.error : colors.textMuted }]}>
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
          editable={editable}
          style={[
            fi.input,
            { color: colors.textPrimary },
            multiline && { minHeight: 48, textAlignVertical: "top" },
            !editable && { color: colors.textSecondary },
          ]}
          returnKeyType="next"
        />
      </View>
      </View>
      {error ? <Text style={[styles.fieldError, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}
const fi = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    borderWidth: 2,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-start" },
  label: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  prefix: { fontSize: 14, fontFamily: font.sans.semiBold, marginRight: 4, marginTop: 1 },
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

function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surfaceCard }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
        {description}
      </Text>
      {actionLabel && onPress ? (
        <Pressable
          onPress={onPress}
          style={[styles.inlineAction, { backgroundColor: colors.surfaceContainer }]}
        >
          <Text style={[styles.inlineActionText, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RetryCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.retryCard, { backgroundColor: colors.errorBg }]}>
      <View style={[styles.retryIcon, { backgroundColor: colors.surfaceCard }]}>
        <Feather name="wifi-off" size={16} color={colors.error} />
      </View>
      <View style={styles.retryBody}>
        <Text style={[styles.retryTitle, { color: colors.error }]}>{message}</Text>
        <Pressable onPress={onRetry}>
          <Text style={[styles.retryLink, { color: colors.error }]}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  item: z.string().optional(),
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [riderSearch, setRiderSearch] = useState("");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [riderError, setRiderError] = useState<string | null>(null);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [riderSheetOpen, setRiderSheetOpen] = useState(false);

  const {
    prefillItem,
    prefillCustomerName,
    prefillCustomerPhone,
    prefillAddress,
    prefillCustomerId,
  } = useLocalSearchParams<{
    prefillItem?: string;
    prefillCustomerName?: string;
    prefillCustomerPhone?: string;
    prefillAddress?: string;
    prefillCustomerId?: string;
  }>();

  const { userId } = useSession();
  const createOrder = useCreateOrder(userId);
  const showToast = useToastStore((s) => s.show);
  const { data: profile } = useProfile(userId);
  const {
    data: riders = [],
    isLoading: ridersLoading,
    isError: ridersFetchError,
    refetch: refetchRiders,
  } = useRiders(userId);
  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersFetchError,
    refetch: refetchCustomers,
  } = useCustomers(userId);
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsFetchError,
    refetch: refetchProducts,
  } = useProducts(userId);

  const draft = useOrderStore((s) => s.draft);
  const addPhotoUri = useOrderStore((s) => s.addPhotoUri);
  const removePhotoUri = useOrderStore((s) => s.removePhotoUri);
  const setDirectPhone = useOrderStore((s) => s.setDirectPhone);
  const setCustomer = useOrderStore((s) => s.setCustomer);
  const setSelectedAddress = useOrderStore((s) => s.setSelectedAddress);
  const setAddressInput = useOrderStore((s) => s.setAddressInput);
  const setCityInput = useOrderStore((s) => s.setCityInput);
  const setRider = useOrderStore((s) => s.setRider);
  const upsertProduct = useOrderStore((s) => s.upsertProduct);
  const updateProductQuantity = useOrderStore((s) => s.updateProductQuantity);
  const removeProduct = useOrderStore((s) => s.removeProduct);
  const resetDraft = useOrderStore((s) => s.reset);
  const {
    data: customerAddresses = [],
    isLoading: addressesLoading,
    isError: addressesFetchError,
    refetch: refetchAddresses,
  } = useCustomerAddresses(draft.customer?.id ?? null);

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { item: draft.item, deliveryFee: draft.deliveryFee, notes: draft.notes },
  });

  const isPro = profile?.is_pro === true;
  const derivedItem = buildProductSummary(draft.products);
  const { deliveryAddress, city } = getDeliveryAddressSelection(
    draft.selectedAddress,
    draft.addressInput,
    draft.cityInput,
  );
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [customerSearch, customers]);
  const filteredRiders = useMemo(() => {
    const query = riderSearch.trim().toLowerCase();
    if (!query) return riders;
    return riders.filter((rider) => rider.name.toLowerCase().includes(query));
  }, [riderSearch, riders]);

  useEffect(() => {
    if (!prefillItem) return;
    reset({ item: prefillItem, deliveryFee: "", notes: "" });
    if (prefillCustomerName) {
      setCustomer({
        id: prefillCustomerId ?? "",
        seller_id: userId ?? "",
        name: prefillCustomerName,
        phone: prefillCustomerPhone ?? null,
        notes: null,
        order_count: 0,
        failed_count: 0,
        address: prefillAddress ?? null,
        city: null,
        created_at: null,
        updated_at: null,
      });
      setAddressInput(prefillAddress ?? "");
    }
  }, [
    prefillAddress,
    prefillCustomerId,
    prefillCustomerName,
    prefillCustomerPhone,
    prefillItem,
    reset,
    setAddressInput,
    setCustomer,
    userId,
  ]);

  useEffect(() => {
    if (!isPro) return;
    setValue("item", derivedItem);
  }, [derivedItem, isPro, setValue]);

  useEffect(() => {
    if (!draft.customer?.id || draft.selectedAddress || draft.addressInput.trim()) return;

    const defaultAddress =
      customerAddresses.find((address) => address.is_default) ?? customerAddresses[0];
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
      setAddressError(null);
      return;
    }

    if (draft.customer.address) {
      setAddressInput(draft.customer.address);
      setCityInput(draft.customer.city ?? "");
    }
  }, [
    customerAddresses,
    draft.addressInput,
    draft.customer,
    draft.selectedAddress,
    setAddressInput,
    setCityInput,
    setSelectedAddress,
  ]);

  const handleBack = () => {
    if (step === 1) {
      resetDraft();
      router.back();
    } else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      base64: false,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      draft.photoUris.forEach((uri) => removePhotoUri(uri));
      addPhotoUri(result.assets[0].uri);
    }
  }, [addPhotoUri, draft.photoUris, removePhotoUri]);

  const handleStep1Next = handleSubmit((values) => {
    let hasError = false;

    if (!isPro && !values.item?.trim()) {
      setError("item", { type: "manual", message: "Please describe the item" });
      hasError = true;
    } else {
      clearErrors("item");
    }

    if (isPro && draft.products.length === 0) {
      setProductError("Add at least one product");
      hasError = true;
    } else {
      setProductError(null);
    }

    if (!draft.customer) {
      setCustomerError("Select or save a customer");
      hasError = true;
    } else {
      setCustomerError(null);
    }

    if (!deliveryAddress) {
      setAddressError("Add a delivery address");
      hasError = true;
    } else {
      setAddressError(null);
    }

    if (hasError) return;

    setSubmitError(null);
    setStep(2);
  });

  const handleStep2Next = () => {
    if (!draft.rider && !draft.directPhone.trim()) {
      setRiderError("Select a rider or enter a rider phone number");
      return;
    }
    setRiderError(null);
    setSubmitError(null);
    setStep(3);
  };

  const handleSend = async () => {
    const values = getValues();
    const finalItem = isPro ? derivedItem : values.item?.trim() ?? "";

    if (!finalItem || !draft.customer || !deliveryAddress) {
      showToast("Please complete the order details before sending.", "error");
      return;
    }

    setSending(true);
    setSubmitError(null);
    try {
      const order = await createOrder.mutateAsync({
        item: finalItem,
        delivery_fee: parseFeeInput(values.deliveryFee ?? ""),
        notes: values.notes?.trim() || null,
        customer_id: draft.customer.id,
        customer_name: draft.customer.name,
        customer_phone: draft.customer.phone ?? "",
        delivery_address: deliveryAddress,
        city,
        rider_id: draft.rider?.id ?? null,
        rider_name: draft.rider?.name ?? null,
        rider_phone: (draft.rider?.phone ?? draft.directPhone.trim()) || null,
        direct_phone: draft.directPhone.trim() || null,
        photo_uri: draft.photoUris[0] ?? null,
        order_items: draft.products.map((product) => ({
          product_id: product.product_id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          name: product.name,
        })),
      });
      showToast("Order created!", "success");
      resetDraft();
      reset({ item: "", deliveryFee: "", notes: "" });
      router.dismissAll();
      router.push({ pathname: "/(screens)/order-detail", params: { id: order.id } });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't create the order. Please try again.";
      setSubmitError(message);
      showToast(message, "error");
    } finally {
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
              {!isPro ? (
                <>
              <Controller
                control={control}
                name="item"
                render={({ field: { value, onChange } }) => (
                  <FieldInput
                    label="Item description"
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder="e.g. Adire Maxi Dress × 2"
                    error={errors.item?.message}
                  />
                )}
              />
                </>
              ) : null}
              {isPro && (
                <FieldInput
                  label="Order item"
                  value={derivedItem || "Selected products will appear here"}
                  onChange={() => undefined}
                  editable={false}
                />
              )}
              <ProGate feature="order_items">
                <View style={styles.proSection}>
                  <Text style={[styles.proSectionTitle, { color: colors.textPrimary }]}>
                    Select products
                  </Text>
                  <Text style={[styles.proSectionSub, { color: colors.textMuted }]}>
                    Add products with quantities and the item summary will update automatically.
                  </Text>

                  {productsLoading ? (
                    <View style={[styles.loadingCard, { backgroundColor: colors.surfaceCard }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                        Loading products...
                      </Text>
                    </View>
                  ) : productsFetchError ? (
                    <RetryCard
                      message="Couldn't load products"
                      onRetry={() => void refetchProducts()}
                    />
                  ) : products.length === 0 ? (
                    <EmptyStateCard
                      icon="box"
                      title="No products yet"
                      description="Create products in Inventory first, then add them to orders here."
                    />
                  ) : (
                    <View style={styles.productList}>
                      {products.map((product) => {
                        const selectedProduct = draft.products.find(
                          (entry) => entry.product_id === product.id,
                        );
                        const quantity = selectedProduct?.quantity ?? 0;

                        return (
                          <View
                            key={product.id}
                            style={[styles.productRow, { backgroundColor: colors.surfaceCard }]}
                          >
                            <View style={styles.productBody}>
                              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>
                                {product.name}
                              </Text>
                              <Text style={[styles.listRowMeta, { color: colors.textMuted }]}>
                                {formatNaira(product.price)} · {product.quantity} {product.unit} left
                              </Text>
                            </View>
                            <View style={styles.quantityControls}>
                              <Pressable
                                onPress={() => {
                                  if (quantity <= 1) {
                                    removeProduct(product.id);
                                  } else {
                                    updateProductQuantity(product.id, quantity - 1);
                                  }
                                  setProductError(null);
                                }}
                                style={[styles.quantityBtn, { backgroundColor: colors.surfaceContainer }]}
                              >
                                <Feather name="minus" size={14} color={colors.textSecondary} />
                              </Pressable>
                              <Text style={[styles.quantityText, { color: colors.textPrimary }]}>
                                {quantity}
                              </Text>
                              <Pressable
                                onPress={() => {
                                  upsertProduct(product, quantity + 1);
                                  setProductError(null);
                                }}
                                disabled={quantity >= product.quantity}
                                style={[
                                  styles.quantityBtn,
                                  {
                                    backgroundColor:
                                      quantity >= product.quantity
                                        ? colors.surfaceContainer
                                        : colors.primarySoft,
                                  },
                                ]}
                              >
                                <Feather
                                  name="plus"
                                  size={14}
                                  color={quantity >= product.quantity ? colors.textMuted : colors.primary}
                                />
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {productError ? (
                    <Text style={[styles.fieldError, { color: colors.error }]}>
                      {productError}
                    </Text>
                  ) : null}
                </View>
              </ProGate>
              <Controller
                control={control}
                name="deliveryFee"
                render={({ field: { value, onChange } }) => (
                  <FieldInput
                    label="Delivery fee"
                    value={formatFeeInput(value ?? "")}
                    onChange={(text) => onChange(text.replace(/[^0-9]/g, ""))}
                    placeholder="0"
                    keyboardType="number-pad"
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
              <SearchField
                value={customerSearch}
                onChange={setCustomerSearch}
                placeholder="Search by customer name or phone"
              />

              {customersLoading ? (
                <View style={[styles.loadingCard, { backgroundColor: colors.surfaceCard }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Loading customers...
                  </Text>
                </View>
              ) : customersFetchError ? (
                <RetryCard
                  message="Couldn't load customers"
                  onRetry={() => void refetchCustomers()}
                />
              ) : customers.length === 0 ? (
                <EmptyStateCard
                  icon="user"
                  title="No customers saved"
                  description="Save a customer now and keep the order form open."
                  actionLabel="Add customer"
                  onPress={() => setCustomerSheetOpen(true)}
                />
              ) : filteredCustomers.length === 0 ? (
                <EmptyStateCard
                  icon="search"
                  title="No customer match"
                  description="Try a different name or phone number."
                  actionLabel="Add customer"
                  onPress={() => setCustomerSheetOpen(true)}
                />
              ) : (
                <View style={[styles.listCard, { backgroundColor: colors.surfaceCard }]}>
                  {filteredCustomers.map((customer) => {
                    const selected = draft.customer?.id === customer.id;
                    return (
                      <Pressable
                        key={customer.id}
                        onPress={() => {
                          setCustomer(customer);
                          setSelectedAddress(null);
                          setAddressInput("");
                          setCityInput("");
                          setCustomerError(null);
                        }}
                        style={[styles.listRow, selected && { backgroundColor: colors.primarySoft }]}
                      >
                        <View style={styles.listRowBody}>
                          <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>
                            {customer.name}
                          </Text>
                          <Text style={[styles.listRowMeta, { color: colors.textMuted }]}>
                            {customer.phone} · {customer.order_count} orders
                          </Text>
                        </View>
                        {selected ? <Feather name="check" size={16} color={colors.primary} /> : null}
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => setCustomerSheetOpen(true)}
                    style={styles.addEntityRow}
                  >
                    <View style={[styles.addEntityIcon, { backgroundColor: colors.primarySoft }]}>
                      <Feather name="plus" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.addEntityText, { color: colors.primary }]}>
                      Add customer
                    </Text>
                  </Pressable>
                </View>
              )}

              {customerError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {customerError}
                </Text>
              ) : null}

              {draft.customer ? (
                <>
                  <SectionLabel label="Delivery address" />

                  {addressesLoading ? (
                    <View style={[styles.loadingCard, { backgroundColor: colors.surfaceCard }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                        Loading saved addresses...
                      </Text>
                    </View>
                  ) : addressesFetchError ? (
                    <RetryCard
                      message="Couldn't load addresses"
                      onRetry={() => void refetchAddresses()}
                    />
                  ) : customerAddresses.length === 0 ? (
                    <EmptyStateCard
                      icon="map-pin"
                      title="No saved addresses"
                      description="Type a one-off delivery address for this order."
                    />
                  ) : (
                    <View style={[styles.listCard, { backgroundColor: colors.surfaceCard }]}>
                      {customerAddresses.map((address) => {
                        const selected = draft.selectedAddress?.id === address.id;
                        return (
                          <Pressable
                            key={address.id}
                            onPress={() => {
                              setSelectedAddress(address);
                              setAddressError(null);
                            }}
                            style={[styles.listRow, selected && { backgroundColor: colors.primarySoft }]}
                          >
                            <View style={styles.listRowBody}>
                              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>
                                {address.label || (address.is_default ? "Default address" : "Saved address")}
                              </Text>
                              <Text style={[styles.listRowMeta, { color: colors.textMuted }]}>
                                {address.address}
                                {address.city ? ` · ${address.city}` : ""}
                              </Text>
                            </View>
                            {selected ? <Feather name="check" size={16} color={colors.primary} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <FieldInput
                    label="One-off address"
                    value={draft.addressInput}
                    onChange={(value) => {
                      setAddressInput(value);
                      setAddressError(null);
                    }}
                    placeholder="Type a different address for this order"
                    optional
                  />
                  <FieldInput
                    label="City"
                    value={draft.cityInput}
                    onChange={setCityInput}
                    placeholder="e.g. Lagos"
                    optional
                  />

                  {addressError ? (
                    <Text style={[styles.fieldError, { color: colors.error }]}>
                      {addressError}
                    </Text>
                  ) : null}
                </>
              ) : null}
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
              <SearchField
                value={riderSearch}
                onChange={setRiderSearch}
                placeholder="Search rider by name"
              />
              <View
                style={[
                  styles.riderSelectCard,
                  { backgroundColor: colors.surfaceCard },
                ]}
              >
                {ridersLoading ? (
                  <View style={[styles.loadingCard, { backgroundColor: colors.surfaceCard }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Loading riders...
                    </Text>
                  </View>
                ) : ridersFetchError ? (
                  <RetryCard
                    message="Couldn't load riders"
                    onRetry={() => void refetchRiders()}
                  />
                ) : riders.length === 0 ? (
                  <EmptyStateCard
                    icon="user-plus"
                    title="No riders saved"
                    description="Save a rider now and keep this order form open."
                    actionLabel="Add rider"
                    onPress={() => setRiderSheetOpen(true)}
                  />
                ) : (riderSearch.trim() ? filteredRiders : riders).length === 0 ? (
                  <EmptyStateCard
                    icon="search"
                    title="No rider match"
                    description="Try a different rider name."
                    actionLabel="Add rider"
                    onPress={() => setRiderSheetOpen(true)}
                  />
                ) : (
                  <>
                    {(riderSearch.trim() ? filteredRiders : riders).map((r, i) => {
                      const selected = draft.rider?.id === r.id;
                      const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() => {
                            setRider(r);
                            setRiderError(null);
                          }}
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
                              {r.total_deliveries} deliveries · {r.phone}
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
                    <Pressable
                      onPress={() => setRiderSheetOpen(true)}
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
                  </>
                )}
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
                onChange={(v) => {
                  setDirectPhone(v);
                  if (v.trim()) {
                    setRiderError(null);
                  }
                }}
                placeholder="0800 000 0000"
                keyboardType="phone-pad"
                error={riderError ?? undefined}
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
                { label: "Item", value: (isPro ? derivedItem : getValues("item")) || "—" },
                { label: "Customer", value: draft.customer?.name ?? "—" },
                { label: "Address", value: deliveryAddress || "—" },
                {
                  label: "Rider",
                  value: (draft.rider?.name ?? draft.directPhone) || "—",
                },
                {
                  label: "Amount",
                  value: parseFeeInput(getValues("deliveryFee") ?? "")
                    ? formatNaira(parseFeeInput(getValues("deliveryFee") ?? ""))
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
            {submitError ? (
              <View style={[styles.submitErrorCard, { backgroundColor: colors.errorBg }]}>
                <Text style={[styles.submitErrorTitle, { color: colors.error }]}>
                  {submitError}
                </Text>
                <Pressable onPress={handleSend}>
                  <Text style={[styles.retryLink, { color: colors.error }]}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
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
      <QuickAddCustomerSheet
        open={customerSheetOpen}
        sellerId={userId}
        onClose={() => setCustomerSheetOpen(false)}
        onSaved={(customer) => {
          setCustomer(customer);
          setSelectedAddress(null);
          setAddressInput(customer.address ?? "");
          setCityInput(customer.city ?? "");
          setCustomerError(null);
          setAddressError(null);
        }}
      />
      <QuickAddRiderSheet
        open={riderSheetOpen}
        sellerId={userId}
        onClose={() => setRiderSheetOpen(false)}
        onSaved={(rider) => {
          setRider(rider);
          setRiderError(null);
        }}
      />
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.sans.regular,
    padding: 0,
  },
  emptyCard: {
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
    textAlign: "center",
  },
  inlineAction: {
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  inlineActionText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  retryCard: {
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  retryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBody: {
    flex: 1,
    gap: 4,
  },
  retryTitle: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  retryLink: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  loadingCard: {
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
  listCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  listRowBody: {
    flex: 1,
  },
  listRowTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  listRowMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 2,
  },
  addEntityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addEntityIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addEntityText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  proSection: {
    gap: 10,
  },
  proSectionTitle: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  proSectionSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  productList: {
    gap: 8,
  },
  productRow: {
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productBody: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 18,
    textAlign: "center",
    fontSize: 13,
    fontFamily: font.mono.medium,
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
  submitErrorCard: {
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
  },
  submitErrorTitle: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
