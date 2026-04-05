import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsDailyChart,
  fetchAnalyticsOverview,
  fetchAnalyticsTopRiders,
  type AnalyticsDailyChartPoint,
  type AnalyticsOverview,
  type AnalyticsTopRider,
} from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

const ANALYTICS_STALE_TIME = 1000 * 60 * 5;

export function useAnalyticsOverview(userId: string | null) {
  return useQuery<AnalyticsOverview>({
    queryKey: queryKeys.analyticsOverview(userId ?? ""),
    queryFn: () => fetchAnalyticsOverview(userId!),
    enabled: !!userId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useAnalyticsDailyChart(userId: string | null) {
  return useQuery<AnalyticsDailyChartPoint[]>({
    queryKey: queryKeys.analyticsDailyChart(userId ?? ""),
    queryFn: () => fetchAnalyticsDailyChart(userId!),
    enabled: !!userId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useAnalyticsTopRiders(userId: string | null) {
  return useQuery<AnalyticsTopRider[]>({
    queryKey: queryKeys.analyticsTopRiders(userId ?? ""),
    queryFn: () => fetchAnalyticsTopRiders(userId!),
    enabled: !!userId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}
