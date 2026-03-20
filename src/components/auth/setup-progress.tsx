/**
 * Horizontal step progress indicator for the profile setup flow.
 */
import { StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/src/constants/tokens";

export type StepStatus = "active" | "pending" | "done";

export interface ProgressStep {
  num: string;
  label: string;
  status: StepStatus;
}

interface SetupProgressProps {
  steps: ProgressStep[];
}

function Step({ num, label, status }: ProgressStep) {
  return (
    <View style={styles.item}>
      <View
        style={[
          styles.circle,
          status === "active" && styles.circleActive,
          status === "done" && styles.circleDone,
          status === "pending" && styles.circlePending,
        ]}
      >
        <Text
          style={[
            styles.num,
            status === "active" && { color: colors.white },
            status === "done" && { color: colors.success },
            status === "pending" && { color: colors.textMuted },
          ]}
        >
          {status === "done" ? "✓" : num}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          status === "active" && styles.labelActive,
          status === "done" && styles.labelDone,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Connector({ done = false }: { done?: boolean }) {
  return (
    <View
      style={[styles.connector, done && { backgroundColor: colors.successBg }]}
    />
  );
}

export default function SetupProgress({ steps }: SetupProgressProps) {
  return (
    <View style={styles.row}>
      {steps.map((step, i) => (
        <View key={step.num} style={styles.segment}>
          <Step {...step} />
          {i < steps.length - 1 && <Connector done={step.status === "done"} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingVertical: 14,
    paddingBottom: 6,
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  item: {
    alignItems: "center",
    gap: 5,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: colors.primary },
  circleDone: { backgroundColor: colors.successBg },
  circlePending: { backgroundColor: colors.surfaceContainer },
  num: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  label: {
    fontSize: 9,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    letterSpacing: 0.18,
  },
  labelActive: {
    color: colors.primary,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  labelDone: { color: colors.success },
  connector: {
    width: 24,
    height: 2,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 2,
    marginBottom: 14,
  },
});
