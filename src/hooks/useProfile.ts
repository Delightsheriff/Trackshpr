/**
 * useProfile — TanStack Query hook for profile data + save mutation.
 */
import { saveProfile, uploadLogo } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import { queryKeys } from "@/src/lib/queryKeys";
import { fetchProfile, type Profile } from "@/src/lib/supabaseQueries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Fetch ─────────────────────────────────────────────────────────────────────

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Save ──────────────────────────────────────────────────────────────────────

interface SaveProfilePayload {
  id: string;
  business_name: string;
  phone: string;
  secondary_phone?: string | null;
  city?: string | null;
  description?: string | null;
  brand_name?: string | null;
  brand_color?: string | null;
  display_option?: string | null;
  logo_url?: string | null;
  pickup_address?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  onboarding_complete?: boolean;
}

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProfilePayload) => saveProfile(payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile(variables.id),
      });
    },
  });
}

// ── Upload logo ────────────────────────────────────────────────────────────────

export function useUploadLogo() {
  return useMutation({
    mutationFn: ({ userId, uri }: { userId: string; uri: string }) =>
      uploadLogo(userId, uri),
  });
}

// ── Delete account ────────────────────────────────────────────────────────────

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
    },
  });
}

// ── Quick profile completeness check (lightweight) ─────────────────────────────

export function useProfileComplete(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    select: (profile: Profile | null) => !!profile?.onboarding_complete,
    staleTime: 1000 * 60 * 5,
  });
}
