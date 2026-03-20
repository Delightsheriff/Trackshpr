/**
 * Sign-in screen — always dark, brand entry point (DS §9.2).
 * Auth logic lives in src/lib/auth.ts; hero visuals in src/components/auth/.
 */
import {
  colors,
  font,
  gradients,
  radius,
  type as t,
} from "@/src/constants/tokens";
import { signInWithGoogle } from "@/src/lib/auth";
import { supabase } from "@/src/lib/supabase";
import SignInHero from "@/src/components/auth/sign-in-hero";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroH = height * 0.58;

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Content entrance animations
  const w0 = useSharedValue(0);
  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);
  const w3 = useSharedValue(0);
  const w4 = useSharedValue(0);

  // Toast animation
  const toastY = useSharedValue(-20);
  const toastOp = useSharedValue(0);

  useEffect(() => {
    w0.value = withDelay(200, withTiming(1, { duration: 500 }));
    w1.value = withDelay(350, withTiming(1, { duration: 500 }));
    w2.value = withDelay(450, withTiming(1, { duration: 500 }));
    w3.value = withDelay(550, withTiming(1, { duration: 500 }));
    w4.value = withDelay(650, withTiming(1, { duration: 500 }));
  }, []);

  const entrance = (sv: { value: number }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [
        { translateY: interpolate(sv.value, [0, 1], [16, 0], Extrapolation.CLAMP) },
      ],
    }));

  const w0Style = entrance(w0);
  const w1Style = entrance(w1);
  const w2Style = entrance(w2);
  const w3Style = entrance(w3);
  const w4Style = entrance(w4);

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOp.value,
    transform: [{ translateY: toastY.value }],
  }));

  const showToast = useCallback(
    (msg: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToastMsg(msg);
      toastY.value = -20;
      toastOp.value = 0;
      toastY.value = withSpring(0, { damping: 20, stiffness: 300 });
      toastOp.value = withTiming(1, { duration: 300 });
      toastTimer.current = setTimeout(() => {
        toastY.value = withTiming(-20, { duration: 200 });
        toastOp.value = withTiming(0, { duration: 200 });
      }, 3000);
    },
    [],
  );

  const handleSignIn = useCallback(async () => {
    setLoading(true);

    const result = await signInWithGoogle();

    if (!result.ok) {
      if ("cancelled" in result) {
        setLoading(false);
        return;
      }
      showToast(result.error);
      setLoading(false);
      return;
    }

    // Auth succeeded — check profile to decide where to navigate
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_complete) {
        router.replace("/(auth)/profile-setup");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      showToast("Couldn't complete sign-in. Please try again.");
      setLoading(false);
    }
  }, [showToast]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <SignInHero width={width} height={heroH} />

      {/* ── Content panel ────────────────────────────────────────────── */}
      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
      >
        <Animated.View style={w0Style}>
          <Text style={styles.wordmark}>Trackshpr</Text>
        </Animated.View>

        <Animated.View style={w1Style}>
          <Text style={styles.headline}>
            {"Your riders move.\n"}
            <Text style={{ color: colors.primary }}>Your customers know.</Text>
          </Text>
        </Animated.View>

        <Animated.View style={w2Style}>
          <Text style={styles.sub}>
            Real-time delivery visibility for Nigerian social commerce sellers.
            No more "where is my order?" messages.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.googleBtnWrap, w3Style]}>
          <Pressable
            onPress={() => !loading && handleSignIn()}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <>
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={w4Style}>
          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text style={styles.legalLink}>Terms of Service</Text>
            {"\n"}and <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>

      {/* ── Error toast ──────────────────────────────────────────────── */}
      {toastMsg !== null && (
        <Animated.View
          style={[styles.toast, { top: insets.top + 16 }, toastStyle]}
        >
          <Text style={[t.bodySm, { color: colors.error }]}>
            ❌{"  "}
            {toastMsg}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "flex-end",
  },
  wordmark: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 1.56,
    textTransform: "uppercase",
    color: colors.primary,
    marginBottom: 10,
  },
  headline: {
    fontSize: 30,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.9,
    lineHeight: 34.5,
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    lineHeight: 21.7,
    marginBottom: 32,
  },
  googleBtnWrap: {
    marginBottom: 16,
  },
  googleBtn: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 54,
    boxShadow:
      "0 2px 12px rgba(48, 41, 80, 0.08), 0 0 0 1px rgba(48, 41, 80, 0.06)",
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  legal: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    lineHeight: 17.6,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    backgroundColor: colors.errorBg,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 100,
  },
});
