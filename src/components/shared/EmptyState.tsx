/**
 * EmptyState — generic empty list / zero-data screen section.
 * Design system: DS §11.2
 *
 * Usage:
 *   <EmptyState icon="package" title="No deliveries yet" subtitle="Create your first delivery." ctaLabel="New Delivery" onCta={...} />
 */
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/src/stores/themeStore";
import { font, gradients, radius } from "@/src/constants/tokens";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Feather name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [styles.ctaWrap, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: font.sans.regular,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
    marginTop: -4,
  },
  ctaWrap: {
    marginTop: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  cta: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: radius.full,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.15,
  },
});
