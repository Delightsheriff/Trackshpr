/**
 * Card — reusable surfaceCard with automatic shadow for light/dark.
 *
 * Usage:
 *   <Card>children</Card>
 *   <Card elevated>children</Card>   // modal-level elevation
 *   <Card flat>children</Card>       // no shadow (use sparingly)
 *
 * Design system: DS §8.1
 */
import { useTheme } from "@/src/stores/themeStore";
import { radius, shadowsLight, shadowsDark } from "@/src/constants/tokens";
import { View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  flat?: boolean;
}

export function Card({ children, style, elevated, flat }: CardProps) {
  const { colors, isDark } = useTheme();

  const shadow = elevated
    ? isDark ? shadowsDark.modal : shadowsLight.modal
    : flat
    ? undefined
    : isDark ? shadowsDark.card : shadowsLight.card;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceCard,
          borderRadius: radius.xl,
          padding: 14,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}
