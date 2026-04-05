import { zodResolver } from "@hookform/resolvers/zod";
import { font, layout, radius } from "@/src/constants/tokens";
import { useAddCustomer } from "@/src/hooks/useCustomers";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import PhoneNumberInput from "@/src/components/profile-setup/phone-number-input";
import type { Customer } from "@/src/lib/supabaseQueries";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        try {
          return isValidPhoneNumber(value);
        } catch {
          return false;
        }
      },
      "Enter a valid phone number",
    ),
  notes: z.string().trim().optional(),
  address: z.string().trim().min(1, "Delivery address is required"),
  city: z.string().trim().optional(),
});

type CustomerValues = z.infer<typeof customerSchema>;

function SheetInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  optional,
  hasError,
  errorMsg,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
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
          styles.inputWrap,
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
        <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.textMuted }]}>
          {label}
          {optional ? <Text style={{ color: colors.textMuted }}> · Optional</Text> : null}
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
          style={[styles.input, { color: colors.textPrimary }]}
          returnKeyType="next"
        />
      </View>
      {hasError && errorMsg ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

function SheetPhoneField({
  value,
  onChange,
  onBlur,
  hasError,
  errorMsg,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  hasError?: boolean;
  errorMsg?: string;
}) {
  const { colors } = useTheme();

  return (
    <View>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.error : "transparent",
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.textMuted }]}>
          Phone number
        </Text>
        <PhoneNumberInput
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          hasError={hasError}
        />
      </View>
      {hasError && errorMsg ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

interface QuickAddCustomerSheetProps {
  open: boolean;
  sellerId: string | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

export default function QuickAddCustomerSheet({
  open,
  sellerId,
  onClose,
  onSaved,
}: QuickAddCustomerSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const addCustomer = useAddCustomer(sellerId);
  const snapPoints = useMemo(() => [620 + insets.bottom], [insets.bottom]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      address: "",
      city: "",
    },
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSave = handleSubmit(async (values) => {
    try {
      const customer = await addCustomer.mutateAsync({
        name: values.name,
        phone: values.phone,
        notes: values.notes || null,
        address: values.address,
        city: values.city || null,
      });
      showToast(`${values.name} saved`, "success");
      reset();
      onSaved(customer);
      onClose();
    } catch {
      showToast("Couldn't save customer. Try again.", "error");
    }
  });

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

  return (
    <BottomSheet
      index={open ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={[
        styles.sheetBackground,
        { backgroundColor: colors.surfaceElevated },
        sheetShadow,
      ]}
      handleIndicatorStyle={{
        backgroundColor: colors.surfaceHighlight ?? colors.surfaceContainer,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Add Customer</Text>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Full name"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. Amara Obi"
                hasError={!!errors.name}
                errorMsg={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetPhoneField
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                hasError={!!errors.phone}
                errorMsg={errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Delivery address"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Street address"
                hasError={!!errors.address}
                errorMsg={errors.address?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="City"
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. Lagos"
                optional
              />
            )}
          />
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <SheetInput
                label="Notes"
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g. Business customer"
                optional
              />
            )}
          />
        </View>

        <View
          style={[
            styles.saveShadow,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
        >
          <Pressable
            onPress={handleSave}
            disabled={addCustomer.isPending}
            style={styles.savePressable}
          >
            <View style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              {addCustomer.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Customer</Text>
              )}
            </View>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPaddingH,
  },
  sheetBackground: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  title: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    marginBottom: 16,
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
    fontWeight: "500",
    padding: 0,
  },
  errorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    marginTop: 4,
    marginLeft: 4,
  },
  saveShadow: {
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  savePressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  saveButton: {
    borderRadius: radius.full,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
