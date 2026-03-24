/**
 * Account screen — sign out and delete account.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useSession } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor?: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: colors.surfaceContainer, borderless: false }}
      style={styles.settingRow}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor ?? colors.textPrimary} />
      </View>
      <View style={styles.settingBody}>
        <Text style={[styles.settingLabel, { color: danger ? colors.error : colors.textPrimary }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>{sublabel}</Text>
        )}
      </View>
      {onPress && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

export default function AccountScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user.email ?? null);
    });
  }, []);

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 };

  const backBtnShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }, backBtnShadow]}
          android_ripple={{ color: colors.surfaceContainer, borderless: false }}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Email card */}
        {!!email && (
          <View style={[styles.emailCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <View style={[styles.emailIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="mail" size={16} color={colors.primary} />
            </View>
            <View style={styles.emailBody}>
              <Text style={[styles.emailLabel, { color: colors.textMuted }]}>Signed in as</Text>
              <Text style={[styles.emailValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        )}

        {/* Session */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Session</Text>
        <View style={[styles.group, { backgroundColor: colors.surfaceCard }, cardShadow]}>
          <SettingRow
            icon="log-out"
            iconColor={colors.error}
            iconBg={colors.errorBg}
            label="Sign out"
            sublabel="You'll need to sign back in"
            danger
            onPress={() => router.push("/(modals)/sign-out")}
          />
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Danger zone</Text>
        <View style={[styles.group, { backgroundColor: colors.surfaceCard }, cardShadow]}>
          <SettingRow
            icon="trash-2"
            iconColor={colors.error}
            iconBg={colors.errorBg}
            label="Delete account"
            sublabel="Permanently remove your account and data"
            danger
            onPress={() => router.push("/(modals)/delete-account")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
    paddingTop: 10,
  },
  backBtn: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34 },
  headerSpacer: { width: 34 },
  scroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: 16, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.55,
    textTransform: "uppercase",
    marginBottom: 0,
    marginTop: 8,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 8,
  },
  emailIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  emailBody: { flex: 1 },
  emailLabel: { fontSize: 10, fontFamily: font.sans.semiBold, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  emailValue: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600", marginTop: 1 },
  group: { borderRadius: radius.xl, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  settingBody: { flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: -0.14 },
  settingSubLabel: { fontSize: 11, fontFamily: font.sans.regular, marginTop: 1 },
});
