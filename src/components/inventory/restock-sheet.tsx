import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { font, layout, radius } from "@/src/constants/tokens";
import { useRestockProduct, useSession } from "@/src/hooks";
import { formatNaira } from "@/src/lib/inventory";
import type { Product } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";

const restockSchema = z.object({
  quantity: z.string().trim().min(1, "Enter a quantity").refine((value) => {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isInteger(parsed) && parsed > 0;
  }, "Quantity must be greater than zero"),
  note: z.string().trim().optional(),
});

type RestockValues = z.infer<typeof restockSchema>;

interface RestockSheetProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

function SheetInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  multiline,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  multiline?: boolean;
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
            minHeight: multiline ? 112 : 78,
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.textMuted }]}>
          {label}
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
          keyboardType={multiline ? "default" : "number-pad"}
          multiline={multiline}
          style={[
            styles.input,
            { color: colors.textPrimary, minHeight: multiline ? 62 : undefined },
          ]}
        />
      </View>
      {hasError && errorMsg ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

export default function RestockSheet({
  open,
  product,
  onClose,
}: RestockSheetProps) {
  const { colors, isDark } = useTheme();
  const { userId } = useSession();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const restockMutation = useRestockProduct(userId);
  const sheetRef = useRef<BottomSheet>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: "", note: "" },
  });

  useEffect(() => {
    if (open) {
      sheetRef.current?.snapToIndex(0);
      reset({ quantity: "", note: "" });
    } else {
      sheetRef.current?.close();
    }
  }, [open, reset]);

  const currentQuantity = product?.quantity ?? 0;
  const parsedQuantity = Number(watch("quantity")?.replace(/,/g, "") ?? 0);
  const projectedQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? currentQuantity + parsedQuantity
      : currentQuantity;

  const cardShadow = isDark
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

  const onSubmit = handleSubmit(async (values) => {
    if (!product) return;

    try {
      await restockMutation.mutateAsync({
        productId: product.id,
        quantity: Number(values.quantity.replace(/,/g, "")),
        note: values.note?.trim() ? values.note.trim() : null,
      });

      showToast(`${product.name} restocked`, "success");
      onClose();
    } catch {
      showToast("Couldn't restock this product. Try again.", "error");
    }
  });

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={useMemo(() => [480 + insets.bottom], [insets.bottom])}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={[
        styles.sheetBg,
        { backgroundColor: colors.surfaceElevated },
        cardShadow,
      ]}
      handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Quick Restock</Text>
        <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
          Add fresh stock for {product?.name ?? "this product"} without editing the rest of the
          product details.
        </Text>

        <View style={styles.stockGrid}>
          <View style={[styles.stockCard, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[styles.stockLabel, { color: colors.textMuted }]}>Current stock</Text>
            <Text style={[styles.stockValue, { color: colors.textPrimary }]}>
              {currentQuantity} {product?.unit ?? "piece"}
            </Text>
          </View>
          <View style={[styles.stockCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.stockLabel, { color: colors.primary }]}>After restock</Text>
            <Text style={[styles.stockValue, { color: colors.primary }]}>
              {projectedQuantity} {product?.unit ?? "piece"}
            </Text>
          </View>
        </View>

        {product ? (
          <View style={[styles.valueCard, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.valueLabel, { color: colors.textMuted }]}>Unit price</Text>
            <Text style={[styles.valueText, { color: colors.textPrimary }]}>
              {formatNaira(product.price)}
            </Text>
          </View>
        ) : null}

        <View style={styles.fields}>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Quantity to add"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. 12"
                hasError={!!errors.quantity}
                errorMsg={errors.quantity?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="note"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Note"
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. New carton delivered today"
                multiline
                hasError={!!errors.note}
                errorMsg={errors.note?.message}
              />
            )}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={restockMutation.isPending}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          {restockMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm Restock</Text>
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
  stockGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  stockCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
  },
  stockLabel: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  stockValue: {
    fontSize: 20,
    fontFamily: font.mono.medium,
    fontWeight: "500",
  },
  valueCard: {
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  valueLabel: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  valueText: {
    fontSize: 16,
    fontFamily: font.mono.medium,
    fontWeight: "500",
  },
  fields: {
    gap: 10,
    marginBottom: 16,
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
  errorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
