/**
 * Rider selector modal — full screen.
 * Sets selected rider in orderStore, then navigates back.
 */
import { colors, font, gradients, layout, radius } from "@/src/constants/tokens";
import { useDataStore } from "@/src/stores/dataStore";
import { useOrderStore } from "@/src/stores/orderStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_COLORS = [
  { bg: colors.primarySoft, fg: colors.primary },
  { bg: colors.successBg,   fg: colors.success },
  { bg: colors.warningBg,   fg: colors.warning },
];
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function SelectRiderScreen() {
  const insets  = useSafeAreaInsets();
  const riders  = useDataStore((s) => s.riders);
  const current = useOrderStore((s) => s.draft.rider);
  const setRider= useOrderStore((s) => s.setRider);

  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState(current);

  const filtered = riders.filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase())
  );

  const confirm = () => { setRider(selected); router.back(); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={styles.title}>Select Rider</Text>
          <Text style={styles.subtitle}>From your saved riders</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color={colors.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search saved riders..." placeholderTextColor={colors.textMuted} style={styles.searchInput} />
          {query.length > 0 && <Pressable onPress={() => setQuery("")} hitSlop={8}><Feather name="x" size={14} color={colors.textMuted} /></Pressable>}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((r, i) => {
          const ac  = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const sel = selected?.id === r.id;
          return (
            <Pressable key={r.id} onPress={() => setSelected(r)}
              style={[styles.card, sel && styles.cardSelected]}>
              <View style={[styles.avatar, { backgroundColor: ac.bg }]}>
                <Text style={[styles.avatarText, { color: ac.fg }]}>{initials(r.name)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.meta}>{r.delivered} deliveries · {r.phone}</Text>
              </View>
              <View style={[styles.radioDot, sel && styles.radioDotActive]}>
                {sel && <View style={styles.radioDotInner} />}
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => router.push("/(modals)/add-rider")} style={styles.addRow}>
          <View style={styles.addAvatar}><Feather name="plus" size={18} color={colors.primary} /></View>
          <Text style={styles.addLabel}>Add a new rider</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.ctaShadow, !selected && styles.ctaShadowDisabled]}>
          <Pressable onPress={confirm} disabled={!selected}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }} style={styles.ctaPressable}>
            <LinearGradient
              colors={selected ? gradients.primary : [colors.surfaceContainer, colors.surfaceContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBtn}>
              <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>
                {selected ? `Confirm — ${selected.name}` : "Select a rider"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: layout.screenPaddingH, paddingBottom: 14, paddingTop: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surfaceCard, alignItems: "center", justifyContent: "center",
             shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34, color: colors.textPrimary },
  subtitle: { fontSize: 11, fontFamily: font.sans.regular, color: colors.textMuted, marginTop: 1 },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceCard, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14,
               shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: font.sans.regular, color: colors.textPrimary, padding: 0 },
  list: { paddingHorizontal: layout.screenPaddingH, gap: 8, paddingBottom: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceCard, borderRadius: radius.xl, padding: layout.cardPadding,
          shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardSelected: { backgroundColor: colors.primarySoft },
  avatar: { width: 38, height: 38, borderRadius: radius.full, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.13 },
  meta: { fontSize: 11, fontFamily: font.sans.regular, color: colors.textMuted, marginTop: 1 },
  radioDot: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 2, borderColor: colors.surfaceContainer, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDotInner: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.white },
  addRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceCard, borderRadius: radius.xl, padding: layout.cardPadding,
            shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  addAvatar: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addLabel: { fontSize: 13, fontFamily: font.sans.bold, fontWeight: "700", color: colors.primary },
  cta: { paddingHorizontal: layout.screenPaddingH, paddingTop: 8 },
  ctaShadow: { borderRadius: radius.full, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  ctaShadowDisabled: { backgroundColor: colors.surfaceContainer, shadowOpacity: 0 },
  ctaPressable: { borderRadius: radius.full, overflow: "hidden" },
  ctaBtn: { borderRadius: radius.full, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 50 },
  ctaText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: colors.white },
  ctaTextDisabled: { color: colors.textMuted },
});
