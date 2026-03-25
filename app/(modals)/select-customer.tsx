/**
 * Customer selector modal — full screen.
 * Sets selected customer in orderStore, then navigates back.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useCustomers } from "@/src/hooks/useCustomers";
import { useSession } from "@/src/hooks/useSession";
import { useOrderStore } from "@/src/stores/orderStore";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_COLORS = [
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#DCFCE7", fg: "#166534" },
  { bg: "#FEE2E2", fg: "#991B1B" },
  { bg: "#DBEAFE", fg: "#1E40AF" },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function SelectCustomerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId }   = useSession();
  const { data: customers = [] } = useCustomers(userId);
  const current    = useOrderStore((s) => s.draft.customer);
  const setCustomer= useOrderStore((s) => s.setCustomer);

  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(current);

  const filtered = customers.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase())
  );

  const confirm = () => {
    setCustomer(selected);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceCard }]}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Select Customer</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>From your address book</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard }]}>
          <Feather name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or address..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((c, i) => {
          const ac  = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const sel = selected?.id === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelected(c)}
              style={[
                styles.card,
                { backgroundColor: sel ? colors.primarySoft : colors.surfaceCard },
              ]}
            >
              {/* Check */}
              <View style={[
                styles.check,
                { borderColor: sel ? colors.primary : colors.surfaceContainer, backgroundColor: sel ? colors.primary : "transparent" },
              ]}>
                {sel && <Feather name="check" size={12} color="white" />}
              </View>
              <View style={[styles.avatar, { backgroundColor: ac.bg }]}>
                <Text style={[styles.avatarText, { color: ac.fg }]}>{initials(c.name)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{c.name}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{c.address}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Add new customer */}
        <Pressable
          onPress={() => router.push("/(modals)/add-customer")}
          style={[styles.addRow, { backgroundColor: colors.surfaceCard }]}
        >
          <View style={[styles.addAvatar, { backgroundColor: colors.primarySoft }]}>
            <Feather name="plus" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.addLabel, { color: colors.primary }]}>Add new customer</Text>
            <Text style={[styles.addSub, { color: colors.textMuted }]}>Save for future orders</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Confirm CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[
          styles.ctaShadow,
          { backgroundColor: selected ? colors.primary : colors.surfaceContainer, shadowColor: selected ? colors.primary : "transparent" },
          !selected && styles.ctaShadowDisabled,
        ]}>
          <Pressable
            onPress={confirm}
            disabled={!selected}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
            style={styles.ctaPressable}
          >
            <LinearGradient
              colors={selected ? gradients.primary : [colors.surfaceContainer, colors.surfaceContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              <Text style={[styles.ctaText, !selected && { color: colors.textMuted }]}>
                {selected ? `Confirm — ${selected.name}` : "Select a customer"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1 },
  header:            { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: layout.screenPaddingH, paddingBottom: 14, paddingTop: 10 },
  backBtn:           { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center",
                       shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  title:             { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34 },
  subtitle:          { fontSize: 11, fontFamily: font.sans.regular, marginTop: 1 },
  searchWrap:        { paddingHorizontal: layout.screenPaddingH, marginBottom: 12 },
  searchBar:         { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14,
                       shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  searchInput:       { flex: 1, fontSize: 13, fontFamily: font.sans.regular, padding: 0 },
  list:              { paddingHorizontal: layout.screenPaddingH, gap: 8, paddingBottom: 16 },
  card:              { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.xl, padding: layout.cardPadding,
                       shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  check:             { width: 22, height: 22, borderRadius: radius.full, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatar:            { width: 42, height: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:        { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700" },
  info:              { flex: 1, minWidth: 0 },
  name:              { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.13, marginBottom: 2 },
  meta:              { fontSize: 11, fontFamily: font.sans.regular },
  addRow:            { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.xl, padding: layout.cardPadding,
                       shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  addAvatar:         { width: 42, height: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addLabel:          { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700" },
  addSub:            { fontSize: 11, fontFamily: font.sans.regular, marginTop: 1 },
  cta:               { paddingHorizontal: layout.screenPaddingH, paddingTop: 8 },
  ctaShadow:         { borderRadius: radius.full, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  ctaShadowDisabled: { shadowOpacity: 0 },
  ctaPressable:      { borderRadius: radius.full, overflow: "hidden" },
  ctaBtn:            { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  ctaText:           { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "white" },
});
