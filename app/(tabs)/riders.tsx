/**
 * Riders tab — swipeable rider list, add button (DS §8.8).
 * TODO: replace DUMMY_RIDERS with real Supabase query.
 * TODO: wire Add Rider / Delete sheet to real API.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

// Riders come from dataStore — shared with add-rider / delete-rider modals.

import { SwipeableRiderCard } from "@/src/components/riders/swipeable-rider-card";

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function RidersScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const riders = useDataStore((s) => s.riders);

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

  const filtered = riders.filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + layout.screenPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ─────────────────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            Riders
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            {riders.length} saved · Swipe to delete
          </Text>
        </View>

        {/* ── Search ────────────────────────────────────────────────────── */}
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
            placeholder="Search riders..."
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

        {/* ── Rider list ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather
              name="user"
              size={36}
              color={colors.primary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No riders found
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {query
                ? "Try a different name."
                : "Save your frequent riders to assign them faster."}
            </Text>
          </View>
        ) : (
          filtered.map((rider, i) => (
            <SwipeableRiderCard key={rider.id} rider={rider} colorIdx={i} />
          ))
        )}

        {/* ── Add Rider button ──────────────────────────────────────────── */}
        <View
          style={[styles.addBtnShadow, { backgroundColor: colors.primary }]}
        >
          <Pressable
            onPress={() => router.push("/(modals)/add-rider")}
            style={styles.addBtnPressable}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: false,
            }}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtn}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={[styles.addBtnText, { color: "#fff" }]}>
                Add Rider
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH },

  titleBlock: { paddingTop: 8, marginBottom: 14 },
  pageTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },

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



  // Add rider button
  addBtnShadow: {
    borderRadius: radius.full,
    marginTop: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  addBtnPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.full,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { marginBottom: 4 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
  },
});
