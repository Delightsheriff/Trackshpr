/**
 * Global toast overlay — rendered in the tabs layout above all content.
 * Reads from useToastStore. DS §11.3.
 */
import { font, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ToastOverlay() {
  const { toast, hide } = useToastStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!toast) return;
    translateY.value = -20;
    opacity.value = 0;
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 300 });
    const t = setTimeout(() => {
      translateY.value = withTiming(-20, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      setTimeout(hide, 200);
    }, 3000);
    return () => clearTimeout(t);
  }, [toast?.id]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  const TYPE_CONFIG = {
    success: { bg: colors.successBg, color: colors.success, prefix: "✅" },
    error:   { bg: colors.errorBg,   color: colors.error,   prefix: "❌" },
    info:    { bg: colors.infoBg,    color: colors.info,    prefix: "📦" },
  };

  const cfg = TYPE_CONFIG[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { top: insets.top + 16, backgroundColor: cfg.bg },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: cfg.color }]}>
        {cfg.prefix}
        {"  "}
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  text: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
