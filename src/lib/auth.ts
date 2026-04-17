import "react-native-url-polyfill/auto";

import { makeRedirectUri } from "expo-auth-session";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_AUTH_CALLBACK_PATH = "oauth";

const redirectUri = makeRedirectUri({
  path: GOOGLE_AUTH_CALLBACK_PATH,
});
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

class AuthCancelledError extends Error {
  readonly cancelled = true;
  constructor() {
    super("Sign-in was cancelled");
    this.name = "AuthCancelledError";
  }
}

class AuthDismissedError extends Error {
  readonly dismissed = true;
  constructor() {
    super("Sign-in is waiting for the app callback.");
    this.name = "AuthDismissedError";
  }
}

function isExpoGoRuntime() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function shouldUseNativeGoogleSignIn() {
  return Platform.OS === "android" && !isExpoGoRuntime();
}

function readOAuthParams(url: string) {
  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.slice(1));

  return {
    code: parsedUrl.searchParams.get("code"),
    accessToken:
      parsedUrl.searchParams.get("access_token") ??
      hashParams.get("access_token"),
    refreshToken:
      parsedUrl.searchParams.get("refresh_token") ??
      hashParams.get("refresh_token"),
    errorCode:
      parsedUrl.searchParams.get("error_code") ??
      hashParams.get("error_code"),
    errorDescription:
      parsedUrl.searchParams.get("error_description") ??
      hashParams.get("error_description"),
  };
}

export function getGoogleRedirectUri() {
  return redirectUri;
}

async function signInWithGoogleBrowser(): Promise<void> {
  console.log("[Auth] Using browser Google sign-in with redirect URI:", redirectUri);

  const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (oauthError || !data.url) {
    const msg = oauthError?.message ?? "Could not start sign-in.";
    throw new Error(msg);
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === "success") {
    await completeGoogleSignInFromUrl(result.url);
    return;
  }

  if (result.type === "dismiss") {
    throw new AuthDismissedError();
  }

  throw new AuthCancelledError();
}

async function signInWithGoogleNativeAndroid(): Promise<void> {
  if (!googleWebClientId) {
    throw new Error(
      "Native Google sign-in needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
    );
  }

  try {
    const { GoogleSignin } = await import(
      "@react-native-google-signin/google-signin"
    );

    GoogleSignin.configure({
      webClientId: googleWebClientId,
      iosClientId: googleIosClientId,
      scopes: ["email", "profile"],
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (response.type !== "success") {
      throw new AuthCancelledError();
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error(
        "Google did not return an ID token. Check the Web client ID setup.",
      );
    }

    const tokens = await GoogleSignin.getTokens();

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      access_token: tokens.accessToken,
    });

    if (error) {
      throw new Error(error.message ?? "Could not complete sign-in.");
    }
  } catch (error) {
    if (error instanceof AuthCancelledError) {
      throw error;
    }

    if (error instanceof Error) {
      if (
        error.message.includes("RNGoogleSignin") ||
        error.message.includes("RNGoogleSignIn")
      ) {
        throw new Error(
          "Native Google sign-in is installed, but it needs an Android development build before it can run.",
        );
      }

      throw error;
    }

    throw new Error("Could not complete native Google sign-in.");
  }
}

export async function completeGoogleSignInFromUrl(
  url: string,
): Promise<boolean> {
  const { code, accessToken, refreshToken, errorCode, errorDescription } =
    readOAuthParams(url);

  if (errorCode || errorDescription) {
    throw new Error(errorDescription ?? "Google sign-in failed.");
  }

  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      throw new Error("Could not complete sign-in. Please try again.");
    }

    return true;
  }

  if (!accessToken) {
    return false;
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  if (sessionError) {
    throw new Error("Could not complete sign-in. Please try again.");
  }

  return true;
}

export async function signInWithGoogle(): Promise<void> {
  // TODO: Once iOS also moves to a development build, switch that platform
  // to native Google sign-in and remove the browser fallback entirely.
  if (shouldUseNativeGoogleSignIn()) {
    console.log("[Auth] Using native Google sign-in for Android dev builds.");
    await signInWithGoogleNativeAndroid();
    return;
  }

  await signInWithGoogleBrowser();
}

/**
 * Native Sign in with Apple — iOS only.
 *
 * Apple requires this button whenever another social login (e.g. Google)
 * is offered on iOS. Available only on real iOS devices + development /
 * production builds — not in Expo Go and not on Android/web.
 */
export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iOS.");
  }

  const AppleAuthentication = await import("expo-apple-authentication");
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Apple sign-in is not available on this device.");
  }

  let credential: Awaited<
    ReturnType<typeof AppleAuthentication.signInAsync>
  >;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "ERR_REQUEST_CANCELED"
    ) {
      throw new AuthCancelledError();
    }
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) {
    throw new Error(error.message ?? "Could not complete Apple sign-in.");
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Auth] Sign out error:", error.message);
  }
}

export async function clearInvalidSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return false;
    }
    
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      await supabase.auth.signOut();
      return true;
    }
    return false;
  } catch {
    try {
      await supabase.auth.signOut();
    } catch {}
    return true;
  }
}
