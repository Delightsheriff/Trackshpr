export const PRO_FEATURES = {
  inventory: {
    title: "Inventory tracking",
    description: "Track stock levels and know what needs restocking before customers ask.",
  },
  inventory_analytics: {
    title: "Inventory analytics",
    description: "See top-selling products, product revenue, and low-stock pressure at a glance.",
  },
  order_items: {
    title: "Product-based orders",
    description: "Pick products, capture quantities, and keep stock in sync as orders are delivered.",
  },
  "voice-entry": {
    title: "Voice entry",
    description: "Create deliveries faster with hands-free voice-powered entry.",
  },
  "white-label-branding": {
    title: "White-label branding",
    description: "Show your own brand on tracking pages instead of Trackshpr branding.",
  },
  "brand-customization": {
    title: "Brand customization",
    description: "Choose your accent color and display name for customer-facing pages.",
  },
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;

export function getProFeatureMeta(feature: ProFeatureKey | string) {
  return (
    PRO_FEATURES[feature as ProFeatureKey] ?? {
      title: feature
        .split(/[-_]/g)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      description: "Upgrade to Pro to unlock this feature.",
    }
  );
}
