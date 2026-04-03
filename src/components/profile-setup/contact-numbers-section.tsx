/**
 * ContactNumbersSection — manages up to 5 seller contact numbers.
 *
 * Each entry has: E.164 number, label, is_whatsapp toggle, primary selector.
 * Exactly one entry is primary at all times; selecting a new one deselects
 * the previous. Minimum one number required (enforced by schema).
 */
import { Feather } from "@expo/vector-icons";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radius } from "@/src/constants/tokens";
import PhoneNumberInput from "./phone-number-input";
import { ContactNumberData } from "./profile-setup-schema";

const MAX_NUMBERS = 5;

const LABEL_PRESETS = ["WhatsApp", "Office", "Personal", "SMS", "Other"] as const;

interface ContactNumbersSectionProps {
  values: ContactNumberData[];
  onChange: (updated: ContactNumberData[]) => void;
  errors?: Array<{ number?: string; label?: string } | undefined>;
  globalError?: string; // e.g. "One number must be set as primary"
}

export default function ContactNumbersSection({
  values,
  onChange,
  errors = [],
  globalError,
}: ContactNumbersSectionProps) {
  const updateEntry = useCallback(
    (index: number, patch: Partial<ContactNumberData>) => {
      onChange(values.map((v, i) => (i === index ? { ...v, ...patch } : v)));
    },
    [values, onChange],
  );

  const setPrimary = useCallback(
    (index: number) => {
      onChange(values.map((v, i) => ({ ...v, is_primary: i === index })));
    },
    [values, onChange],
  );

  const addNumber = useCallback(() => {
    if (values.length >= MAX_NUMBERS) return;
    onChange([
      ...values,
      {
        number: "",
        label: "Office",
        is_whatsapp: false,
        is_primary: false,
      },
    ]);
  }, [values, onChange]);

  const removeEntry = useCallback(
    (index: number) => {
      const next = values.filter((_, i) => i !== index);
      // If the removed entry was primary, promote the first remaining
      if (values[index].is_primary && next.length > 0) {
        next[0] = { ...next[0], is_primary: true };
      }
      onChange(next);
    },
    [values, onChange],
  );

  return (
    <View style={styles.container}>
      {values.map((entry, index) => {
        const fieldError = errors[index];
        const isPrimary = entry.is_primary;

        return (
          <View
            key={index}
            style={[styles.entryCard, isPrimary && styles.entryCardPrimary]}
          >
            {/* Header row: primary badge + label + remove */}
            <View style={styles.entryHeader}>
              <Pressable
                onPress={() => setPrimary(index)}
                style={[
                  styles.primaryBtn,
                  isPrimary && styles.primaryBtnActive,
                ]}
              >
                <View
                  style={[
                    styles.primaryDot,
                    isPrimary && styles.primaryDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.primaryLabel,
                    isPrimary && styles.primaryLabelActive,
                  ]}
                >
                  {isPrimary ? "Primary" : "Set as primary"}
                </Text>
              </Pressable>

              <View style={{ flex: 1 }} />

              {/* Remove — only shown when more than one entry exists */}
              {values.length > 1 && (
                <Pressable
                  onPress={() => removeEntry(index)}
                  style={styles.removeBtn}
                  hitSlop={6}
                >
                  <Feather name="trash-2" size={14} color={colors.error} />
                </Pressable>
              )}
            </View>

            {/* Phone number input */}
            <View style={styles.phoneRow}>
              <Text style={styles.fieldMeta}>Number</Text>
              <PhoneNumberInput
                value={entry.number}
                onChange={(e164) => updateEntry(index, { number: e164 })}
                hasError={!!fieldError?.number}
              />
              {!!fieldError?.number && (
                <Text style={styles.fieldError}>{fieldError.number}</Text>
              )}
            </View>

            {/* Label quick-select chips */}
            <View style={styles.labelRow}>
              <Text style={styles.fieldMeta}>Label</Text>
              <View style={styles.chips}>
                {LABEL_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => updateEntry(index, { label: preset })}
                    style={[
                      styles.chip,
                      entry.label === preset && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        entry.label === preset && styles.chipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* WhatsApp toggle */}
            <Pressable
              onPress={() =>
                updateEntry(index, { is_whatsapp: !entry.is_whatsapp })
              }
              style={styles.toggleRow}
            >
              <View style={styles.toggleLeft}>
                <Feather
                  name="message-circle"
                  size={14}
                  color={entry.is_whatsapp ? colors.success : colors.textMuted}
                />
                <Text
                  style={[
                    styles.toggleLabel,
                    entry.is_whatsapp && { color: colors.success },
                  ]}
                >
                  WhatsApp number
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  entry.is_whatsapp && styles.toggleOn,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    entry.is_whatsapp && styles.toggleThumbOn,
                  ]}
                />
              </View>
            </Pressable>
          </View>
        );
      })}

      {/* Global validation error (e.g. primary constraint) */}
      {!!globalError && (
        <View style={styles.globalErrorRow}>
          <Feather name="alert-triangle" size={12} color={colors.error} />
          <Text style={styles.globalErrorText}>{globalError}</Text>
        </View>
      )}

      {/* Add number button */}
      {values.length < MAX_NUMBERS && (
        <Pressable onPress={addNumber} style={styles.addBtn}>
          <Feather name="plus" size={15} color={colors.primary} />
          <Text style={styles.addBtnText}>Add another number</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  entryCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
    // DS §8.1 card shadow
    shadowColor: "#302950",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryCardPrimary: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.primary + "22",
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  primaryBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  primaryDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
  },
  primaryDotActive: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: colors.textMuted,
  },
  primaryLabelActive: {
    color: colors.primary,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneRow: {
    gap: 4,
  },
  labelRow: {
    gap: 6,
  },
  fieldMeta: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  fieldError: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.error,
    marginTop: 2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  chipTextActive: {
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: -0.1,
  },
  // DS §8.7 toggle
  toggle: {
    width: 40,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: colors.success,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignSelf: "flex-start",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  globalErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  globalErrorText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.error,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary + "33",
    borderStyle: "dashed",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.primary,
    letterSpacing: -0.1,
  },
});
