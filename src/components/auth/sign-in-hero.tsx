/**
 * Sign-in hero section: layered gradients, animated orbit rings, floating card.
 * Accepts hero dimensions so the screen can control layout.
 */
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, signInColors } from "@/src/constants/tokens";
import DeliveryCard from "./delivery-card";

const CARD_W = 260;

interface SignInHeroProps {
  width: number;
  height: number;
}

export default function SignInHero({ width, height }: SignInHeroProps) {
  const cx = width / 2;
  const cy = height / 2;

  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(0);
  const orbit3 = useSharedValue(0);
  const float = useSharedValue(0);

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

    return () => {
      cancelAnimation(orbit1);
      cancelAnimation(orbit2);
      cancelAnimation(orbit3);
      cancelAnimation(float);
    };
  }, []);

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

  const ring = (size: number, borderColor: string) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1,
    borderColor,
    left: cx - size / 2,
    top: cy - size / 2,
  });

  return (
    <View style={[styles.hero, { height }]}>
      {/* Background gradient layers */}
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
        style={[StyleSheet.absoluteFillObject, { height: height * 0.65 }]}
      />
      <LinearGradient
        colors={[signInColors.heroRightAccent, "transparent"]}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { top: height * 0.2, height: height * 0.7 }]}
      />

      {/* Orbit rings — outermost first */}
      <Animated.View style={[ring(380, signInColors.orbitRingOuter), orbit3Style]} pointerEvents="none">
        <View style={styles.orbitDot} />
      </Animated.View>
      <Animated.View style={[ring(280, signInColors.orbitRing), orbit2Style]} pointerEvents="none">
        <View style={styles.orbitDot} />
      </Animated.View>
      <Animated.View style={[ring(180, signInColors.orbitRing), orbit1Style]} pointerEvents="none">
        <View style={styles.orbitDot} />
      </Animated.View>

      {/* Floating delivery card */}
      <Animated.View
        style={[
          { position: "absolute", left: cx - CARD_W / 2, top: cy - 95, width: CARD_W },
          floatStyle,
        ]}
      >
        <DeliveryCard />
      </Animated.View>

      {/* Fade into content panel */}
      <LinearGradient
        colors={["transparent", colors.surface]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  fade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
