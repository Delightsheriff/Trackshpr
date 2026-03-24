import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri();

class AuthCancelledError extends Error {
  readonly cancelled = true;
  constructor() {
    super("Sign-in was cancelled");
    this.name = "AuthCancelledError";
  }
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

  if (result.type !== "success") {
    throw new AuthCancelledError();
  }

  const authResult = result as { type: "success"; url: string };
  const url = new URL(authResult.url);
  const hashParams = new URLSearchParams(url.hash.slice(1));

  const accessToken =
    url.searchParams.get("access_token") ??
    hashParams.get("access_token");
  const refreshToken =
    url.searchParams.get("refresh_token") ??
    hashParams.get("refresh_token");

  if (!accessToken) {
    throw new Error("Sign-in failed. Please try again.");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  if (sessionError) {
    throw new Error("Could not complete sign-in. Please try again.");
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
