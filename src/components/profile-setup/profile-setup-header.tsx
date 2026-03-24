import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { font, radius, colors } from "@/src/constants/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ProfileSetupHeader() {
  const insets = useSafeAreaInsets();
  
  return (
    <LinearGradient
      colors={["#4647D3", "#5354e8", "#6366f1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top }]}
    >
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.headerContent}>
        <View style={styles.stepTag}>
          <View style={styles.stepTagDot} />
          <Text style={styles.stepTagText}>One-time setup</Text>
        </View>
        <Text style={styles.headerTitle}>
          {"Set up your\nbusiness profile"}
        </Text>
        <Text style={styles.headerSub}>
          Shown on every customer tracking page
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 120,
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  orb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: 24,
  },
  headerContent: {
    padding: 16,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  stepTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stepTagDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  stepTagText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
  },
});
