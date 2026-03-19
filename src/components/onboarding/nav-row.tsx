import {
  animation,
  colors,
  gradients,
  onboardingColors,
  radius,
  shadows,
  type,
} from "@/src/constants/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type NavVariant = "dark" | "light";

interface AnimatedDotProps {
  isActive: boolean;
  variant: NavVariant;
}

function AnimatedDot({ isActive, variant }: AnimatedDotProps) {
  const animStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 20 : 5, { duration: animation.timing.normal }),
    backgroundColor: withTiming(
      isActive
        ? colors.primary
        : variant === "dark"
          ? onboardingColors.dotInactiveDark
          : onboardingColors.dotInactiveLight,
      { duration: animation.timing.normal },
    ),
  }));

  return (
    <Animated.View
      style={[{ height: 5, borderRadius: radius.full }, animStyle]}
    />
  );
}

interface NavRowProps {
  variant: NavVariant;
  activeIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export default function NavRow({
  variant,
  activeIndex,
  onNext,
  onSkip,
  onComplete,
}: NavRowProps) {
  const isLast = activeIndex === 2;
  const skipColor =
    variant === "dark" ? onboardingColors.skipDark : colors.textMuted;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Skip — hidden on last slide, spacer keeps layout stable */}
      {isLast ? (
        <View style={{ width: 52 }} />
      ) : (
        <Pressable
          onPress={onSkip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[type.bodySm, { color: skipColor }]}>Skip</Text>
        </Pressable>
      )}

      {/* Dots */}
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <AnimatedDot key={i} isActive={activeIndex === i} variant={variant} />
        ))}
      </View>

      {/* CTA Button */}
      <Pressable
        onPress={isLast ? onComplete : onNext}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <LinearGradient
          colors={isLast ? gradients.success : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.full,
            paddingVertical: 13,
            paddingHorizontal: 22,
            ...(isLast ? shadows.fabSuccess : shadows.fab),
          }}
        >
          <Text style={[type.labelMd, { color: colors.white }]}>
            {isLast ? "Let's go →" : "Next →"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
