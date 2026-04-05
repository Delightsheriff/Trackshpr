import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { font, layout, radius } from "@/src/constants/tokens";
import { formatNaira, type ProductUnit } from "@/src/lib/inventory";
import { useTheme } from "@/src/stores/themeStore";

interface ParsedVoiceProduct {
  name: string;
  price: number;
  quantity: number;
  unit: ProductUnit;
}

interface VoiceProductEntryProps {
  onApplyParsedResult: (value: ParsedVoiceProduct) => void;
}

async function mockParseVoiceEntry(): Promise<ParsedVoiceProduct> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  // TODO: Replace with Groq Whisper transcription + Groq LLM parsing
  return {
    name: "Test Product",
    price: 5000,
    quantity: 10,
    unit: "piece",
  };
}

export default function VoiceProductEntry({
  onApplyParsedResult,
}: VoiceProductEntryProps) {
  const { colors, isDark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceProduct | null>(null);

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

  const statusLabel = useMemo(() => {
    if (isProcessing) return "Processing voice note";
    if (isRecording) return "Recording product details";
    return "Voice entry";
  }, [isProcessing, isRecording]);

  const statusCopy = useMemo(() => {
    if (isProcessing) {
      return "We're using a placeholder parser for now and will show the draft result below.";
    }
    if (isRecording) {
      return "Tap again to stop and parse your product details into the form.";
    }
    return "Use the mic to draft a product, then review every field before saving.";
  }, [isProcessing, isRecording]);

  const handleMicPress = async () => {
    if (isProcessing) return;

    if (!isRecording) {
      setParsedResult(null);
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      const parsed = await mockParseVoiceEntry();
      setParsedResult(parsed);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Feather name="mic" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{statusLabel}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{statusCopy}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleMicPress}
        disabled={isProcessing}
        style={[
          styles.micButton,
          {
            backgroundColor: isRecording ? colors.errorBg : colors.surfaceContainer,
          },
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            <Feather
              name={isRecording ? "square" : "mic"}
              size={16}
              color={isRecording ? colors.error : colors.primary}
            />
            <Text
              style={[
                styles.micButtonText,
                { color: isRecording ? colors.error : colors.primary },
              ]}
            >
              {isRecording ? "Stop recording" : "Start voice entry"}
            </Text>
          </>
        )}
      </Pressable>

      {parsedResult ? (
        <View style={[styles.resultCard, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.resultLabel, { color: colors.primary }]}>Parsed result</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={[styles.resultKey, { color: colors.textMuted }]}>Name</Text>
              <Text style={[styles.resultValue, { color: colors.textPrimary }]}>
                {parsedResult.name}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultKey, { color: colors.textMuted }]}>Price</Text>
              <Text style={[styles.resultValue, { color: colors.textPrimary }]}>
                {formatNaira(parsedResult.price)}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultKey, { color: colors.textMuted }]}>Quantity</Text>
              <Text style={[styles.resultValue, { color: colors.textPrimary }]}>
                {parsedResult.quantity}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultKey, { color: colors.textMuted }]}>Unit</Text>
              <Text style={[styles.resultValue, { color: colors.textPrimary }]}>
                {parsedResult.unit}
              </Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <Pressable
              onPress={() => setParsedResult(null)}
              style={[styles.secondaryAction, { backgroundColor: colors.surfaceCard }]}
            >
              <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>
                Clear
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onApplyParsedResult(parsedResult)}
              style={[styles.primaryAction, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryActionText}>Apply to form</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  sub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  micButton: {
    minHeight: 46,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  micButtonText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  resultCard: {
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
  },
  resultLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  resultGrid: {
    gap: 10,
  },
  resultItem: {
    gap: 2,
  },
  resultKey: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  resultValue: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  resultActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  primaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
