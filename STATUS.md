# Trackshpr — Status & Next Steps

_Last updated: 2026-04-17_
_Branch: `production-hardening`_

---

## 1. What's done

### 1.1 App (client)
- **Expo SDK 54** • React Native 0.81 • New Architecture on
- **Routing**: Expo Router typed routes; auth-gated `(tabs)` / `(auth)` / `(settings)` groups; public `legal/*` and `(screens)/track-link`, `(screens)/rider-link`
- **State**: TanStack Query + a handful of Zustand stores (theme, toast)
- **Auth**: Google (native on Android dev builds, browser fallback elsewhere) + **Sign in with Apple** (iOS-only, native HIG button)
- **Theming**: full light/dark, persisted
- **Core flows**: onboarding → new delivery → live tracking (customer + rider links) → inventory → analytics → profile
- **Legal pages**: Terms of Service + Privacy Policy, linked from sign-in

### 1.2 Database (Supabase — project `okoszqbrjuwwgtmjcfzt`)
All migrations applied ✓ (including `20260417000000_production_hardening.sql`):

| Table | Purpose |
|---|---|
| `profiles` | Seller account + `is_pro`, `paystack_customer_code`, `paystack_subscription_code`, `pro_since`, `pro_cancelled_at` |
| `orders` / `order_items` / `order_status_events` | Delivery lifecycle |
| `riders` / `customers` / `customer_addresses` | Contacts |
| `products` / `stock_movements` | Inventory |
| `location_pings` | Rider GPS trail |
| `pro_waitlist` | Paywalled-feature interest list |
| `notification_log` ✨ | Every Termii send attempt (status, channel, error) |
| `tracking_link_events` ✨ | Per-token rate-limit counter |

New functions in `public.*`:
- `delete_user()` — cascade-deletes the caller's `auth.users` row (used by the Delete Account UI; Apple tests this)
- `cancel_pro_subscription()` — flips `is_pro = false` + timestamps
- `record_tracking_link_hit(token, ip_hash, window_seconds, max_hits)` — throttle bookkeeping

RLS is ON for every user-owned table; cascade chain from `profiles(id)` cleans everything on account deletion.

### 1.3 Edge Functions (all deployed, ACTIVE)
| Function | Auth | What it does |
|---|---|---|
| `paystack-initialize` | JWT | Opens a Paystack transaction, returns `authorization_url` |
| `paystack-verify` | JWT | Verifies a transaction, flips `is_pro = true` (checks `metadata.user_id`) |
| `paystack-cancel` | JWT | Disables the Paystack subscription + flips `is_pro = false` locally |
| `paystack-webhook` | **No JWT** | HMAC-SHA512 signature verification; the authoritative flip on `charge.success` |
| `send-notification` | JWT | Termii proxy (WA-first, SMS fallback); writes to `notification_log` |
| `public-order-lookup` | **No JWT** | Rate-limited public tracking/rider link lookup (60 req/min per token+IP hash) |

Dashboard: https://supabase.com/dashboard/project/okoszqbrjuwwgtmjcfzt/functions

### 1.4 Observability
- **Sentry** wired via `@sentry/react-native`, gated on `EXPO_PUBLIC_SENTRY_DSN` — no-op until you set a DSN
- Notifier pipes invoke/result/throw errors into Sentry with `event` + `recipientKind` + `orderId` extras
- `notification_log` makes every Termii attempt queryable after the fact
- Settings screen shows a yellow banner when any delivery SMS/WA has failed in the last 24h (`useNotificationFailures`)

### 1.5 App Store readiness
- iOS `usesAppleSignIn: true` + all required `NS*UsageDescription` strings in `app.json`
- **Paystack UI is hidden on iOS** (`canShowPaymentUpgrade()` returns false on `Platform.OS === "ios"`) — iOS users see the Pro waitlist card instead. Apple rejects non-StoreKit digital subscriptions unlocked inside the app.
- Delete account flow hits `delete_user()` → cascade-deletes everything
- `ITSAppUsesNonExemptEncryption: false`

