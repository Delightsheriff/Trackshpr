import React from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

export function OrderSearchBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (val: string) => void;
}) {
  const { colors, isDark } = useTheme();

  const searchBarShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      };

  return (
    <View
      style={[
        styles.searchBar,
        { backgroundColor: colors.surfaceCard },
        searchBarShadow,
      ]}
    >
      <Feather name="search" size={15} color={colors.textMuted} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search orders, customers..."
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.textPrimary }]}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <Pressable onPress={() => setQuery("")} hitSlop={8}>
          <Feather name="x" size={14} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.sans.regular,
    padding: 0,
    margin: 0,
  },
});
