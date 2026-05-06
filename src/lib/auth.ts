import "react-native-url-polyfill/auto";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_AUTH_CALLBACK_PATH = "oauth";

const redirectUri = Linking.createURL(GOOGLE_AUTH_CALLBACK_PATH);

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

export async function signInWithGoogle(): Promise<void> {
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
    throw new Error("Sign-in is waiting for the app callback.");
  }

  throw new Error("Sign-in was cancelled");
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

export async function signInWithApple(): Promise<void> {
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
      throw new Error("Sign-in was cancelled");
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