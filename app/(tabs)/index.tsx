/**
 * Home / Dashboard tab (DS §8.1, §8.4).
 */
import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { supabase } from "@/src/lib/supabase";
import { fetchProfile } from "@/src/lib/supabaseQueries";
import { useSession } from "@/src/hooks/useSession";
import { useProfile } from "@/src/hooks/useProfile";
import { useTheme } from "@/src/stores/themeStore";
import { layout, font } from "@/src/constants/tokens";

// Extracted Components
import { HomeHeader } from "@/src/components/home/home-header";
import { HeroStatCard } from "@/src/components/home/hero-stat-card";
import { MiniStatRow } from "@/src/components/home/mini-stat-row";
import { QuickActionsRow } from "@/src/components/home/quick-actions-row";
import { OrderCard } from "@/src/components/home/order-card";
import { IncompleteProfileBanner } from "@/src/components/home/incomplete-profile-banner";
import { useOrders } from "@/src/hooks/useOrders";
import { formatRelativeTime } from "@/src/utils/helpers";

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { userId } = useSession();
  const { data: profile } = useProfile(userId);
  const { data: orders = [] } = useOrders(userId);
  const businessName = profile?.business_name ?? "";
  const initial = businessName.charAt(0).toUpperCase() || "?";

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const statsTotal = todayOrders.length;
  const statsDelivered = todayOrders.filter((o) => o.status === "delivered").length;
  const statsInTransit = todayOrders.filter((o) => o.status === "in_transit").length;
  const statsFailed = todayOrders.filter((o) => o.status === "failed").length;
  const recentOrders = orders.slice(0, 3);

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    async function checkProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfileIncomplete(false);
        return;
      }

      try {
        const profile = await fetchProfile(user.id);
        setProfileIncomplete(!profile?.onboarding_complete);
      } catch {
        // Missing profile row should still prompt completion.
        setProfileIncomplete(true);
      }
    }
    checkProfile();
  }, [isFocused]);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + layout.screenPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile incomplete banner ─────────────────────────────── */}
        {profileIncomplete && <IncompleteProfileBanner />}

        {/* ── Header ───────────────────────────────────────────────── */}
        <HomeHeader
          businessName={businessName}
          initial={initial}
          logoUrl={profile?.logo_url}
          updatedAt={profile?.updated_at}
        />

        {/* ── Hero stat card ────────────────────────────────────────────── */}
        <HeroStatCard total={statsTotal} />

        {/* ── Mini stat row ─────────────────────────────────────────────── */}
        <MiniStatRow delivered={statsDelivered} inTransit={statsInTransit} failed={statsFailed} />

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <QuickActionsRow />

        {/* ── Active orders ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Active Orders
          </Text>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>
            See all
          </Text>
        </View>

        {recentOrders.map((o) => (
          <OrderCard
            key={o.id}
            id={o.id}
            item={o.item}
            customer={o.customer_name ?? "Unknown"}
            area={o.city ?? o.delivery_address?.split(",").pop()?.trim() ?? "—"}
            status={o.status}
            time={formatRelativeTime(o.created_at)}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
