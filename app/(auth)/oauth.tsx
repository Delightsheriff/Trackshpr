import { completeGoogleSignInFromUrl } from "@/src/lib/auth";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type CallbackState = "waiting" | "error";

export default function OAuthCallbackScreen() {
  const url = Linking.useLinkingURL();
  const handledUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<CallbackState>("waiting");
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    if (!url || handledUrlRef.current === url) {
      return;
    }

    handledUrlRef.current = url;

    let cancelled = false;

    async function complete() {
      try {
        console.log("[AuthCallback] Received URL:", url);

        const completed = await completeGoogleSignInFromUrl(url);

        if (!completed) {
          throw new Error("The sign-in callback did not include a session.");
        }

        if (!cancelled) {
          setMessage("Signed in. Opening your workspace...");
        }
      } catch (error) {
        console.log(
          "[AuthCallback] Failed to finish sign-in:",
          error instanceof Error ? error.message : "Unknown error",
        );

        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not complete Google sign-in.",
          );
        }
      }
    }

    void complete();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="small" color="#4647D3" />
      <Text style={styles.title}>
        {state === "error" ? "Sign-in needs attention" : "Signing you in"}
      </Text>
      <Text style={styles.body}>{message}</Text>

      {state === "error" ? (
        <Pressable
          onPress={() => router.replace("/(auth)/sign-in")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F7F8FB",
  },
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: "#161522",
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#5F6576",
  },
  button: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: "#4647D3",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
