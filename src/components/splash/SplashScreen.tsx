/**
 * Brand splash screen — shown while auth state is being determined.
 * Always dark background (brand entry point), per DS §9.2.
 */
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const BRAND_BG   = "#0e0c1a";
const ORB_COLOR = "rgba(147, 150, 255, 0.18)";
const WORDMARK_COLOR = "#6366F1";
const DOT_COLOR = "#9396FF";

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_BG }}>
      {/* Gradient background */}
      <LinearGradient
        colors={["#0e0c1a", "#1a1840", "#252070"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />

      {/* Decorative orb */}
      <View
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: ORB_COLOR,
          top: "20%",
          right: "10%",
          opacity: 0.6,
        }}
      />

      {/* Brand mark */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Logo icon */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            borderWidth: 1,
            borderColor: "rgba(147, 150, 255, 0.3)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 28 }}>📦</Text>
        </View>

        {/* Wordmark */}
        <Text
          style={{
            fontSize: 13,
            fontFamily: "DMSans_600SemiBold",
            fontWeight: "600",
            letterSpacing: 1.56,
            textTransform: "uppercase",
            color: WORDMARK_COLOR,
            marginBottom: 10,
          }}
        >
          Trackshpr
        </Text>

        {/* Animated dots */}
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: DOT_COLOR,
                opacity: 0.5,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
