/**
 * Google OAuth via Supabase web flow.
 * No platform client IDs required — works in Expo Go and dev builds alike.
 */
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri();

export type AuthResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; error: string };

export async function signInWithGoogle(): Promise<AuthResult> {
  const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (oauthError || !data.url) {
    return { ok: false, error: oauthError?.message ?? "Could not start sign-in." };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== "success") {
    return { ok: false, cancelled: true };
  }

  // Tokens arrive in the URL hash fragment
  const params = new URLSearchParams(new URL(result.url).hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken) {
    return { ok: false, error: "Sign-in failed. Please try again." };
  }

  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  return { ok: true };
}
