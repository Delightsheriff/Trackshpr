import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { font, layout, radius } from "@/src/constants/tokens";
import {
  useCreateProduct,
  useSession,
  useUpdateProduct,
} from "@/src/hooks";
import {
  formatNaira,
  isRemoteImageUri,
  pickProductPhotoUri,
  PRODUCT_UNITS,
  type ProductUnit,
  uploadProductPhoto,
} from "@/src/lib/inventory";
import type { Product } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";

import VoiceProductEntry from "./voice-product-entry";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  price: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine((value) => Number(value.replace(/,/g, "")) > 0, "Price must be greater than zero"),
  unit: z.enum(PRODUCT_UNITS),
  quantity: z
    .string()
    .trim()
    .min(1, "Enter a quantity")
    .refine((value) => Number.isInteger(Number(value.replace(/,/g, ""))) && Number(value.replace(/,/g, "")) >= 0, "Quantity must be 0 or more"),
  lowStockThreshold: z
    .string()
    .trim()
    .min(1, "Enter a threshold")
    .refine((value) => Number.isInteger(Number(value.replace(/,/g, ""))) && Number(value.replace(/,/g, "")) >= 0, "Threshold must be 0 or more"),
  sku: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormSheetProps {
  open: boolean;
  mode: "create" | "edit";
  product?: Product | null;
  onClose: () => void;
}

function formatIntegerInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

function parseIntegerInput(value: string) {
  return Number(value.replace(/,/g, ""));
}

function SheetInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  optional,
  multiline,
  keyboardType = "default",
  disabled,
  helperText,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
  disabled?: boolean;
  helperText?: string;
  hasError?: boolean;
  errorMsg?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.error : focused ? colors.primary : "transparent",
            opacity: disabled ? 0.65 : 1,
            minHeight: multiline ? 118 : 82,
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.textMuted }]}>
          {label}
          {optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : ""}
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
          editable={!disabled}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[
            styles.input,
            { color: colors.textPrimary, minHeight: multiline ? 64 : undefined },
          ]}
        />
      </View>
      {helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
      {hasError && errorMsg ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

export default function ProductFormSheet({
  open,
  mode,
  product,
  onClose,
}: ProductFormSheetProps) {
  const { colors, isDark } = useTheme();
  const { userId } = useSession();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const createProduct = useCreateProduct(userId);
  const updateProduct = useUpdateProduct(userId);
  const sheetRef = useRef<BottomSheet>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      unit: "piece",
      quantity: "0",
      lowStockThreshold: "5",
      sku: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (mode === "edit" && product) {
      reset({
        name: product.name,
        price: product.price.toLocaleString("en-NG"),
        unit: product.unit,
        quantity: product.quantity.toLocaleString("en-NG"),
        lowStockThreshold: product.low_stock_threshold.toLocaleString("en-NG"),
        sku: product.sku ?? "",
        description: product.description ?? "",
      });
      setPhotoUri(product.photo_url ?? null);
      return;
    }

    reset({
      name: "",
      price: "",
      unit: "piece",
      quantity: "0",
      lowStockThreshold: "5",
      sku: "",
      description: "",
    });
    setPhotoUri(null);
  }, [mode, product, reset, open]);

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

  const sheetShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 10,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
      };

  const parsedPrice = parseIntegerInput(watch("price") || "0");
  const loading = createProduct.isPending || updateProduct.isPending || photoUploading;

  const handlePhotoPick = async () => {
    const picked = await pickProductPhotoUri();
    if (!picked) return;
    setPhotoUri(picked);
  };

  const handleVoiceParsed = (parsed: {
    name: string;
    price: number;
    quantity: number;
    unit: ProductUnit;
  }) => {
    setValue("name", parsed.name, { shouldValidate: true });
    setValue("price", parsed.price.toLocaleString("en-NG"), { shouldValidate: true });
    setValue("quantity", parsed.quantity.toLocaleString("en-NG"), { shouldValidate: true });
    setValue("unit", parsed.unit, { shouldValidate: true });
    showToast("Voice draft added to the form. Review it before saving.", "info");
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!userId) return;

    const payload = {
      name: values.name.trim(),
      price: parseIntegerInput(values.price),
      unit: values.unit,
      low_stock_threshold: parseIntegerInput(values.lowStockThreshold),
      sku: values.sku?.trim() ? values.sku.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      photo_url: mode === "edit" && isRemoteImageUri(photoUri)
        ? photoUri
        : product?.photo_url ?? null,
    } as const;

    try {
      if (mode === "create") {
        const created = await createProduct.mutateAsync({
          ...payload,
          quantity: parseIntegerInput(values.quantity),
        });

        if (photoUri && !isRemoteImageUri(photoUri)) {
          setPhotoUploading(true);
          const uploadResult = await uploadProductPhoto({
            userId,
            productId: created.id,
            uri: photoUri,
          });
          setPhotoUploading(false);

          if (uploadResult.publicUrl) {
            await updateProduct.mutateAsync({
              productId: created.id,
              data: { photo_url: uploadResult.publicUrl },
            });
          } else {
            showToast("Product saved, but the photo could not be uploaded.", "error");
          }
        }

        showToast(`${created.name} added to inventory`, "success");
        onClose();
        return;
      }

      if (!product) return;

      let nextPhotoUrl = payload.photo_url;
      if (photoUri && !isRemoteImageUri(photoUri)) {
        setPhotoUploading(true);
        const uploadResult = await uploadProductPhoto({
          userId,
          productId: product.id,
          uri: photoUri,
        });
        setPhotoUploading(false);

        if (uploadResult.publicUrl) {
          nextPhotoUrl = uploadResult.publicUrl;
        } else {
          showToast("Photo upload failed. Your existing photo was kept.", "error");
        }
      }

      await updateProduct.mutateAsync({
        productId: product.id,
        data: {
          ...payload,
          photo_url: nextPhotoUrl,
        },
      });

      showToast("Product updated", "success");
      onClose();
    } catch {
      setPhotoUploading(false);
      showToast(
        mode === "create"
          ? "Couldn't save this product. Try again."
          : "Couldn't update this product. Try again.",
        "error",
      );
    }
  });

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={useMemo(() => [760 + insets.bottom], [insets.bottom])}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={[
        styles.sheetBg,
        { backgroundColor: colors.surfaceElevated },
        sheetShadow,
      ]}
      handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
          {mode === "create" ? "Add Product" : "Edit Product"}
        </Text>
        <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
          {mode === "create"
            ? "Save each size or variation as its own product for simple stock tracking."
            : "Update the product details sellers and customers see."}
        </Text>

        {mode === "create" ? (
          <View style={styles.voiceEntryWrap}>
            <VoiceProductEntry onApplyParsedResult={handleVoiceParsed} />
          </View>
        ) : null}

        <View style={[styles.photoCard, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.photoRow}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <View style={[styles.photoPreview, { backgroundColor: colors.surfaceContainer }]}>
                <Feather name="image" size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.photoCopy}>
              <Text style={[styles.photoTitle, { color: colors.textPrimary }]}>Product photo</Text>
              <Text style={[styles.photoSub, { color: colors.textMuted }]}>
                Optional. We will compress it before uploading to keep things fast.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handlePhotoPick}
            style={[styles.photoButton, { backgroundColor: colors.surfaceContainer }]}
          >
            <Feather name="camera" size={14} color={colors.textSecondary} />
            <Text style={[styles.photoButtonText, { color: colors.textSecondary }]}>
              {photoUri ? "Change photo" : "Choose photo"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Product name"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. Black Hoodie M"
                hasError={!!errors.name}
                errorMsg={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Price (₦)"
                value={value}
                onChange={(next) => onChange(formatIntegerInput(next))}
                onBlur={onBlur}
                placeholder="e.g. 5,000"
                keyboardType="number-pad"
                helperText={value ? `Shown to buyers as ${formatNaira(parsedPrice)}` : undefined}
                hasError={!!errors.price}
                errorMsg={errors.price?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="unit"
            render={({ field: { value, onChange } }) => (
              <View style={styles.unitSection}>
                <Text style={[styles.unitLabel, { color: colors.textMuted }]}>Unit</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unitList}
                >
                  {PRODUCT_UNITS.map((unit) => {
                    const active = value === unit;
                    return (
                      <Pressable
                        key={unit}
                        onPress={() => onChange(unit)}
                        style={[
                          styles.unitPill,
                          {
                            backgroundColor: active ? colors.primarySoft : colors.surfaceCard,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitPillText,
                            {
                              color: active ? colors.primary : colors.textSecondary,
                            },
                          ]}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          />

          <Controller
            control={control}
            name="quantity"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Initial quantity"
                value={value}
                onChange={(next) => onChange(formatIntegerInput(next))}
                onBlur={onBlur}
                placeholder="e.g. 10"
                keyboardType="number-pad"
                disabled={mode === "edit"}
                helperText={
                  mode === "edit"
                    ? "Use the quick restock flow to change stock after a product has been created."
                    : undefined
                }
                hasError={!!errors.quantity}
                errorMsg={errors.quantity?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="lowStockThreshold"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Low stock threshold"
                value={value}
                onChange={(next) => onChange(formatIntegerInput(next))}
                onBlur={onBlur}
                placeholder="e.g. 5"
                keyboardType="number-pad"
                hasError={!!errors.lowStockThreshold}
                errorMsg={errors.lowStockThreshold?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="sku"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="SKU"
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. HD-BLK-M"
                optional
                hasError={!!errors.sku}
                errorMsg={errors.sku?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Description"
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Add any seller notes or buyer-facing details"
                optional
                multiline
                hasError={!!errors.description}
                errorMsg={errors.description?.message}
              />
            )}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "create" ? "Save Product" : "Save Changes"}
            </Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  content: {
    paddingHorizontal: layout.screenPaddingH,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
    marginBottom: 16,
  },
  voiceEntryWrap: {
    marginBottom: 12,
  },
  photoCard: {
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoCopy: {
    flex: 1,
    gap: 3,
  },
  photoTitle: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  photoSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  photoButton: {
    minHeight: 42,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoButtonText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  fields: {
    gap: 10,
    marginBottom: 18,
  },
  inputWrap: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    borderWidth: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  input: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    padding: 0,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
  unitSection: {
    gap: 8,
  },
  unitLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  unitList: {
    gap: 8,
    paddingVertical: 2,
  },
  unitPill: {
    minHeight: 38,
    borderRadius: radius.full,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  unitPillText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
