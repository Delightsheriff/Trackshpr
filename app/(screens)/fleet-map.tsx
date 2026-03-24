/**
 * Fleet Map screen — full-screen live rider map with floating cards (DS §8.1).
 * TODO: replace FLEET_RIDERS with real Supabase real-time subscription.
 */
import { font, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Dummy data — TODO: replace with real Supabase real-time query ─────────────
// avatarBg/avatarFg intentionally left as static brand values; they are
// overridden with live color tokens inside the component.
const FLEET_RIDERS_RAW = [
  {
    id: "1",
    name: "Kunle",
    initials: "KA",
    lat: 6.455,
    lng: 3.3841,
    status: "in_transit" as const,
    item: "Adire Maxi Dress × 2",
    dest: "Lekki Phase 1",
    time: "12m ago",
    stale: false,
    avatarVariant: "primary" as const,
  },
  {
    id: "2",
    name: "Emeka",
    initials: "EM",
    lat: 6.4698,
    lng: 3.358,
    status: "delivered" as const,
    item: "Beaded Necklace Set",
    dest: "Surulere",
    time: "1h ago",
    stale: false,
    avatarVariant: "success" as const,
  },
  {
    id: "3",
    name: "Taiwo",
    initials: "TJ",
    lat: 6.453,
    lng: 3.395,
    status: "in_transit" as const,
    item: "Ankara Tote Bag",
    dest: "Yaba",
    time: "48m ago",
    stale: true,
    avatarVariant: "warning" as const,
  },
];

type RiderRaw = (typeof FLEET_RIDERS_RAW)[0];

// ── Status pill sub-component ─────────────────────────────────────────────────
function Pill({ status }: { status: string }) {
  const { colors } = useTheme();
  const cfg =
    status === "in_transit"
      ? { bg: colors.infoBg, fg: colors.info, label: "Transit" }
      : status === "delivered"
        ? { bg: colors.successBg, fg: colors.success, label: "Delivered" }
        : { bg: colors.warningBg, fg: colors.warning, label: "Pending" };

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: cfg.fg }]} />
      <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Stale badge ───────────────────────────────────────────────────────────────
function StaleBadge() {
  const { colors } = useTheme();
  return (
    <View style={[styles.staleBadge, { backgroundColor: colors.warningBg }]}>
      <Feather name="alert-triangle" size={10} color={colors.warning} />
      <Text style={[styles.staleBadgeText, { color: colors.warning }]}>
        Stale
      </Text>
    </View>
  );
}

// ── Pulse dot (animated) ──────────────────────────────────────────────────────
function PulseDot() {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 750 }),
        withTiming(1, { duration: 750 }),
      ),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.activeDot,
        { backgroundColor: colors.primary },
        pulseStyle,
      ]}
    />
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function FleetMapScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState(FLEET_RIDERS_RAW[0].id);

  const overlayBg = isDark ? "rgba(15,14,26,0.95)" : "rgba(250,244,255,0.95)";
  const fadeBg = isDark ? "rgba(15,14,26,0.5)" : "rgba(250,244,255,0.5)";

  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 4,
      };

  const iconBtnShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 1,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 1,
      };

  // Resolve avatar colors from live tokens
  const AVATAR_VARIANTS = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
  };

  const FLEET_RIDERS = FLEET_RIDERS_RAW.map((r) => ({
    ...r,
    avatarBg: AVATAR_VARIANTS[r.avatarVariant].bg,
    avatarFg: AVATAR_VARIANTS[r.avatarVariant].fg,
  }));

  type Rider = (typeof FLEET_RIDERS)[0];

  function pinColor(r: Rider): string {
    if (r.stale) return colors.warning;
    if (r.status === "delivered") return colors.success;
    return colors.primary;
  }

  const activeCount = FLEET_RIDERS.filter(
    (r) => r.status === "in_transit",
  ).length;

  function selectRider(r: Rider) {
    setSelectedId(r.id);
    mapRef.current?.animateToRegion(
      {
        latitude: r.lat,
        longitude: r.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Full-screen map ────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 6.458,
          longitude: 3.375,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsCompass={false}
      >
        {FLEET_RIDERS.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.pinBubble, { backgroundColor: pinColor(r) }]}>
              <View style={styles.pinDot} />
              <Feather name="truck" size={10} color={colors.white} />
              <Text style={[styles.pinText, { color: colors.white }]}>
                {r.name}
              </Text>
            </View>
            <View style={[styles.pinTail, { borderTopColor: pinColor(r) }]} />
          </Marker>
        ))}
      </MapView>

      {/* ── Floating header ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top, backgroundColor: overlayBg },
        ]}
      >
        <View style={styles.headerInner}>
          <Pressable
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceCard },
              iconBtnShadow,
            ]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Fleet Map
          </Text>

          <View
            style={[
              styles.activeBadge,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <PulseDot />
            <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
              {activeCount} active
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bottom overlay ────────────────────────────────────────────────── */}
      <View style={styles.bottomOverlay}>
        {/* Soft fade strip above cards */}
        <View style={[styles.fadeStrip, { backgroundColor: fadeBg }]} />

        {/* Cards background */}
        <View
          style={[
            styles.cardsBackground,
            { paddingBottom: insets.bottom + 8, backgroundColor: overlayBg },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {FLEET_RIDERS.map((r) => {
              const isSelected = selectedId === r.id;
              return (
                <Pressable
                  key={r.id}
                  style={[
                    styles.fleetCard,
                    { backgroundColor: colors.surfaceCard },
                    cardShadow,
                    isSelected && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => selectRider(r)}
                >
                  {/* Top row */}
                  <View style={styles.fleetCardTop}>
                    <View style={styles.fleetCardLeft}>
                      {/* Avatar */}
                      <View
                        style={[
                          styles.cardAvatar,
                          { backgroundColor: r.avatarBg },
                        ]}
                      >
                        <Text
                          style={[styles.cardAvatarText, { color: r.avatarFg }]}
                        >
                          {r.initials}
                        </Text>
                      </View>
                      <Text
                        style={[styles.cardName, { color: colors.textPrimary }]}
                      >
                        {r.name}
                      </Text>
                    </View>

                    {/* Status or stale */}
                    {r.stale ? <StaleBadge /> : <Pill status={r.status} />}
                  </View>

                  {/* Item */}
                  <Text
                    style={[styles.cardItem, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {r.item}
                  </Text>

                  {/* Bottom row */}
                  <View style={styles.fleetCardBottom}>
                    <View style={styles.cardDestRow}>
                      <Feather
                        name="map-pin"
                        size={11}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[styles.cardDest, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {r.dest}
                      </Text>
                    </View>
                    <Text
                      style={[styles.cardTime, { color: colors.textMuted }]}
                    >
                      {r.time}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Floating header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Bottom overlay
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  fadeStrip: {
    height: 24,
  },
  cardsBackground: {},
  cardsScroll: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    flexDirection: "row",
  },

  // Fleet card
  fleetCard: {
    width: 200,
    borderRadius: radius.xl,
    padding: 12,
    paddingHorizontal: 14,
  },
  fleetCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fleetCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  cardName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  cardItem: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginBottom: 6,
  },
  fleetCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 4,
  },
  cardDest: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    flex: 1,
  },
  cardTime: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    flexShrink: 0,
  },

  // Status pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    gap: 4,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // Stale badge
  staleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  staleBadgeText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Map pin
  pinBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  pinText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
  },
});
