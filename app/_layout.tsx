import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="(auth)"     options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
