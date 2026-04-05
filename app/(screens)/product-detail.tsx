import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProductFormSheet from "@/src/components/inventory/product-form-sheet";
import RestockSheet from "@/src/components/inventory/restock-sheet";
import { font, layout, radius } from "@/src/constants/tokens";
import { useDeleteProduct, useProduct, useSession } from "@/src/hooks";
import { formatNaira } from "@/src/lib/inventory";
import type { ProductDetail, StockMovement } from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { LinearGradient } from "expo-linear-gradient";

function formatMovementDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MovementRow({
  movement,
}: {
  movement: StockMovement;
}) {
  const { colors } = useTheme();

  const badgeColors =
    movement.type === "restock"
      ? { bg: colors.successBg, fg: colors.success }
      : movement.type === "damage"
      ? { bg: colors.errorBg, fg: colors.error }
      : movement.type === "sale"
      ? { bg: colors.warningBg, fg: colors.warning }
      : { bg: colors.primarySoft, fg: colors.primary };

  const quantityPrefix = movement.quantity > 0 ? "+" : "";

  return (
    <View style={[styles.movementRow, { backgroundColor: colors.surfaceCard }]}>
      <View style={[styles.movementBadge, { backgroundColor: badgeColors.bg }]}>
        <Text style={[styles.movementBadgeText, { color: badgeColors.fg }]}>
          {movement.type}
        </Text>
      </View>
      <View style={styles.movementBody}>
        <Text style={[styles.movementQuantity, { color: colors.textPrimary }]}>
          {quantityPrefix}
          {movement.quantity}
        </Text>
        <Text style={[styles.movementDate, { color: colors.textMuted }]}>
          {formatMovementDate(movement.created_at)}
        </Text>
        {movement.note ? (
          <Text style={[styles.movementNote, { color: colors.textSecondary }]}>
            {movement.note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function DeleteProductSheet({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: ProductDetail | null;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { userId } = useSession();
  const showToast = useToastStore((state) => state.show);
  const deleteProduct = useDeleteProduct(userId);
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const sheetShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 10,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
      };

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProduct.mutateAsync(product.id);
      showToast("Product removed from active inventory", "success");
      onClose();
      router.back();
    } catch {
      showToast("Couldn't delete this product. Try again.", "error");
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={useMemo(() => [360 + insets.bottom], [insets.bottom])}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={[
        styles.deleteSheetBg,
        { backgroundColor: colors.surfaceElevated },
        sheetShadow,
      ]}
      handleIndicatorStyle={{ backgroundColor: colors.surfaceHighlight }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.deleteContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={[styles.deleteIconWrap, { backgroundColor: colors.errorBg }]}>
          <Feather name="trash-2" size={22} color={colors.error} />
        </View>
        <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
          Remove {product?.name ?? "this product"}?
        </Text>
        <Text style={[styles.deleteSub, { color: colors.textMuted }]}>
          This only removes it from active inventory. Existing order history stays intact.
        </Text>

        <Pressable
          onPress={handleDelete}
          disabled={deleteProduct.isPending}
          style={[styles.deletePrimaryButton, { backgroundColor: colors.error }]}
        >
          {deleteProduct.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.deletePrimaryText}>Remove Product</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onClose}
          style={[styles.deleteSecondaryButton, { backgroundColor: colors.surfaceContainer }]}
        >
          <Text style={[styles.deleteSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

export default function ProductDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(id ?? null);
  const [editOpen, setEditOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={[styles.errorIconWrap, { backgroundColor: colors.errorBg }]}>
          <Feather name="wifi-off" size={28} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          Could not load this product
        </Text>
        <Text style={[styles.errorSub, { color: colors.textMuted }]}>
          Check your connection and try again.
        </Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const isLowStock = product.quantity <= product.low_stock_threshold;
  const heroShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.32,
        shadowRadius: 22,
        elevation: 5,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#4647D3", "#5354E8", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <View style={styles.heroTopRow}>
            <Pressable style={styles.heroActionCircle} onPress={() => router.back()}>
              <Feather name="arrow-left" size={18} color="#FFFFFF" />
            </Pressable>

            <View style={styles.heroActions}>
              <Pressable style={styles.heroActionCircle} onPress={() => setEditOpen(true)}>
                <Feather name="edit-2" size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.heroActionCircle} onPress={() => setDeleteOpen(true)}>
                <Feather name="trash-2" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {product.photo_url ? (
            <Image source={{ uri: product.photo_url }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Feather name="package" size={28} color="#FFFFFF" />
            </View>
          )}

          <Text style={styles.heroName}>{product.name}</Text>
          <Text style={styles.heroPrice}>{formatNaira(product.price)}</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>{product.unit}</Text>
            {product.sku ? <Text style={styles.heroMeta}>SKU {product.sku}</Text> : null}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.stockCard, { backgroundColor: colors.surfaceCard }, heroShadow]}>
            <Text style={[styles.stockLabel, { color: colors.textMuted }]}>Current stock</Text>
            <Text style={[styles.stockValue, { color: colors.textPrimary }]}>
              {product.quantity}
            </Text>
            <Text style={[styles.stockUnit, { color: colors.textSecondary }]}>
              {product.unit}
            </Text>
          </View>

          {isLowStock ? (
            <View style={[styles.lowStockBanner, { backgroundColor: colors.errorBg }]}>
              <Feather name="alert-triangle" size={16} color={colors.error} />
              <View style={styles.lowStockCopy}>
                <Text style={[styles.lowStockTitle, { color: colors.error }]}>
                  {product.quantity === 0 ? "Out of stock" : "Low stock alert"}
                </Text>
                <Text style={[styles.lowStockSub, { color: colors.error }]}>
                  Restock before quantity drops below {product.low_stock_threshold} {product.unit}.
                </Text>
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={() => setRestockOpen(true)}
            style={[styles.restockButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.restockButtonText}>Quick Restock</Text>
          </Pressable>

          <View style={[styles.infoCard, { backgroundColor: colors.surfaceCard }, heroShadow]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Description</Text>
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>
              {product.description?.trim() || "No description added yet."}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Stock history</Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Last 20 movements</Text>
          </View>

          {product.recent_movements.length > 0 ? (
            <View style={styles.movementList}>
              {product.recent_movements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              ))}
            </View>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceCard }, heroShadow]}>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                No stock movements yet. Your first restock will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ProductFormSheet
        open={editOpen}
        mode="edit"
        product={product}
        onClose={() => setEditOpen(false)}
      />
      <RestockSheet open={restockOpen} product={product} onClose={() => setRestockOpen(false)} />
      <DeleteProductSheet open={deleteOpen} product={product} onClose={() => setDeleteOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layout.screenPaddingH,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    marginBottom: 4,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    minHeight: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: "hidden",
  },
  heroOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  heroOrb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -18,
    left: 24,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    zIndex: 2,
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
  },
  heroActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroImage: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: 14,
    overflow: "hidden",
  },
  heroPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroName: {
    fontSize: 22,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.44,
    color: "#FFFFFF",
    marginBottom: 4,
    zIndex: 2,
  },
  heroPrice: {
    fontSize: 20,
    fontFamily: font.mono.medium,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 10,
    zIndex: 2,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    zIndex: 2,
  },
  heroMeta: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  body: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  stockCard: {
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  stockLabel: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  stockValue: {
    fontSize: 40,
    fontFamily: font.mono.medium,
    fontWeight: "500",
    letterSpacing: -1.2,
  },
  stockUnit: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  lowStockBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.xl,
    padding: 14,
  },
  lowStockCopy: {
    flex: 1,
    gap: 2,
  },
  lowStockTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  lowStockSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 17,
  },
  restockButton: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  restockButtonText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoCard: {
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  infoText: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
  },
  sectionHeader: {
    gap: 2,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
  movementList: {
    gap: layout.listGap,
  },
  movementRow: {
    borderRadius: radius.xl,
    padding: 14,
    gap: 10,
  },
  movementBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  movementBadgeText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  movementBody: {
    gap: 3,
  },
  movementQuantity: {
    fontSize: 18,
    fontFamily: font.mono.medium,
    fontWeight: "500",
  },
  movementDate: {
    fontSize: 11,
    fontFamily: font.mono.regular,
  },
  movementNote: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 17,
    marginTop: 2,
  },
  deleteSheetBg: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  deleteContent: {
    paddingHorizontal: layout.screenPaddingH,
    alignItems: "center",
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 18,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 6,
  },
  deleteSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 18,
  },
  deletePrimaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  deletePrimaryText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deleteSecondaryButton: {
    width: "100%",
    minHeight: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteSecondaryText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
});
