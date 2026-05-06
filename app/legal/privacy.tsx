import {
  colors,
  layout,
  radius,
  type as typography,
} from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LAST_UPDATED = "April 2026";
const CONTACT_EMAIL = "privacy@trackshpr.app";

interface Section {
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Who we are",
    body: [
      "Trackshpr (\"we\", \"us\") helps Nigerian social commerce sellers track deliveries and share real-time tracking links with their customers and riders.",
      "You can reach us at " + CONTACT_EMAIL + ".",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Account information: your email address from Google sign-in, your business name, phone number(s), city, pickup address, and optional brand logo.",
      "Order information: the items, delivery address, fees, and photos you attach to orders you create.",
      "Customer and rider contacts: the names, phone numbers, and addresses you store in Trackshpr to use across deliveries.",
      "Location data: if you grant permission, we capture rider location pings while a delivery is active so you and your customer can see the rider on a map. We do not track location in the background when no delivery is active.",
      "Device tokens: if you enable push notifications, a device token that lets us send delivery updates.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To run the service: create and manage orders, show delivery status, and route tracking links to the right people.",
      "To send order notifications to the customer phone number and rider phone number you assign to each order, via SMS or WhatsApp (through Termii).",
      "To authenticate your account (via Google sign-in and Supabase Auth).",
      "To process Pro subscription payments (via Paystack) when you choose to subscribe.",
      "To operate, secure, and improve the service, and to comply with legal obligations.",
    ],
  },
  {
    title: "4. Who we share information with",
    body: [
      "Supabase — our database and authentication provider, stores your account, order, customer, and rider records.",
      "Google — identity provider for sign-in.",
      "Termii — sends SMS and WhatsApp notifications on your behalf.",
      "Paystack — processes payments when you subscribe to Pro.",
      "We do not sell your information. We do not share customer phone numbers or delivery addresses with anyone other than the sub-processors above.",
    ],
  },
  {
    title: "5. Public tracking links",
    body: [
      "When you create an order, we generate two unguessable links: a rider link and a customer tracking link.",
      "Anyone who has a link can view the order details and live status. Treat these links the way you would a delivery receipt — don't post them publicly.",
      "The links stop working once you delete the order from your account.",
    ],
  },
  {
    title: "6. Data retention",
    body: [
      "We keep your account and order data for as long as your account is active.",
      "When you delete your account from Settings → Account, we delete your profile, your customers, riders, orders, and all associated photos within 30 days.",
    ],
  },
  {
    title: "7. Your rights",
    body: [
      "You can access, correct, or export your data, and close your account at any time.",
      "To request data portability or exercise any right under the Nigeria Data Protection Act 2023 (NDPA) or GDPR, email " +
        CONTACT_EMAIL +
        ".",
    ],
  },
  {
    title: "8. Security",
    body: [
      "We store credentials using Expo SecureStore (iOS Keychain / Android Keystore).",
      "We use Supabase Row-Level Security so your records are isolated from other sellers.",
      "No system is perfectly secure. If we discover a breach that affects you, we'll notify you promptly.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "Trackshpr is not directed to children under 13, and we do not knowingly collect their information.",
    ],
  },
  {
    title: "10. Changes to this policy",
    body: [
      "We may update this policy from time to time. When we do, we update the \"last updated\" date and, for significant changes, notify you in the app.",
    ],
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const canGoBack = Platform.OS !== "web";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Last updated · {LAST_UPDATED}</Text>
        <Text style={styles.title}>Your data, handled carefully.</Text>
        <Text style={styles.lead}>
          This policy explains what Trackshpr collects, why we collect it, and
          what choices you have.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((paragraph, index) => (
              <Text key={index} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactLabel}>Questions?</Text>
          <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 8,
    gap: 14,
  },
  eyebrow: {
    ...typography.labelXs,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  title: {
    ...typography.headingLg,
    color: colors.textPrimary,
    marginTop: 2,
  },
  lead: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  section: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  body: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  contactCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
  },
  contactLabel: {
    ...typography.labelSm,
    color: colors.primary,
  },
  contactEmail: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
});
