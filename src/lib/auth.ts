/**
 * Google OAuth via Supabase web flow.
 * No platform client IDs required — works in Expo Go and dev builds alike.
 */
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri();
console.log("[Auth] Redirect URI:", redirectUri);

export type AuthResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; error: string };

export async function signInWithGoogle(): Promise<AuthResult> {
  console.log("[Auth] Starting Google sign-in...");

  const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  console.log("[Auth] signInWithOAuth response:", { oauthError, hasUrl: !!data?.url });

  if (oauthError || !data.url) {
    const msg = oauthError?.message ?? "Could not start sign-in.";
    console.log("[Auth] OAuth error:", msg);
    return { ok: false, error: msg };
  }

  console.log("[Auth] Opening browser with URL:", data.url);

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  console.log("[Auth] Browser result type:", result.type, "URL:", "url" in result ? result.url : "N/A");

  if (result.type !== "success") {
    console.log("[Auth] Browser auth cancelled or failed.");
    return { ok: false, cancelled: true };
  }

  // Tokens arrive in the URL hash fragment
  const authResult = result as { type: "success"; url: string };
  console.log("[Auth] Parsing tokens from URL...");
  const params = new URLSearchParams(new URL(authResult.url).hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  console.log("[Auth] Access token found:", !!accessToken, "Refresh token found:", !!refreshToken);

  if (!accessToken) {
    console.log("[Auth] No access token in URL. Full URL:", authResult.url);
    return { ok: false, error: "Sign-in failed. Please try again." };
  }

  console.log("[Auth] Setting session...");
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  console.log("[Auth] Session set:", !!sessionError ? "ERROR: " + sessionError.message : "OK");

  if (sessionError) {
    return { ok: false, error: "Could not complete sign-in. Please try again." };
  }

  console.log("[Auth] Sign-in SUCCESS");
  return { ok: true };
}
