/**
 * Sign-in screen — always dark, brand entry point (DS §9.2)
 * Google OAuth via expo-auth-session → supabase.auth.signInWithIdToken
 */
import {
  colors,
  font,
  radius,
  signInColors,
  type as t,
} from "@/src/constants/tokens";
import { supabase } from "@/src/lib/supabase";
import { AntDesign } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
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
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 260;
const PROGRESS_LABELS = ["Confirmed", "Picked Up", "Transit", "Delivered"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroH = height * 0.58;

  // ── Auth state ──
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shared values ──
  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(0);
  const orbit3 = useSharedValue(0);
  const float = useSharedValue(0);
  const blink = useSharedValue(1);
  const toastY = useSharedValue(-20);
  const toastOp = useSharedValue(0);

  // Content entrance
  const w0 = useSharedValue(0);
  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);
  const w3 = useSharedValue(0);
  const w4 = useSharedValue(0);

  // ── Google OAuth ──
  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // ── Start animations on mount ──
  useEffect(() => {
    orbit1.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
    );
    orbit2.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
    );
    orbit3.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.3, { duration: 750 }),
      ),
      -1,
      true,
    );

    // Staggered content entrance
    w0.value = withDelay(200, withTiming(1, { duration: 500 }));
    w1.value = withDelay(350, withTiming(1, { duration: 500 }));
    w2.value = withDelay(450, withTiming(1, { duration: 500 }));
    w3.value = withDelay(550, withTiming(1, { duration: 500 }));
    w4.value = withDelay(650, withTiming(1, { duration: 500 }));

    return () => {
      cancelAnimation(orbit1);
      cancelAnimation(orbit2);
      cancelAnimation(orbit3);
      cancelAnimation(float);
      cancelAnimation(blink);
    };
  }, []);

  // ── Handlers ──
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

  const handleGoogleSignIn = useCallback(
    async (idToken?: string | null) => {
      if (!idToken) {
        showToast("Couldn't get credentials from Google. Try again.");
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) throw error;

        const user = data.user;
        if (!user) throw new Error("No user returned.");

        // Check profile — RLS policy should use (select auth.uid()) = id
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id, onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;

        if (!profile || !profile.onboarding_complete) {
          router.replace("/(auth)/profile-setup");
        } else {
          router.replace("/(tabs)");
        }
      } catch {
        showToast("Couldn't sign in. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.idToken);
    } else if (response?.type === "error") {
      showToast("Couldn't sign in with Google. Try again.");
    }
  }, [response, handleGoogleSignIn, showToast]);

  // ── Animated styles ──
  const orbit1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit1.value}deg` }],
  }));
  const orbit2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit2.value}deg` }],
  }));
  const orbit3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit3.value}deg` }],
  }));
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOp.value,
    transform: [{ translateY: toastY.value }],
  }));

  const entrance = (sv: ReturnType<typeof useSharedValue<number>>) =>
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

  // ── Geometry ──
  const cx = width / 2;
  const cy = heroH / 2;

  const orbitRing = (size: number, borderColor: string) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1,
    borderColor,
    left: cx - size / 2,
    top: cy - size / 2,
  });

  // ── Render ──
  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <View style={[styles.hero, { height: heroH }]}>
        {/* Background gradient layers (approximating HTML radial gradients) */}
        <LinearGradient
          colors={[signInColors.heroGradBase, signInColors.heroBg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[signInColors.heroPurpleBloom, "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { height: heroH * 0.65 }]}
        />
        <LinearGradient
          colors={[signInColors.heroRightAccent, "transparent"]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { top: heroH * 0.2, height: heroH * 0.7 },
          ]}
        />

        {/* Orbit rings — outermost first */}
        <Animated.View
          style={[orbitRing(380, signInColors.orbitRingOuter), orbit3Style]}
          pointerEvents="none"
        >
          <View style={styles.orbitDot} />
        </Animated.View>
        <Animated.View
          style={[orbitRing(280, signInColors.orbitRing), orbit2Style]}
          pointerEvents="none"
        >
          <View style={styles.orbitDot} />
        </Animated.View>
        <Animated.View
          style={[orbitRing(180, signInColors.orbitRing), orbit1Style]}
          pointerEvents="none"
        >
          <View style={styles.orbitDot} />
        </Animated.View>

        {/* Floating delivery card */}
        <Animated.View
          style={[
            styles.card,
            { left: cx - CARD_W / 2, top: cy - 95, width: CARD_W },
            floatStyle,
          ]}
        >
          {/* Card header row */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardOrderLabel}>Order #TRK-2847</Text>
            <View style={styles.statusPill}>
              <Animated.View style={[styles.statusDot, blinkStyle]} />
              <Text style={styles.statusText}>In Transit</Text>
            </View>
          </View>

          {/* Order name */}
          <Text style={styles.cardOrderName}>Ankara Tote Bag × 2</Text>

          {/* Destination */}
          <Text style={styles.cardDest}>→ Lekki Phase 1, Lagos</Text>

          {/* Progress track */}
          <View style={styles.progressWrapper}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressFill}
              />
            </View>
            <View style={styles.progressRider}>
              <Text style={{ fontSize: 11 }}>🚴</Text>
            </View>
          </View>

          {/* Progress labels */}
          <View style={styles.progressLabels}>
            {PROGRESS_LABELS.map((label, i) => (
              <Text
                key={label}
                style={[
                  styles.progressLabel,
                  {
                    color:
                      i < 3
                        ? signInColors.progressLabelActive
                        : signInColors.progressLabel,
                  },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
        </Animated.View>

        {/* Hero → panel blend */}
        <LinearGradient
          colors={["transparent", colors.surface]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroFade}
          pointerEvents="none"
        />
      </View>

      {/* ── Content panel ──────────────────────────────────────────── */}
      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
      >
        {/* Wordmark */}
        <Animated.View style={w0Style}>
          <Text style={styles.wordmark}>Trackshpr</Text>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={w1Style}>
          <Text style={styles.headline}>
            {"Your riders move.\n"}
            <Text style={{ color: colors.primary }}>
              Your customers know.
            </Text>
          </Text>
        </Animated.View>

        {/* Sub */}
        <Animated.View style={w2Style}>
          <Text style={styles.sub}>
            Real-time delivery visibility for Nigerian social commerce sellers.
            No more &ldquo;where is my order?&rdquo; messages.
          </Text>
        </Animated.View>

        {/* Google sign-in button */}
        <Animated.View style={[styles.googleBtnWrap, w3Style]}>
          <Pressable
            onPress={() => !loading && promptAsync()}
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
                {/* AntDesign google icon — replace with react-native-svg for multicolor G */}
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Legal */}
        <Animated.View style={w4Style}>
          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text style={styles.legalLink}>Terms of Service</Text>
            {"\n"}and <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>

      {/* ── Error toast ────────────────────────────────────────────── */}
      {toastMsg !== null && (
        <Animated.View
          style={[styles.toast, { top: insets.top + 16 }, toastStyle]}
        >
          <Text style={[t.bodySm, { color: colors.error }]}>
            ❌{"  "}{toastMsg}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ── Hero ──
  hero: {
    overflow: "hidden",
    backgroundColor: signInColors.heroBg,
  },
  orbitDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: signInColors.orbitDot,
    top: -3,
    left: "50%",
    marginLeft: -3,
  },

  // ── Delivery card ──
  card: {
    position: "absolute",
    backgroundColor: signInColors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: signInColors.cardBorder,
    padding: 18,
    paddingHorizontal: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardOrderLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.08 * 10,
    textTransform: "uppercase",
    color: signInColors.cardLabel,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: signInColors.statusBg,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: signInColors.statusText,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.04,
    color: signInColors.statusText,
  },
  cardOrderName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: font.sans.bold,
    color: colors.white,
    letterSpacing: -0.15,
    marginBottom: 4,
  },
  cardDest: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: signInColors.cardDest,
    marginBottom: 16,
  },

  // ── Progress bar ──
  progressWrapper: {
    height: 24,
    justifyContent: "center",
    marginBottom: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: signInColors.progressTrack,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "65%",
  },
  progressRider: {
    position: "absolute",
    left: "65%",
    marginLeft: -11,
    width: 22,
    height: 22,
    backgroundColor: colors.white,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(70, 71, 211, 0.40)",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: "500",
    fontFamily: font.sans.regular,
    letterSpacing: 0.04,
  },

  // ── Hero fade ──
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // ── Content panel ──
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "flex-end",
  },
  wordmark: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
    letterSpacing: 1.56,
    textTransform: "uppercase",
    color: colors.primary,
    marginBottom: 10,
  },
  headline: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: font.sans.bold,
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
    fontWeight: "600",
    fontFamily: font.sans.semiBold,
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

  // ── Toast ──
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
