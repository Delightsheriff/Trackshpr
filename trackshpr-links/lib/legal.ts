import { env } from "@/lib/env";

export const privacySections = [
  {
    title: "1. Who we are",
    body: [
      "Trackshpr helps sellers manage deliveries and share real-time tracking links with customers and riders.",
      `You can reach us at ${env.privacyEmail}.`,
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Account information such as sign-in email, business details, phone numbers, and optional branding.",
      "Order information such as delivery items, addresses, fees, and photos you attach.",
      "Customer and rider information such as names, phone numbers, and addresses you store for deliveries.",
      "Location data when a rider flow submits location updates during an active delivery.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To run the service, route tracking links, and show delivery status.",
      "To send delivery notifications to customers and riders.",
      "To authenticate accounts and operate subscriptions.",
      "To secure, improve, and legally operate the service.",
    ],
  },
  {
    title: "4. Public tracking links",
    body: [
      "Tracking and rider links are designed to be hard to guess, but anyone with the link can view the related delivery surface.",
      "Treat those links like a delivery receipt and avoid posting them publicly.",
    ],
  },
  {
    title: "5. Your rights",
    body: [
      "You can request access, correction, export, or deletion of your data.",
      `For privacy questions or rights requests, email ${env.privacyEmail}.`,
    ],
  },
];

export const termsSections = [
  {
    title: "1. Agreement",
    body: [
      "By using Trackshpr, you agree to these Terms of Service.",
      "You must be legally allowed to use the service in your jurisdiction.",
    ],
  },
  {
    title: "2. Your account",
    body: [
      "You are responsible for the accuracy of your account data and the delivery contacts you add.",
      "We may suspend accounts that abuse the service or put others at risk.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "Do not use Trackshpr for illegal goods, scams, harassment, or abuse of customer contact data.",
      "Do not attempt to bypass access controls or rate limits.",
    ],
  },
  {
    title: "4. Availability",
    body: [
      "We aim for reliable service but cannot guarantee uninterrupted availability.",
      "Third-party outages can affect sign-in, storage, notifications, or payments.",
    ],
  },
  {
    title: "5. Contact",
    body: [`Questions about these terms? Email ${env.supportEmail}.`],
  },
];
