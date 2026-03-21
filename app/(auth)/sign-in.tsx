/**
 * Sign-in screen — always dark, brand entry point (DS §9.2).
 *
 * Visual spec (trackshpr-signin.html):
 *  - Hero: 58% height, radial-gradient background, orbit rings, floating card
 *  - Headline: "Your customers know." uses gradient text (#4647D3 → #9396FF 135°)
 *  - Button: real 4-colour Google G logo, pill shape, subtle shadow
 *  - Entrance: staggered fadeUp animation (matches HTML keyframe)
 */
import SignInHero from "@/src/components/auth/sign-in-hero";
import GoogleIcon from "@/src/components/auth/google-icon";
import { colors, font, radius, type as t } from "@/src/constants/tokens";
import { signInWithGoogle } from "@/src/lib/auth";
import { supabase } from "@/src/lib/supabase";
import MaskedView from "@react-native-masked-view/masked-view";
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

// ── Gradient headline text ─────────────────────────────────────────────────────

function GradientText({
  children,
  style,
}: {
  children: string;
  style: object;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={["#4647D3", "#9396FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroH = height * 0.58;

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Staggered content entrance — matches HTML fadeUp keyframe
  const w0 = useSharedValue(0); // wordmark     delay 200ms
  const w1 = useSharedValue(0); // headline     delay 350ms
  const w2 = useSharedValue(0); // subtext      delay 450ms
  const w3 = useSharedValue(0); // google btn   delay 550ms
  const w4 = useSharedValue(0); // legal        delay 650ms

  // Toast
  const toastY = useSharedValue(-20);
  const toastOp = useSharedValue(0);

  useEffect(() => {
    const delays = [200, 350, 450, 550, 650];
    [w0, w1, w2, w3, w4].forEach((sv, i) => {
      sv.value = withDelay(delays[i], withTiming(1, { duration: 500 }));
    });
  }, [w0, w1, w2, w3, w4]);

  const fadeUp = (sv: { value: number }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [
        {
          translateY: interpolate(
            sv.value,
            [0, 1],
            [16, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    }));

  const w0s = fadeUp(w0);
  const w1s = fadeUp(w1);
  const w2s = fadeUp(w2);
  const w3s = fadeUp(w3);
  const w4s = fadeUp(w4);

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
    [toastOp, toastY],
  );

  const handleSignIn = useCallback(async () => {
    setLoading(true);

    console.log("[SignIn] Starting sign-in flow...");
    const result = await signInWithGoogle();
    console.log("[SignIn] signInWithGoogle result:", JSON.stringify(result));

    if (!result.ok) {
      if ("cancelled" in result) {
        console.log("[SignIn] User cancelled.");
        setLoading(false);
        return;
      }
      console.log("[SignIn] Sign-in error:", result.error);
      showToast(result.error);
      setLoading(false);
      return;
    }

    try {
      console.log("[SignIn] Fetching user session...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[SignIn] User:", user ? user.id : "null");

      if (!user) throw new Error("No user");

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      console.log("[SignIn] Profile:", profile);

      const destination = profile?.onboarding_complete ? "/(tabs)" : "/(auth)/profile-setup";
      console.log("[SignIn] Redirecting to:", destination);
      router.replace(destination);
    } catch (err) {
      console.log("[SignIn] Catch error:", err);
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
        {/* Wordmark */}
        <Animated.View style={w0s}>
          <Text style={styles.wordmark}>Trackshpr</Text>
        </Animated.View>

        {/* Headline — second line gets gradient text matching HTML <em> */}
        <Animated.View style={w1s}>
          <Text style={styles.headlineLine1}>Your riders move.</Text>
          <GradientText style={styles.headlineLine2}>
            Your customers know.
          </GradientText>
        </Animated.View>

        {/* Sub-text */}
        <Animated.View style={[styles.subWrap, w2s]}>
          <Text style={styles.sub}>
            Real-time delivery visibility for Nigerian social commerce sellers.
            No more &quot;where is my order?&quot; messages.
          </Text>
        </Animated.View>

        {/* Google sign-in button
             Outer Animated.View owns the shadow/elevation so Android renders
             a rounded shadow correctly. Inner Pressable clips the ripple. */}
        <Animated.View style={[styles.btnWrap, w3s]}>
          <Pressable
            onPress={() => !loading && handleSignIn()}
            disabled={loading}
            android_ripple={{ color: "rgba(48,41,80,0.06)", borderless: false }}
            style={styles.googleBtn}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Legal */}
        <Animated.View style={w4s}>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAF4FF", // --surface
  },

  // Content panel — flex: 1, justify flex-end, matching HTML .content
  content: {
    flex: 1,
    backgroundColor: "#FAF4FF",
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "flex-end",
  },

  // Wordmark — 13px, 600, letterSpacing 0.12em, uppercase, primary
  wordmark: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 13 * 0.12,
    textTransform: "uppercase",
    color: "#4647D3",
    marginBottom: 10,
  },

  // Headline — 30px, 700, letterSpacing -0.03em, lineHeight 1.15
  headlineLine1: {
    fontSize: 30,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#302950",
    letterSpacing: -0.9,
    lineHeight: 34.5,
  },
  headlineLine2: {
    fontSize: 30,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.9,
    lineHeight: 34.5,
  },

  // Sub-text
  subWrap: {
    marginBottom: 32,
  },
  sub: {
    fontSize: 14,
    fontFamily: font.sans.regular,
    color: "#9590B0",
    lineHeight: 14 * 1.55,
    marginTop: 10,
  },

  // Google button
  // btnWrap: elevation lives here so Android draws a rounded shadow, not a box
  btnWrap: {
    marginBottom: 16,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    // iOS shadow
    shadowColor: "#302950",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Android shadow — on the wrapper, not the Pressable, so it's rounded
    elevation: 4,
  },
  // googleBtn: overflow:hidden clips the ripple to the pill shape
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    overflow: "hidden",
    // Subtle ring border (replaces 0 0 0 1px spread shadow)
    borderWidth: 1,
    borderColor: "rgba(48,41,80,0.08)",
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: "#302950",
    letterSpacing: -0.15,
    marginLeft: 12,
  },

  // Legal
  legal: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: "#9590B0",
    lineHeight: 11 * 1.6,
  },
  legalLink: {
    color: "#4647D3",
    fontWeight: "500",
  },

  // Toast
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
