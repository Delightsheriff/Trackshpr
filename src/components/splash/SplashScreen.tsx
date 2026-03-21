/**
 * Minimalist splash screen — shown while auth state is being determined.
 * Solid brand dark background. Replace with an image asset when the
 * design system provides a splash image.
 */
import { View, Text } from "react-native";

const BRAND_BG = "#0e0c1a";

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_BG, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 28 }}>📦</Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: "DMSans_600SemiBold",
          fontWeight: "600",
          letterSpacing: 1.56,
          textTransform: "uppercase",
          color: "#6366F1",
          marginTop: 12,
        }}
      >
        Trackshpr
      </Text>
    </View>
  );
}
