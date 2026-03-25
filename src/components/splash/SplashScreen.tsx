import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { font } from "@/src/constants/tokens";

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#4647D3", "#5354e8", "#6366F1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {/* Decorative orbs — same language as hero stat card */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Icon mark */}
        <View style={styles.iconWrap}>
          <Text style={styles.iconLetter}>T</Text>
        </View>

        {/* Wordmark */}
        <Text style={styles.wordmark}>Trackshpr</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Delivery management, simplified</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Decorative orbs ──────────────────────────────────────────────────────────
  orb1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    top: -80,
    right: -80,
  },
  orb2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: 60,
    left: -60,
  },
  orb3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    bottom: -30,
    right: 60,
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  content: {
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconLetter: {
    fontSize: 36,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.1,
  },
});
