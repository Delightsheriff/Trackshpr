/**
 * Global toast overlay — rendered in root layout above all content.
 * Reads from useToastStore. DS §11.3.
 */
import { font, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof Feather>["name"];

const TYPE_CONFIG: Record<
  "success" | "error" | "info",
  { icon: IconName; getColors: (c: ReturnType<typeof useTheme>["colors"]) => { bg: string; fg: string } }
> = {
  success: {
    icon: "check-circle",
    getColors: (c) => ({ bg: c.successBg, fg: c.success }),
  },
  error: {
    icon: "x-circle",
    getColors: (c) => ({ bg: c.errorBg, fg: c.error }),
  },
  info: {
    icon: "info",
    getColors: (c) => ({ bg: c.infoBg, fg: c.info }),
  },
};

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

  const cfg = TYPE_CONFIG[toast.type];
  const { bg, fg } = cfg.getColors(colors);

  return (
    <Animated.View
      style={[styles.toast, { top: insets.top + 16, backgroundColor: bg }, animStyle]}
      pointerEvents="none"
    >
      <View style={styles.row}>
        <Feather name={cfg.icon} size={15} color={fg} style={styles.icon} />
        <Text style={[styles.message, { color: fg }]} numberOfLines={2}>
          {toast.message}
        </Text>
      </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
});
