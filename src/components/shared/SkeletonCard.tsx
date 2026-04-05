/**
 * SkeletonCard — shimmer loading placeholder.
 * Design system: DS §8.9
 *
 * Shimmer animates left → right, 1.6s ease-in-out infinite.
 * Shapes must match real content dimensions to prevent layout shift on load.
 *
 * Usage:
 *   <SkeletonCard height={80} borderRadius={18} />
 *   <SkeletonCard width={120} height={16} borderRadius={8} />
 */
import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/stores/themeStore";

interface SkeletonCardProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard = React.memo(function SkeletonCard({
  width = "100%",
  height,
  borderRadius = 12,
  style,
}: SkeletonCardProps) {
  const { isDark } = useTheme();

  const shimmerColors = isDark
    ? (["#1a1828", "#252338", "#1a1828"] as const)
    : (["#ECE4FF", "#E0D6F5", "#ECE4FF"] as const);

  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(300, {
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-300, { duration: 0 })
      ),
      -1,
      false
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        isDark
          ? { backgroundColor: "#1a1828" }
          : { backgroundColor: "#ECE4FF" },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={shimmerColors as unknown as [string, string, string]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
