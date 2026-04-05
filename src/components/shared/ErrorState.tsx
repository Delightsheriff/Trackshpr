/**
 * ErrorState — generic error + retry component.
 * Design system: DS §11.1
 *
 * Usage:
 *   <ErrorState title="Couldn't load orders" message="Pull down to try again." onRetry={refetch} />
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

interface ErrorStateProps {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState = React.memo(function ErrorState({
  icon = "alert-circle",
  title,
  message,
  retryLabel = "Try Again",
  onRetry,
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.errorBg }]}>
        <Feather name={icon} size={28} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryWrap, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retry}
          >
            <Text style={styles.retryText}>{retryLabel}</Text>
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
    width: 56,
    height: 56,
    borderRadius: 18,
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
  message: {
    fontSize: 14,
    fontFamily: font.sans.regular,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
    marginTop: -4,
  },
  retryWrap: {
    marginTop: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  retry: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: radius.full,
    alignItems: "center",
  },
  retryText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.15,
  },
});
