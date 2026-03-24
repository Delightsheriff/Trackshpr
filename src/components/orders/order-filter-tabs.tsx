import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font, radius } from "@/src/constants/tokens";
import { FILTER_TABS, FilterKey } from "./order-types";

export function OrderFilterTabs({
  filter,
  setFilter,
}: {
  filter: FilterKey;
  setFilter: (val: FilterKey) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTER_TABS.map(({ key, label }) => {
        const active = filter === key;
        return (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[
              styles.filterTab,
              {
                backgroundColor: active ? colors.primary : colors.surfaceCard,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: active ? colors.white : colors.textMuted },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
    marginBottom: 14,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
