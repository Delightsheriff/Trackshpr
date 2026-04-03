/**
 * CountryPickerSheet - searchable list of countries with calling codes.
 * Uses a plain React Native modal to keep the import path stable.
 */
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";

export interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

let cachedCountries: Country[] | null = null;

function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

function getCountryName(code: string): string {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
      return displayNames.of(code) ?? code;
    }
  } catch {
    // Fallback to the ISO code when regional display names are unavailable.
  }

  return code;
}

function getAllCountries(): Country[] {
  if (cachedCountries) {
    return cachedCountries;
  }

  cachedCountries = getCountries()
    .map((code) => ({
      code,
      name: getCountryName(code),
      callingCode: getCountryCallingCode(code),
      flag: getFlagEmoji(code),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return cachedCountries;
}

interface CountryPickerSheetProps {
  visible: boolean;
  selected: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export default function CountryPickerSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: CountryPickerSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filteredCountries = useMemo(() => {
    const countries = getAllCountries();
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.callingCode.includes(normalizedQuery) ||
        country.code.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          />

          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surfaceContainer },
            ]}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setQuery("");
                  onClose();
                }}
                style={[
                  styles.row,
                  item.code === selected && {
                    backgroundColor: colors.primarySoft,
                  },
                ]}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text
                  style={[styles.name, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.code, { color: colors.textMuted }]}>
                  +{item.callingCode}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.36)",
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "72%",
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: 12,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    fontSize: 15,
    fontFamily: font.sans.regular,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  flag: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.sans.regular,
  },
  code: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    minWidth: 44,
    textAlign: "right",
  },
});
