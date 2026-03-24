import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { radius, font } from "@/src/constants/tokens";

export type StepState = "done" | "active" | "pending";

export interface Step {
  label: string;
  state: StepState;
  icon: string;
}

export function ProgressSteps({
  steps,
  lineColor,
  lineWidth,
}: {
  steps: Step[];
  lineColor: string;
  lineWidth: `${number}%`;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressTrackBg,
          { backgroundColor: colors.surfaceContainer },
        ]}
      />
      <View
        style={[
          styles.progressTrackFill,
          { backgroundColor: lineColor, width: lineWidth },
        ]}
      />
      {steps.map((step, i) => {
        const isDone = step.state === "done";
        const isActive = step.state === "active";
        return (
          <View key={i} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                isDone
                  ? {
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    }
                  : isActive
                    ? {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      }
                    : {
                        backgroundColor: colors.surfaceCard,
                        borderColor: colors.surfaceContainer,
                      },
              ]}
            >
              <Text
                style={[
                  styles.progressDotText,
                  isDone
                    ? { color: colors.white }
                    : isActive
                      ? { color: colors.primary }
                      : { color: colors.textMuted },
                ]}
              >
                {isDone ? "✓" : step.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.progressLabel,
                isDone
                  ? {
                      color: colors.success,
                      fontFamily: font.sans.bold,
                      fontWeight: "600",
                    }
                  : isActive
                    ? {
                        color: colors.primary,
                        fontFamily: font.sans.bold,
                        fontWeight: "600",
                      }
                    : {
                        color: colors.textMuted,
                        fontFamily: font.sans.regular,
                      },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  progressTrackBg: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    height: 2,
    zIndex: 0,
  },
  progressTrackFill: {
    position: "absolute",
    top: 10,
    left: 10,
    height: 2,
    zIndex: 1,
    borderRadius: 2,
  },
  progressStep: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  progressLabel: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "500",
  },
});
