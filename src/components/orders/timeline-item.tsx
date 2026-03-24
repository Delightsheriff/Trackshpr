import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";
import { radius, font } from "@/src/constants/tokens";

export type TLState = "done" | "active" | "error";
export type TagType = "gps" | "photo" | null;

export function TimelineItem({
  state,
  event,
  meta,
  tagType,
  tagLabel,
  hasLine,
  lineColor,
}: {
  state: TLState;
  event: string;
  meta: string;
  tagType?: TagType;
  tagLabel?: string;
  hasLine?: boolean;
  lineColor?: string;
}) {
  const { colors } = useTheme();
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <View style={styles.tlItem}>
      <View style={styles.tlSpine}>
        <View
          style={[
            styles.tlDot,
            isDone
              ? {
                  backgroundColor: colors.successBg,
                  borderColor: colors.success,
                }
              : isError
                ? { backgroundColor: colors.errorBg, borderColor: colors.error }
                : {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  },
          ]}
        >
          {isDone ? (
            <Feather name="check" size={11} color={colors.success} />
          ) : isError ? (
            <Feather name="x" size={11} color={colors.error} />
          ) : (
            <Feather name="truck" size={11} color={colors.primary} />
          )}
        </View>
        {hasLine && (
          <View
            style={[
              styles.tlLine,
              { backgroundColor: lineColor ?? colors.surfaceContainer },
            ]}
          />
        )}
      </View>

      <View style={styles.tlBody}>
        <Text
          style={[
            styles.tlEvent,
            { color: colors.textPrimary },
            isError && { color: colors.error },
          ]}
        >
          {event}
        </Text>
        <Text style={[styles.tlMeta, { color: colors.textMuted }]}>{meta}</Text>
        {tagType && tagLabel && (
          <View
            style={[
              styles.tlTag,
              tagType === "gps"
                ? { backgroundColor: colors.infoBg }
                : { backgroundColor: colors.warningBg },
            ]}
          >
            <Text
              style={[
                styles.tlTagText,
                tagType === "gps"
                  ? { color: colors.info }
                  : { color: colors.warning },
              ]}
            >
              {tagLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tlItem: {
    flexDirection: "row",
    gap: 12,
  },
  tlSpine: {
    width: 24,
    alignItems: "center",
  },
  tlDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tlLine: {
    width: 1.5,
    height: 16,
    marginTop: 2,
  },
  tlBody: {
    flex: 1,
    paddingBottom: 14,
  },
  tlEvent: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    marginBottom: 2,
  },
  tlMeta: {
    fontSize: 10,
    fontFamily: font.mono.regular,
  },
  tlTag: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  tlTagText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
});
