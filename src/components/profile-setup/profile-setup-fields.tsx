import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, font, radius } from "@/src/constants/tokens";

export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.fieldGroup}>{children}</View>;
}

export function FieldRow({
  icon,
  iconBg,
  label,
  required,
  hasError,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  label: string;
  required?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.inputRow}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={16} color={colors.textPrimary} />
      </View>
      <View style={styles.inputInner}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.fieldLabel,
              hasError && required && { color: colors.error },
            ]}
          >
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
        {children}
      </View>
    </View>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  prefix,
  multiline,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  prefix?: string;
  multiline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.textFieldWrap,
        focused && styles.textFieldWrapFocused,
      ]}
    >
      {prefix && <Text style={styles.fieldPrefix}>{prefix}</Text>}
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.textInput,
          multiline && { height: 72, textAlignVertical: "top" as const },
        ]}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );
}

export function RowDivider() {
  return <View style={styles.rowDivider} />;
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldGroup: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginLeft: 62,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputInner: { flex: 1 },
  labelRow: {
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  requiredAsterisk: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.error,
  },
  textFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: -10,
    backgroundColor: "transparent",
  },
  textFieldWrapFocused: {
    backgroundColor: colors.primarySoft,
  },
  fieldPrefix: {
    fontSize: 16,
    fontFamily: font.sans.semiBold,
    color: colors.textSecondary,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
});
