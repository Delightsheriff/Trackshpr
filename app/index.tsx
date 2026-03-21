/**
 * Root index — "/"
 *
 * The _layout.tsx auth guard handles all routing decisions.
 * This file exists only because expo-router requires a default export
 * for the root route to be registered. It never renders because
 * the layout always redirects before paint.
 */
export default function RootIndex() {
  return null;
}
