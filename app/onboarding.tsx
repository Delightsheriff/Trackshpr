/**
 * Onboarding screen — always light-mode override per design system §9.2.
 */
import {
  NavRow,
  SlideOne,
  SlideThree,
  SlideTwo,
} from "@/src/components/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPRING = { damping: 28, stiffness: 280, mass: 0.85 };
const SLIDE_COUNT = 3;
const ONBOARDING_SEEN_KEY = "onboarding_seen";

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const indexSV = useSharedValue(0);
  const translateX = useSharedValue(0);

  // TODO: Remove this later — for testing onboarding flow only
  useEffect(() => {
    AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
  }, []);

  const snapTo = useCallback(
    (index: number) => {
      indexSV.value = index;
      translateX.value = withSpring(-index * width, SPRING);
      setActiveIndex(index);
    },
    [width, indexSV, translateX],
  );

  const handleNext = useCallback(
    () => snapTo(Math.min(activeIndex + 1, SLIDE_COUNT - 1)),
    [activeIndex, snapTo],
  );

  const handleSkip = useCallback(() => snapTo(SLIDE_COUNT - 1), [snapTo]);

  const handleComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch {
      // Non-critical — navigate regardless
    }
    router.replace("/(tabs)");
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      const base = -indexSV.value * width;
      const bounded = Math.max(
        -(SLIDE_COUNT - 1) * width,
        Math.min(0, base + e.translationX),
      );
      translateX.value = bounded;
    })
    .onEnd((e) => {
      let next = indexSV.value;
      const fastSwipe = Math.abs(e.velocityX) > 400;
      const bigSwipe = Math.abs(e.translationX) > width * 0.3;

      if (fastSwipe || bigSwipe) {
        next =
          e.velocityX < 0 || e.translationX < 0
            ? Math.min(next + 1, SLIDE_COUNT - 1)
            : Math.max(next - 1, 0);
      }

      indexSV.value = next;
      translateX.value = withSpring(-next * width, SPRING);
      runOnJS(setActiveIndex)(next);
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <StatusBar style={activeIndex === 1 ? "dark" : "light"} translucent />

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            { flexDirection: "row", width: width * SLIDE_COUNT, flex: 1 },
            rowStyle,
          ]}
        >
          <SlideOne isActive={activeIndex === 0} />
          <SlideTwo isActive={activeIndex === 1} />
          <SlideThree isActive={activeIndex === 2} />
        </Animated.View>
      </GestureDetector>

      {/* Fixed nav row — never slides with content */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 26,
          zIndex: 20,
        }}
        pointerEvents="box-none"
      >
        <NavRow
          variant={activeIndex === 1 ? "light" : "dark"}
          activeIndex={activeIndex}
          onNext={handleNext}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />
      </View>
    </View>
  );
}
