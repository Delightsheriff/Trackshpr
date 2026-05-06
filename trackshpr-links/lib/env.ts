function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value.trim();
}

export const env = {
  supabaseUrl: required("SUPABASE_URL", process.env.SUPABASE_URL),
  supabaseAnonKey: required("SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY),
  homeUrl:
    process.env.NEXT_PUBLIC_TRACKSHPR_HOME_URL?.trim() || "https://trackshpr.app",
  supportEmail:
    process.env.NEXT_PUBLIC_TRACKSHPR_SUPPORT_EMAIL?.trim() || "support@trackshpr.app",
  privacyEmail:
    process.env.NEXT_PUBLIC_TRACKSHPR_PRIVACY_EMAIL?.trim() || "privacy@trackshpr.app",
} as const;
