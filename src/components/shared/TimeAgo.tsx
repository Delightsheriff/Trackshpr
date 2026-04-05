/**
 * TimeAgo — relative time display that auto-updates every 60 seconds.
 * Design system: DS §3 (monoXs font), DS §2 (textMuted token)
 *
 * Usage:
 *   <TimeAgo date={order.created_at} />
 *   <TimeAgo date={new Date()} style={{ color: colors.textSecondary }} />
 */
import React, { useState, useEffect } from "react";
import { Text, StyleProp, TextStyle } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font } from "@/src/constants/tokens";

interface TimeAgoProps {
  date: string | Date | number;
  style?: StyleProp<TextStyle>;
}

function formatRelative(date: string | Date | number): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

export const TimeAgo = React.memo(function TimeAgo({
  date,
  style,
}: TimeAgoProps) {
  const { colors } = useTheme();
  const [label, setLabel] = useState(() => formatRelative(date));

  useEffect(() => {
    setLabel(formatRelative(date));
    const id = setInterval(() => setLabel(formatRelative(date)), 60_000);
    return () => clearInterval(id);
  }, [date]);

  return (
    <Text
      style={[
        styles.text,
        { color: colors.textMuted },
        style,
      ]}
    >
      {label}
    </Text>
  );
});

const styles = {
  text: {
    fontSize: 11,
    fontFamily: font.mono.regular,
    fontWeight: "400" as const,
    fontVariant: ["tabular-nums"] as const,
  },
};
