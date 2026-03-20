/**
 * Riders tab — swipeable rider list, add button (DS §8.8).
 * TODO: replace DUMMY_RIDERS with real Supabase query.
 * TODO: wire Add Rider / Delete sheet to real API.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { useDataStore } from "@/src/stores/dataStore";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Riders come from dataStore — shared with add-rider / delete-rider modals.

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ── Swipeable Rider Card ──────────────────────────────────────────────────────
const SWIPE_THRESHOLD = -80;

function SwipeableRiderCard({
  rider,
  colorIdx,
}: {
  rider: { id: string; name: string; phone: string; delivered: number; failed: number };
  colorIdx: number;
}) {
  const { colors, isDark } = useTheme();

  // Avatar color cycling — computed inside component so they use live tokens
  const avatarColors = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg,   fg: colors.success },
    { bg: colors.warningBg,   fg: colors.warning },
  ];

  const cardShadow = isDark
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: 'rgba(48,41,80,1)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

  const translateX  = useSharedValue(0);
  const isSwiped    = useSharedValue(false);
  const avatarColor = avatarColors[colorIdx % avatarColors.length];

  const handleDelete = () => {
    // snap back first, then open delete sheet
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    isSwiped.value = false;
    router.push({ pathname: "/(modals)/delete-rider", params: { id: rider.id, name: rider.name } });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (!isSwiped.value) {
        translateX.value = Math.max(Math.min(e.translationX, 0), SWIPE_THRESHOLD);
      } else {
        translateX.value = Math.max(
          Math.min(e.translationX + SWIPE_THRESHOLD, 0),
          SWIPE_THRESHOLD
        );
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD / 2) {
        translateX.value = withSpring(SWIPE_THRESHOLD, { damping: 20, stiffness: 300 });
        isSwiped.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        isSwiped.value = false;
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.swipeContainer}>
      {/* Delete zone — revealed behind card on swipe */}
      <Pressable
        style={[styles.deleteZone, { backgroundColor: colors.error }]}
        onPress={handleDelete}
      >
        <Feather name="trash-2" size={20} color="#fff" />
        <Text style={[styles.deleteLabel, { color: "rgba(255,255,255,0.85)" }]}>Delete</Text>
      </Pressable>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.riderCard, { backgroundColor: colors.surfaceCard }, cardShadow, cardStyle]}>
          {/* Tap zone to open rider detail */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => router.push({ pathname: "/(screens)/rider-detail", params: { id: rider.id } })}
          />
          {/* Avatar */}
          <View style={[styles.riderAvatar, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.riderAvatarText, { color: avatarColor.fg }]}>
              {initials(rider.name)}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.riderBody}>
            <Text style={[styles.riderName, { color: colors.textPrimary }]}>{rider.name}</Text>
            <Text style={[styles.riderPhone, { color: colors.textMuted }]}>{rider.phone}</Text>
            <View style={styles.riderStats}>
              <View style={[styles.statBadge, { backgroundColor: colors.successBg }]}>
                <Text style={[styles.statBadgeText, { color: colors.success }]}>
                  {rider.delivered} delivered
                </Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.statBadgeText, { color: colors.textSecondary }]}>{rider.failed} failed</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.riderActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.successBg }]}
              android_ripple={{ color: colors.success, borderless: false }}
            >
              <Feather name="phone" size={16} color={colors.success} />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
              android_ripple={{ color: colors.textMuted, borderless: false }}
            >
              <Feather name="more-horizontal" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function RidersScreen() {
  const { colors, isDark } = useTheme();
  const insets  = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const riders  = useDataStore((s) => s.riders);

  const searchBarShadow = isDark
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: 'rgba(48,41,80,1)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 };

  const filtered = riders.filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Riders</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>{riders.length} saved · Swipe to delete</Text>
        </View>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard }, searchBarShadow]}>
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
            <Text style={styles.emptyIcon}>🚴</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No riders found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {query ? "Try a different name." : "Save your frequent riders to assign them faster."}
            </Text>
          </View>
        ) : (
          filtered.map((rider, i) => (
            <SwipeableRiderCard
              key={rider.id}
              rider={rider}
              colorIdx={i}
            />
          ))
        )}

        {/* ── Add Rider button ──────────────────────────────────────────── */}
        <View style={[styles.addBtnShadow, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.push("/(modals)/add-rider")}
            style={styles.addBtnPressable}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtn}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={[styles.addBtnText, { color: "#fff" }]}>Add Rider</Text>
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

  // Swipe container
  swipeContainer: {
    position: "relative",
    marginBottom: layout.listGap,
    borderRadius: radius.xl,
    overflow: "hidden",
  },

  // Delete zone
  deleteZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  deleteLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.36,
    textTransform: "uppercase",
  },

  // Rider card
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  riderAvatarText: {
    fontSize: 16,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  riderBody: { flex: 1, minWidth: 0 },
  riderName: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  riderPhone: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 2,
  },
  riderStats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  statBadge: {
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statBadgeText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  riderActions: {
    flexDirection: "column",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  emptyIcon: { fontSize: 40, marginBottom: 4 },
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
