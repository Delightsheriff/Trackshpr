import { font, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Rider } from "@/src/stores/dataStore";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SWIPE_THRESHOLD = -80;

export function SwipeableRiderCard({
  rider,
  colorIdx,
}: {
  rider: Rider;
  colorIdx: number;
}) {
  const { colors, isDark } = useTheme();

  // Avatar color cycling — computed inside component so they use live tokens
  const avatarColors = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg, fg: colors.success },
    { bg: colors.warningBg, fg: colors.warning },
  ];

  const cardShadow = isDark
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
        shadowRadius: 8,
        elevation: 2,
      };

  const translateX = useSharedValue(0);
  const isSwiped = useSharedValue(false);
  const avatarColor = avatarColors[colorIdx % avatarColors.length];

  const handleDelete = () => {
    // snap back first, then open delete sheet
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    isSwiped.value = false;
    router.push({
      pathname: "/(modals)/delete-rider",
      params: { id: rider.id, name: rider.name },
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (!isSwiped.value) {
        translateX.value = Math.max(
          Math.min(e.translationX, 0),
          SWIPE_THRESHOLD,
        );
      } else {
        translateX.value = Math.max(
          Math.min(e.translationX + SWIPE_THRESHOLD, 0),
          SWIPE_THRESHOLD,
        );
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD / 2) {
        translateX.value = withSpring(SWIPE_THRESHOLD, {
          damping: 20,
          stiffness: 300,
        });
        isSwiped.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        isSwiped.value = false;
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.swipeContainer}>
      {/* Delete zone — revealed behind card on swipe */}
      <Pressable
        style={[styles.deleteZone, { backgroundColor: colors.error }]}
        onPress={handleDelete}
      >
        <Feather name="trash-2" size={20} color="#fff" />
        <Text style={[styles.deleteLabel, { color: "rgba(255,255,255,0.85)" }]}>
          Delete
        </Text>
      </Pressable>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.riderCard,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
            cardStyle,
          ]}
        >
          {/* Tap zone to open rider detail */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              router.push({
                pathname: "/(screens)/rider-detail",
                params: { id: rider.id },
              })
            }
          />
          {/* Avatar */}
          <View
            style={[styles.riderAvatar, { backgroundColor: avatarColor.bg }]}
          >
            <Text style={[styles.riderAvatarText, { color: avatarColor.fg }]}>
              {initials(rider.name)}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.riderBody}>
            <Text style={[styles.riderName, { color: colors.textPrimary }]}>
              {rider.name}
            </Text>
            <Text style={[styles.riderPhone, { color: colors.textMuted }]}>
              {rider.phone}
            </Text>
            <View style={styles.riderStats}>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: colors.successBg },
                ]}
              >
                <Text style={[styles.statBadgeText, { color: colors.success }]}>
                  {rider.total_deliveries} delivered
                </Text>
              </View>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <Text
                  style={[
                    styles.statBadgeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  0 failed
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.riderActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.successBg }]}
              android_ripple={{ color: colors.success, borderless: false }}
            >
              <Feather name="phone" size={16} color={colors.success} />
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: colors.surfaceContainer },
              ]}
              android_ripple={{ color: colors.textMuted, borderless: false }}
            >
              <Feather
                name="more-horizontal"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    marginBottom: layout.listGap,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  deleteZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  deleteLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.36,
    textTransform: "uppercase",
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  riderAvatarText: {
    fontSize: 16,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  riderBody: { flex: 1, minWidth: 0 },
  riderName: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  riderPhone: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 2,
  },
  riderStats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  statBadge: {
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statBadgeText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  riderActions: {
    flexDirection: "column",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
