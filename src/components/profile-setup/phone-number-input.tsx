/**
 * PhoneNumberInput — country code prefix + national number input.
 *
 * - Auto-detects country from device locale (expo-localization) → falls back NG
 * - User types in national format; output is always E.164 or empty string
 * - Validates with libphonenumber-js on blur
 */
import CountryPickerSheet, { Country } from "./country-picker-sheet";
import { getCountries, getCountryCallingCode, parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import * as Localization from "expo-localization";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, font, radius } from "@/src/constants/tokens";

function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function detectCountryCode(): CountryCode {
  try {
    const region = Localization.getLocales()[0]?.regionCode;
    if (region && getCountries().includes(region as CountryCode)) {
      return region as CountryCode;
    }
  } catch {}
  return "NG"; // default: Nigeria
}

/**
 * Parse E.164 string back to { countryCode, nationalNumber } for display.
 * Returns null if the string is not a valid E.164 number.
 */
function splitE164(
  e164: string,
): { countryCode: CountryCode; nationalNumber: string } | null {
  if (!e164.startsWith("+")) return null;
  try {
    const parsed = parsePhoneNumber(e164);
    if (!parsed?.country) return null;
    return {
      countryCode: parsed.country as CountryCode,
      nationalNumber: parsed.formatNational().replace(/\D/g, " ").trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Attempt to normalise a national number + country to E.164.
 * Returns null if the number is incomplete or invalid.
 */
function toE164(national: string, country: CountryCode): string | null {
  try {
    const parsed = parsePhoneNumber(national, country);
    return parsed?.isValid() ? parsed.format("E.164") : null;
  } catch {
    return null;
  }
}

interface PhoneNumberInputProps {
  value: string;             // E.164 or ""
  onChange: (e164: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  autoFocus?: boolean;
}

export default function PhoneNumberInput({
  value,
  onChange,
  onBlur,
  hasError,
  autoFocus,
}: PhoneNumberInputProps) {
  const [countryCode, setCountryCode] = useState<CountryCode>(() => {
    if (value) {
      const split = splitE164(value);
      if (split) return split.countryCode;
    }
    return detectCountryCode();
  });

  const [nationalNumber, setNationalNumber] = useState<string>(() => {
    if (value) {
      const split = splitE164(value);
      if (split) return split.nationalNumber;
    }
    return "";
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // When the external value changes (e.g. pre-populate from DB), sync back
  useEffect(() => {
    if (!value) {
      setNationalNumber("");
      return;
    }
    const split = splitE164(value);
    if (split && split.nationalNumber !== nationalNumber) {
      setCountryCode(split.countryCode);
      setNationalNumber(split.nationalNumber);
    }
  }, [value]);

  const handleNationalChange = useCallback(
    (text: string) => {
      setNationalNumber(text);
      // Emit E.164 as the user types (best-effort)
      const e164 = toE164(text, countryCode);
      onChange(e164 ?? "");
    },
    [countryCode, onChange],
  );

  const handleCountrySelect = useCallback(
    (country: Country) => {
      const code = country.code as CountryCode;
      setCountryCode(code);
      // Re-normalise with new country code
      const e164 = toE164(nationalNumber, code);
      onChange(e164 ?? "");
    },
    [nationalNumber, onChange],
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Final normalisation on blur
    const e164 = toE164(nationalNumber, countryCode);
    if (e164) onChange(e164);
    onBlur?.();
  }, [nationalNumber, countryCode, onChange, onBlur]);

  const callingCode = getCountryCallingCode(countryCode);
  const flag = getFlagEmoji(countryCode);

  return (
    <>
      <View
        style={[
          styles.wrap,
          focused && styles.wrapFocused,
          hasError && styles.wrapError,
        ]}
      >
        {/* Country selector */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={styles.countryBtn}
          hitSlop={4}
        >
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.callingCode}>+{callingCode}</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* National number input */}
        <TextInput
          ref={inputRef}
          value={nationalNumber}
          onChangeText={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      {pickerOpen && (
        <CountryPickerSheet
          visible
          selected={countryCode}
          onSelect={handleCountrySelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginHorizontal: -4,
    gap: 8,
    backgroundColor: "transparent",
  },
  wrapFocused: {
    backgroundColor: colors.primarySoft,
  },
  wrapError: {
    backgroundColor: colors.errorBg,
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  flag: {
    fontSize: 18,
    lineHeight: 22,
  },
  callingCode: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.surfaceContainer,
  },
  input: {
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
