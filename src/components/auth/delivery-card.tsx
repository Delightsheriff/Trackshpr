/**
 * Floating glassmorphic delivery card shown in the sign-in hero.
 * Owns its own blink animation — float is applied externally by the hero.
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
import { colors, font, radius, signInColors } from "@/src/constants/tokens";

const PROGRESS_LABELS = ["Confirmed", "Picked Up", "Transit", "Delivered"] as const;

export default function DeliveryCard() {
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.3, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, []);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderLabel}>Order #TRK-2847</Text>
        <View style={styles.statusPill}>
          <Animated.View style={[styles.statusDot, blinkStyle]} />
          <Text style={styles.statusText}>In Transit</Text>
        </View>
      </View>

      <Text style={styles.orderName}>Ankara Tote Bag × 2</Text>
      <Text style={styles.dest}>→ Lekki Phase 1, Lagos</Text>

      {/* Progress bar */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.progressFill}
          />
        </View>
        <View style={styles.progressRider}>
          <Text style={{ fontSize: 11 }}>🚴</Text>
        </View>
      </View>

      {/* Labels */}
      <View style={styles.progressLabels}>
        {PROGRESS_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.progressLabel,
              {
                color:
                  i < 3
                    ? signInColors.progressLabelActive
                    : signInColors.progressLabel,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: signInColors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: signInColors.cardBorder,
    padding: 18,
    paddingHorizontal: 20,
  },
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: signInColors.cardLabel,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: signInColors.statusBg,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: signInColors.statusText,
  },
  statusText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: signInColors.statusText,
  },
  orderName: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.15,
    marginBottom: 4,
  },
  dest: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: signInColors.cardDest,
    marginBottom: 16,
  },
  progressWrapper: {
    height: 24,
    justifyContent: "center",
    marginBottom: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: signInColors.progressTrack,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "65%",
  },
  progressRider: {
    position: "absolute",
    left: "65%",
    marginLeft: -11,
    width: 22,
    height: 22,
    backgroundColor: colors.white,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(70, 71, 211, 0.40)",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 9,
    fontFamily: font.sans.regular,
    letterSpacing: 0.04,
  },
});
