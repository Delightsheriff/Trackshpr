/**
 * useNotificationFailures — recent Termii failures for the current seller.
 *
 * Read-only, 24h window, capped to 20 rows. Powers the failure surface
 * on the Settings screen so sellers know when a customer/rider didn't
 * receive an SMS/WhatsApp instead of silently missing deliveries.
 */
import { supabase } from "@/src/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface NotificationFailure {
  id: string;
  order_id: string | null;
  recipient_phone: string;
  recipient_kind: "customer" | "rider";
  event: "order_created" | "order_picked_up" | "order_delivered" | "order_failed";
  channel: "whatsapp" | "sms";
  error_message: string | null;
  created_at: string;
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function useNotificationFailures(userId: string | null) {
  return useQuery({
    queryKey: ["notification_failures", userId ?? ""],
    enabled: !!userId,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    queryFn: async (): Promise<NotificationFailure[]> => {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data, error } = await supabase
        .from("notification_log")
        .select(
          "id, order_id, recipient_phone, recipient_kind, event, channel, error_message, created_at",
        )
        .eq("status", "failed")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data ?? []) as NotificationFailure[];
    },
  });
}
