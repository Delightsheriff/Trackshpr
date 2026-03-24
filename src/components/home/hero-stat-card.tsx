import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { font, radius } from "@/src/constants/tokens";
import { DUMMY_STATS } from "./home-types";

export function HeroStatCard() {
  return (
    <View style={styles.heroCardShadow}>
      <LinearGradient
        colors={["#4647D3", "#5354e8", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Today&apos;s Deliveries</Text>
          <Text style={styles.heroNum}>{DUMMY_STATS.total}</Text>
          <Text style={styles.heroSub}>↑ 3 more than yesterday</Text>
        </View>
        <View style={styles.heroIconWrap}>
          <Feather name="truck" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCardShadow: {
    borderRadius: radius.card,
    marginBottom: 10,
    shadowColor: "#4647D3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: "#4647D3",
  },
  heroCard: {
    borderRadius: radius.card,
    padding: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  heroOrb1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30,
    right: -20,
  },
  heroOrb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    right: 40,
  },
  heroLeft: { zIndex: 1 },
  heroLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.60)",
    marginBottom: 4,
  },
  heroNum: {
    fontSize: 40,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -1.6,
    color: "#FFFFFF",
    lineHeight: 44,
  },
  heroSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.50)",
    marginTop: 4,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
