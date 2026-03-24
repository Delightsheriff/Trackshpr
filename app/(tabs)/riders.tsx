/**
 * Riders tab — real data via TanStack Query (DS §8.8).
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useRiders, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SwipeableRiderCard } from "@/src/components/riders/swipeable-rider-card";

// ── Skeleton card ──────────────────────────────────────────────────────────────
function RiderSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surfaceCard }]}>
      <View style={[sk.avatar, { backgroundColor: colors.surfaceContainer }]} />
      <View style={sk.body}>
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "55%" }]} />
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "35%", marginTop: 6 }]} />
        <View style={[sk.badge, { backgroundColor: colors.surfaceContainer, marginTop: 8 }]} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: layout.cardPadding, gap: 12, marginBottom: layout.listGap },
  avatar: { width: 44, height: 44, borderRadius: radius.full, flexShrink: 0 },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6 },
  badge: { height: 18, width: 80, borderRadius: radius.full },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function RidersScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToastStore();
  const [query, setQuery] = useState("");

  const { userId } = useSession();
  const { data: riders = [], isLoading, isError } = useRiders(userId);

  useEffect(() => {
    if (isError) showToast("Could not load riders. Pull to refresh.", "error");
  }, [isError, showToast]);

  const searchBarShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 };

  const filtered = riders.filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + layout.screenPaddingTop, paddingBottom: 96 },
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
            {isLoading ? "Loading…" : `${riders.length} saved · Swipe to delete`}
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

        {/* ── Content ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <>
            <RiderSkeleton colors={colors} />
            <RiderSkeleton colors={colors} />
            <RiderSkeleton colors={colors} />
          </>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather
              name="user"
              size={36}
              color={colors.primary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {query ? "No riders found" : "No riders yet"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {query
                ? "Try a different name."
                : "Add your first rider to start assigning deliveries."}
            </Text>
          </View>
        ) : (
          filtered.map((rider, i) => (
            <SwipeableRiderCard key={rider.id} rider={rider} colorIdx={i} />
          ))
        )}

      </ScrollView>

      {/* ── FAB — always visible above the tab bar ────────────────────── */}
      <View style={[styles.fab, { shadowColor: colors.primary }]}>
        <Pressable
          onPress={() => router.push("/(modals)/add-rider")}
          style={styles.fabPressable}
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.fabText}>Add Rider</Text>
          </LinearGradient>
        </Pressable>
      </View>
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

  fab: {
    position: "absolute",
    bottom: 16,
    left: layout.screenPaddingH,
    right: layout.screenPaddingH,
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  fabPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.full,
    paddingVertical: 14,
  },
  fabText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#fff",
  },

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
