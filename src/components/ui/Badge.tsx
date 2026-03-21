/**
 * Badge — status pill / capsule with dot prefix.
 *
 * Usage:
 *   <Badge status="in_transit" />
 *   <Badge label="Pending" fg={colors.warning} bg={colors.warningBg} />
 *
 * Design system: DS §8.4, §2.4
 */
import { useTheme } from "@/src/stores/themeStore";
import { font, radius } from "@/src/constants/tokens";
import { Text, View, ViewStyle } from "react-native";

export type BadgeStatus = "in_transit" | "pending" | "delivered" | "failed";

interface BadgeProps {
  status?: BadgeStatus;
  label?: string;
  fg?: string;
  bg?: string;
  style?: ViewStyle;
}

function buildStatusMap(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    in_transit: { label: "In Transit", fg: colors.info,    bg: colors.infoBg,    emoji: "📦" },
    pending:    { label: "Pending",    fg: colors.warning, bg: colors.warningBg, emoji: "🛍️" },
    delivered:  { label: "Delivered", fg: colors.success, bg: colors.successBg, emoji: "✅" },
    failed:     { label: "Failed",    fg: colors.error,   bg: colors.errorBg,   emoji: "❌" },
  } as const;
}

export function Badge({ status, label, fg, bg, style }: BadgeProps) {
  const { colors } = useTheme();

  let fgColor: string;
  let bgColor: string;

  if (status) {
    const map = buildStatusMap(colors);
    fgColor = map[status].fg;
    bgColor = map[status].bg;
  } else {
    fgColor = fg ?? colors.textMuted;
    bgColor = bg ?? colors.surfaceContainer;
  }

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.full, gap: 4, alignSelf: "flex-start" }, { backgroundColor: bgColor }, style]}>
      <View style={[{ width: 5, height: 5, borderRadius: radius.full }, { backgroundColor: fgColor }]} />
      <Text style={[{ fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.2, textTransform: "uppercase" }, { color: fgColor }]}>
        {label ?? (status ? buildStatusMap(colors)[status].label : "")}
      </Text>
    </View>
  );
}
