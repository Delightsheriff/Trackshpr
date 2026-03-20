/**
 * Floating glassmorphic delivery card shown in the sign-in hero.
 * Matches the HTML reference exactly — blink animation owned internally.
 */
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { font, radius } from "@/src/constants/tokens";

// ── Progress labels — first 3 active, last inactive (matches HTML .active) ──
const LABELS: { text: string; active: boolean }[] = [
  { text: "Confirmed", active: true },
  { text: "Picked Up", active: true },
  { text: "Transit",   active: true },
  { text: "Delivered", active: false },
];

export default function DeliveryCard() {
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 750 }),
        withTiming(0.3, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, []);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.orderLabel}>Order #TRK-2847</Text>
        <View style={styles.statusPill}>
          <Animated.View style={[styles.statusDot, blinkStyle]} />
          <Text style={styles.statusText}>In Transit</Text>
        </View>
      </View>

      {/* Order info */}
      <Text style={styles.orderName}>Ankara Tote Bag × 2</Text>
      <Text style={styles.dest}>→ Lekki Phase 1, Lagos</Text>

      {/* Progress track */}
      <View style={styles.trackWrapper}>
        <View style={styles.track}>
          <LinearGradient
            colors={["#4647D3", "#9396FF"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fill}
          />
        </View>
        {/* Rider bubble — positioned at 65% */}
        <View style={styles.riderBubble}>
          <Text style={{ fontSize: 11 }}>🚴</Text>
        </View>
      </View>

      {/* Progress labels */}
      <View style={styles.labelsRow}>
        {LABELS.map(({ text, active }) => (
          <Text
            key={text}
            style={[
              styles.progressLabel,
              { color: active ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)" },
            ]}
          >
            {text}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  orderLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.08 * 10,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.50)",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,135,58,0.20)",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: "#4ade80",
  },
  statusText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.04 * 10,
    color: "#4ade80",
  },

  // Order info
  orderName: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.15,
    marginBottom: 4,
  },
  dest: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.50)",
    marginBottom: 16,
  },

  // Progress track
  trackWrapper: {
    height: 22,
    justifyContent: "center",
    marginBottom: 10,
  },
  track: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "65%",
    borderRadius: radius.full,
  },
  riderBubble: {
    position: "absolute",
    left: "65%",
    marginLeft: -11,
    width: 22,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(70,71,211,0.40)",
  },

  // Labels
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 9,
    fontFamily: font.sans.regular,
    fontWeight: "500",
    letterSpacing: 0.04 * 9,
  },
});
