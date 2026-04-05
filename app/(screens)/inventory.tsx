import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProductFormSheet from "@/src/components/inventory/product-form-sheet";
import { ProGate } from "@/src/components/shared";
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useProducts, useSession } from "@/src/hooks";
import { formatNaira } from "@/src/lib/inventory";
import type { Product } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { LinearGradient } from "expo-linear-gradient";

type InventoryFilter = "all" | "low" | "out";

function ProductSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surfaceCard }]}>
      <View style={[sk.thumb, { backgroundColor: colors.surfaceContainer }]} />
      <View style={sk.body}>
        <View style={[sk.line, { width: "56%", backgroundColor: colors.surfaceContainer }]} />
        <View
          style={[
            sk.line,
            { width: "34%", marginTop: 6, backgroundColor: colors.surfaceContainer },
          ]}
        />
        <View
          style={[
            sk.badge,
            { marginTop: 10, backgroundColor: colors.surfaceContainer },
          ]}
        />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    marginBottom: layout.listGap,
  },
  thumb: { width: 64, height: 64, borderRadius: 18, flexShrink: 0 },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6 },
  badge: { height: 18, width: 100, borderRadius: radius.full },
});

function InventoryProductCard({
  product,
}: {
  product: Product;
}) {
  const { colors, isDark } = useTheme();

  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      };

  const isLowStock = product.quantity <= product.low_stock_threshold;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/(screens)/product-detail", params: { id: product.id } })
      }
      style={[styles.card, { backgroundColor: colors.surfaceCard }, cardShadow]}
    >
      {product.photo_url ? (
        <Image source={{ uri: product.photo_url }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: colors.surfaceContainer }]}>
          <Feather name="package" size={20} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.cardPrice, { color: colors.textPrimary }]}>
          {formatNaira(product.price)}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
            {product.quantity} {product.unit}
          </Text>
          {isLowStock ? (
            <View style={[styles.lowStockBadge, { backgroundColor: colors.errorBg }]}>
              <Text style={[styles.lowStockText, { color: colors.error }]}>
                {product.quantity === 0 ? "Out of stock" : "Low stock"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function InventoryContent() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const { data: products = [], isLoading, isError, refetch } = useProducts(userId);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query), 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const searchBarShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      };

  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      !debouncedQuery ||
      product.name.toLowerCase().includes(debouncedQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (filter === "low") return product.quantity <= product.low_stock_threshold;
    if (filter === "out") return product.quantity === 0;
    return true;
  });

  const emptyTitle =
    filter === "out"
      ? "No out-of-stock products"
      : filter === "low"
      ? "No low-stock products"
      : debouncedQuery
      ? "No products found"
      : "No products yet";
  const emptySub =
    filter === "out"
      ? "Everything currently has stock."
      : filter === "low"
      ? "Your active products are above their restock threshold."
      : debouncedQuery
      ? "Try a different product name."
      : "Add your first product to start tracking stock.";

  return (
    <View style={[styles.contentRoot, { backgroundColor: colors.surface }]}>
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard }, searchBarShadow]}>
          <Feather name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search inventory..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: "All" },
            { key: "low", label: "Low Stock" },
            { key: "out", label: "Out of Stock" },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key as InventoryFilter)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surfaceCard,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <ProductSkeleton colors={colors} />
          <ProductSkeleton colors={colors} />
          <ProductSkeleton colors={colors} />
        </ScrollView>
      ) : isError ? (
        <View style={styles.stateWrap}>
          <View style={[styles.stateIcon, { backgroundColor: colors.errorBg }]}>
            <Feather name="wifi-off" size={28} color={colors.error} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
            Could not load inventory
          </Text>
          <Text style={[styles.stateSub, { color: colors.textMuted }]}>
            Check your connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InventoryProductCard product={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="package" size={30} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {emptyTitle}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {emptySub}
              </Text>
            </View>
          }
        />
      )}

      {!isLoading && !isError ? (
        <View
          style={[
            styles.fabShadow,
            {
              shadowColor: colors.primary,
              bottom: insets.bottom + 16,
            },
          ]}
        >
          <Pressable
            onPress={() => setFormOpen(true)}
            style={styles.fabPressable}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.fabText}>Add Product</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      <ProductFormSheet open={formOpen} mode="create" onClose={() => setFormOpen(false)} />
    </View>
  );
}

export default function InventoryScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const backBtnShadow = isDark
    ? { shadowColor: "#000" as const, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)" as const, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Navigation header — always visible regardless of pro status */}
      <View style={[styles.navHeader, { backgroundColor: colors.surfaceCard }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }, backBtnShadow]}
          android_ripple={{ color: colors.surfaceContainer, borderless: false }}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Inventory
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ProGate feature="inventory">
        <InventoryContent />
      </ProGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentRoot: { flex: 1 },
  // Navigation header — matches settings screen style exactly
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  headerSpacer: { width: 34 },
  // Search + filter section inside content
  searchSection: { paddingHorizontal: layout.screenPaddingH, paddingTop: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.sans.regular,
    padding: 0,
    margin: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 96,
    paddingTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    marginBottom: layout.listGap,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardName: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  cardPrice: {
    fontSize: 15,
    fontFamily: font.mono.medium,
    fontWeight: "500",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
  lowStockBadge: {
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  lowStockText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: layout.screenPaddingH,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  stateSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
    marginBottom: 4,
  },
  retryBtn: {
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
    maxWidth: 260,
  },
  fabShadow: {
    position: "absolute",
    left: layout.screenPaddingH,
    right: layout.screenPaddingH,
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  fabPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.full,
    paddingVertical: 14,
  },
  fabText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
