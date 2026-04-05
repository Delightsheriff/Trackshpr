/**
 * AvatarWithFallback — business/user avatar with gradient initials fallback.
 * Design system: DS §2.3 (avatar gradient), DS §3 (labelMd font)
 *
 * Usage:
 *   <AvatarWithFallback uri={logoUrl} name="Delight's Store" size={42} />
 *   <AvatarWithFallback name="Emeka Musa" size={36} />
 */
import React from "react";
import { Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { font, gradients } from "@/src/constants/tokens";

interface AvatarWithFallbackProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const AvatarWithFallback = React.memo(function AvatarWithFallback({
  uri,
  name,
  size = 40,
  style,
}: AvatarWithFallbackProps) {
  const borderRadius = Math.round(size * 0.33);
  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius }, style]}
        contentFit="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={gradients.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius, alignItems: "center", justifyContent: "center" }, style]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  initials: {
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
});