---

## 2. What's NOT set yet (blockers before real launch)

### 2.1 Supabase Function secrets (CRITICAL)
None of the app-level secrets are set on the Edge Functions — the only secrets present are the default Supabase ones (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`). Every payment + notification function will hard-fail until these are added:

```bash
# Paystack (get from https://dashboard.paystack.com/#/settings/developers)
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_... --project-ref okoszqbrjuwwgtmjcfzt
supabase secrets set PAYSTACK_WEBHOOK_SECRET=whsec_... --project-ref okoszqbrjuwwgtmjcfzt
# Pro plan code from the Paystack dashboard (required by paystack-initialize)
supabase secrets set PAYSTACK_PLAN_CODE=PLN_xxxxxxxxxxxx --project-ref okoszqbrjuwwgtmjcfzt

# Termii (https://accounts.termii.com/dashboard)
supabase secrets set TERMII_API_KEY=... --project-ref okoszqbrjuwwgtmjcfzt
supabase secrets set TERMII_SENDER_ID=Trackshpr --project-ref okoszqbrjuwwgtmjcfzt
# Optional overrides (defaults are sane):
# supabase secrets set TERMII_BASE_URL=https://api.ng.termii.com
# supabase secrets set TERMII_SMS_CHANNEL=generic

# Public tracking-link throttle — random 32-byte value, never rotated casually
supabase secrets set TRACKING_LINK_SALT="$(openssl rand -hex 32)" --project-ref okoszqbrjuwwgtmjcfzt
```

### 2.2 Paystack webhook registration
In the Paystack dashboard → Settings → Developers → **Webhooks**, add:
```
https://okoszqbrjuwwgtmjcfzt.supabase.co/functions/v1/paystack-webhook
```
Use `PAYSTACK_WEBHOOK_SECRET` as the signing secret. Until this is registered, `charge.success` and `subscription.disable` events never reach us, so Pro state will drift if a user closes the browser before `paystack-verify` runs.

### 2.3 Paystack Plan
Create a monthly plan in the Paystack dashboard (₦5,000/month per `EXPO_PUBLIC_PRO_MONTHLY_KOBO=500000`). Paste the resulting plan code into `PAYSTACK_PLAN_CODE` above.

### 2.4 App-side env (EAS)
Before an EAS build:
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://okoszqbrjuwwgtmjcfzt.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_KEY --value "sb_publishable_..."
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "998434267774-...apps.googleusercontent.com"
eas secret:create --name EXPO_PUBLIC_TRACKSHPR_WEB_URL --value "https://trackshpr.app"
eas secret:create --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_live_..."
eas secret:create --name EXPO_PUBLIC_PAYMENTS_ENABLED --value "true"   # when ready
# Optional:
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..."
```

### 2.5 iOS Apple sign-in (store side)
- In the Apple Developer portal, enable **Sign in with Apple** capability on the `com.trackshpr.app` App ID
- The `usesAppleSignIn: true` in `app.json` does the native side automatically on an EAS build; it won't work in Expo Go

### 2.6 iOS payments strategy
Paystack is gated off on iOS today. To actually charge iOS users you need **one** of:
1. Ship **StoreKit / `expo-iap`** with an Apple-reviewed subscription SKU at the same price tier. Server-to-server notifications flip `is_pro`. _(Apple takes 15–30%.)_
2. Keep Pro **Android/web-only**. iOS users can sign up on the web, pay there, then log into iOS with the same account. Apple allows this as long as the iOS app never mentions the external purchase option.

No code action yet — just a product decision.

---

## 3. Immediate next steps (ordered)

1. **Set the Supabase Function secrets** from §2.1 above. Until this is done, every Paystack / notification call silently errors.
2. **Register the Paystack webhook** (§2.2) and create the Pro Plan (§2.3).
3. **Test Paystack end-to-end in test mode** on Android:
   - `EXPO_PUBLIC_PAYMENTS_ENABLED=true`, `EXPO_PUBLIC_PAYSTACK_ENV=test`, `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`
   - Walk through Upgrade → complete payment with a test card → watch `profiles.is_pro` flip
   - Force-close the browser before the redirect lands — the webhook should still flip `is_pro`
   - Settings → Account → Cancel Pro → verify `subscription.disable` webhook
4. **Send a real Termii message** from a test order. Inspect `notification_log` and the Edge Function logs. Make sure WhatsApp-first works and SMS fallback kicks in when the WA handoff fails.
5. **Create the Sentry project** and drop the DSN into EAS secrets + local `.env.local`.
6. **Pick an iOS payments path** (§2.6) before an App Store submission.

---

## 4. Medium-term polish

### 4.1 Code / DX
- Pre-existing lint errors in `app/(tabs)/index.tsx`, `orders.tsx`, `riders.tsx`, `src/components/auth/delivery-card.tsx`, and a few onboarding/splash components — mostly `react/no-unescaped-entities` and `react-hooks/exhaustive-deps`. Not blocking but worth a morning.
- `unsafeRpcClient` cast in `supabaseQueries.ts` exists because several RPC return types aren't in the generated `database.ts`. Regenerate types (`supabase gen types typescript --project-id okoszqbrjuwwgtmjcfzt --schema public > src/types/database.ts`) and drop the cast.

### 4.2 Features / product
- Push notifications: `push_token` column exists on `profiles` but the toggle in Settings currently shows "not available yet". Wire `expo-notifications` + Supabase function to fan out order-state pushes.
- Dispatcher web dashboard: web build is already `web.output: "static"`; could host a restricted admin dashboard on Vercel with its own magic-link auth.
- Product packaging: the `products` / inventory side is built but not integrated with the order flow — orders could auto-decrement stock when marked `delivered`.

### 4.3 Reliability
- Webhook is idempotent on `charge.success` (dedup by `reference`), but `subscription.create` path could race with `paystack-verify` if both land. Non-blocking at current scale, worth a look at ≥100 DAU.
- `fetchPublicOrderViaEdge` silently falls back to direct RPC when the Edge Function 5xx's. Once the function is stable in prod, tighten the fallback to only trigger on network failure, not HTTP errors.
- Notification log grows unbounded. Schedule a nightly pg-cron job to delete rows older than 30 days.

### 4.4 Compliance
- Data export: add a "Download my data" row in Settings → Account (GDPR / CCPA / NDPR). The schema is simple enough to do as a single SQL query into a CSV.
- `pro_waitlist` currently captures just `seller_id`; if you start doing outbound on it, revisit consent wording in `legal/privacy.tsx`.

---

## 5. Useful URLs

- **Supabase project**: https://supabase.com/dashboard/project/okoszqbrjuwwgtmjcfzt
- **Edge Functions**: https://supabase.com/dashboard/project/okoszqbrjuwwgtmjcfzt/functions
- **SQL editor**: https://supabase.com/dashboard/project/okoszqbrjuwwgtmjcfzt/sql/new
- **Auth providers**: https://supabase.com/dashboard/project/okoszqbrjuwwgtmjcfzt/auth/providers

---

## 6. Outstanding commits

This session added 6 commits on `production-hardening`:

```
cd9f8ed8 feat(public-links): route tracking lookups through rate-limited Edge Fn
3cd9286d feat(observability): surface Termii failures + pipe errors to Sentry
96707a06 feat(monitoring): wire Sentry error monitoring (optional via DSN)
a2f9b1b3 feat(pro): add in-app Pro cancellation flow
882bbd58 feat(auth): add Sign in with Apple on iOS sign-in screen
3063b5f9 feat(notifier): proxy Termii sends through send-notification Edge Function
```

Plus three earlier commits from the start of this branch:

```
1a772d65 feat(edge): Paystack + Termii + public-lookup Edge Functions
39f29559 feat(hardening): gate iOS Pro, add delete_user + notification_log + throttle
34c6db99 docs: add App Store checklist and deployment guide
```

Ready to open a PR into `main` once you've verified §3.
