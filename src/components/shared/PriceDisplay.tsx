/**
 * PriceDisplay — Nigerian Naira formatted price, always consistent.
 * Design system: DS §3 (monoSm/monoMd/monoXs), DS §2 (textPrimary token)
 *
 * Usage:
 *   <PriceDisplay amount={15000} />
 *   <PriceDisplay amount={15000} size="lg" />
 *   <PriceDisplay amount={15000} size="xs" color={colors.textSecondary} />
 */
import React from "react";
import { Text, StyleProp, TextStyle } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

interface PriceDisplayProps {
  amount: number;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  style?: StyleProp<TextStyle>;
}

const formatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const sizeStyles: Record<
  NonNullable<PriceDisplayProps["size"]>,
  { fontSize: number; fontFamily: string; fontWeight: "400" | "500" | "700" }
> = {
  xs: { fontSize: 11, fontFamily: font.mono.regular, fontWeight: "400" },
  sm: { fontSize: 14, fontFamily: font.mono.regular, fontWeight: "400" },
  md: { fontSize: 22, fontFamily: font.mono.medium, fontWeight: "500" },
  lg: { fontSize: 40, fontFamily: font.mono.medium, fontWeight: "700" },
};

export const PriceDisplay = React.memo(function PriceDisplay({
  amount,
  size = "sm",
  color,
  style,
}: PriceDisplayProps) {
  const { colors } = useTheme();
  const s = sizeStyles[size];

  return (
    <Text
      style={[
        s,
        { color: color ?? colors.textPrimary, fontVariant: ["tabular-nums"] },
        style,
      ]}
    >
      ₦{formatter.format(amount)}
    </Text>
  );
});
