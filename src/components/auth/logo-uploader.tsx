/**
 * Circular logo/avatar uploader for the profile setup screen.
 * Shows a placeholder, local preview, or upload spinner.
 */
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radius } from "@/src/constants/tokens";

interface LogoUploaderProps {
  uri: string | null;
  uploading: boolean;
  onPress: () => void;
}

export default function LogoUploader({ uri, uploading, onPress }: LogoUploaderProps) {
  const badgeBg = uri
    ? uploading
      ? colors.primary
      : colors.success
    : colors.primary;

  return (
    <Pressable onPress={onPress} style={[styles.wrap, uri && styles.wrapFilled]}>
      {uploading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <>
          <Text style={styles.emoji}>🏪</Text>
          <Text style={styles.label}>Add logo</Text>
        </>
      )}

      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={styles.badgeText}>{uri && !uploading ? "✓" : "+"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surfaceCard,
    borderWidth: 3,
    borderColor: colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    boxShadow: "0 4px 20px rgba(48, 41, 80, 0.15)",
  },
  wrapFilled: {
    backgroundColor: "#FFF7ED",
  },
  image: {
    width: 66,
    height: 66,
    borderRadius: 20,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.primary,
    letterSpacing: 0.36,
    textTransform: "uppercase",
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    boxShadow: "0 2px 8px rgba(70, 71, 211, 0.40)",
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
});
