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
const CONTACT_EMAIL = "support@trackshpr.app";

interface Section {
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Agreement",
    body: [
      "By creating an account or using Trackshpr (the \"Service\"), you agree to these Terms of Service. If you do not agree, do not use the Service.",
      "You must be at least 18 years old, or the age of majority in your country, to use Trackshpr.",
    ],
  },
  {
    title: "2. Your account",
    body: [
      "You are responsible for the accuracy of your account information and for keeping your Google sign-in secure.",
      "You are responsible for the activity of riders and staff you give access to your orders.",
      "We may suspend or close accounts that violate these Terms, abuse the Service, or put other users at risk.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "Do not use Trackshpr for illegal goods, scams, or to harass customers or riders.",
      "Do not attempt to probe, scan, or reverse engineer the Service, or to circumvent rate limits or access controls.",
      "Do not use tracking links or customer contact data to send marketing messages customers did not consent to.",
    ],
  },
  {
    title: "4. Your data and content",
    body: [
      "You own the order, customer, and rider data you put into Trackshpr. You grant us a limited license to store, process, and display it solely to operate the Service for you.",
      "You are responsible for having the right to store customer phone numbers and addresses, and for handling that data in line with applicable law (for example, NDPA 2023 in Nigeria).",
    ],
  },
  {
    title: "5. Pro subscription",
    body: [
      "Trackshpr offers a Pro subscription that unlocks additional features. Pricing is shown in-app before you subscribe.",
      "Payments are processed by Paystack. We never see or store your full card details.",
      "Subscriptions renew monthly unless cancelled. You can cancel from Settings → Account at any time; your Pro features remain active until the end of the billing period you've already paid for.",
      "Except where required by law, subscription fees already paid are non-refundable.",
    ],
  },
  {
    title: "6. Notifications to customers and riders",
    body: [
      "When you create an order, we send SMS and/or WhatsApp notifications to the rider and customer phone numbers you supply, via Termii.",
      "You confirm that the phone numbers you enter belong to people who have agreed to receive delivery updates from your business.",
      "Standard carrier charges may apply to recipients.",
    ],
  },
  {
    title: "7. Availability",
    body: [
      "We work hard to keep Trackshpr available, but we do not guarantee uninterrupted service. Planned maintenance, provider outages (Supabase, Paystack, Termii, Google), and force-majeure events can affect availability.",
    ],
  },
  {
    title: "8. Intellectual property",
    body: [
      "The Trackshpr name, logo, app, and code are owned by us. These Terms do not grant you any right to use our brand outside the Service.",
    ],
  },
  {
    title: "9. Disclaimer",
    body: [
      "The Service is provided \"as is\" without warranties of any kind. Trackshpr is a logistics tool — we are not the carrier, and we do not guarantee that any delivery will arrive, arrive on time, or arrive intact.",
    ],
  },
  {
    title: "10. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Trackshpr is not liable for lost profits, lost revenue, or indirect, incidental, or consequential damages arising from your use of the Service.",
      "Our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim, or NGN 10,000, whichever is higher.",
    ],
  },
  {
    title: "11. Changes",
    body: [
      "We may update these Terms from time to time. We will update the \"last updated\" date and, for material changes, notify you in the app. Continued use of the Service after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "12. Governing law",
    body: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes that can't be resolved informally will be handled in the courts of Lagos State.",
    ],
  },
  {
    title: "13. Contact",
    body: [
      "Questions about these Terms? Email " + CONTACT_EMAIL + ".",
    ],
  },
];

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Last updated · {LAST_UPDATED}</Text>
        <Text style={styles.title}>The rules of the road.</Text>
        <Text style={styles.lead}>
          Short, plain-language terms for using Trackshpr to run deliveries for
          your business.
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
