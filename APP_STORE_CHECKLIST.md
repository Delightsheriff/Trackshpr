# App Store Readiness Checklist

Everything that needs to be true before submitting Trackshpr to the App Store
and Google Play. Ordered roughly by how early you should handle it.

Last updated: April 2026.

---

## 1. App identity

- [x] `app.json` → `expo.ios.bundleIdentifier` set to `com.trackshpr.app`.
- [x] `app.json` → `expo.android.package` set to `com.trackshpr.app`.
- [x] `app.json` → `expo.version` reflects the current release (bump this every submission).
- [ ] Add `expo.ios.buildNumber` and `expo.android.versionCode`. EAS can
      auto-increment these — run `eas build:configure` and set
      `"autoIncrement": "version"` in `eas.json`.
- [x] Icons and splash are wired via `generated-assets/icons/*`.

## 2. Required metadata (both stores)

Prepare these in the App Store Connect / Play Console listings before you
upload a build. They are the most common sources of rejection.

- [ ] **App name**: "Trackshpr"
- [ ] **Subtitle / Short description** (iOS 30 chars, Android 80 chars):
      e.g. "Delivery tracking for sellers"
- [ ] **Full description** (4000 chars). Emphasize: tracking links to
      customers, rider links, WhatsApp/SMS notifications via Termii,
      Pro subscription for inventory + analytics.
- [ ] **Keywords** (iOS only, 100 chars): `delivery, tracking, logistics,
      dispatch, Nigeria, whatsapp, social commerce, rider, courier`
- [ ] **Support URL**: must resolve (e.g. `https://trackshpr.app/support`).
- [ ] **Marketing URL** (iOS only): optional but recommended.
- [ ] **Privacy Policy URL**: must resolve and match the in-app policy.
      The web build exports `/legal/privacy` as a static page — point the
      store listing at `https://trackshpr.app/legal/privacy`.
- [ ] **Terms of Service URL**: `https://trackshpr.app/legal/terms`.
- [ ] **Category**: iOS "Business" (Productivity as secondary);
      Android "Business".
- [ ] **Content rating**: answer the questionnaires honestly — no adult
      content, no user-generated content broadcast publicly (tracking
      links are unguessable and receiver-only).

## 3. Screenshots and preview

- [ ] **iOS screenshots**: 6.7" (iPhone 15 Pro Max) and 6.5" required.
      Use Xcode simulator → Device → Screenshots, or the preview build on
      a real device.
- [ ] **Android screenshots**: phone + 7" tablet. Phone must have at
      least 2 images.
- [ ] Screenshots must not show placeholder text, Lorem Ipsum, test
      card numbers, or Anthropic/Claude attribution.
- [ ] **App preview video** (optional for iOS, recommended).

## 4. Permissions and usage strings

iOS will reject the build if any `NS*UsageDescription` is missing for an
API the binary touches. These are set in `app.json` → `expo.ios.infoPlist`:

- [x] `NSCameraUsageDescription` — order photo capture.
- [x] `NSPhotoLibraryUsageDescription` — picking existing photos.
- [x] `NSPhotoLibraryAddUsageDescription` — saving delivery photos.
- [x] `NSLocationWhenInUseUsageDescription` — rider live map pings.
- [x] `NSMicrophoneUsageDescription` — voice entry (Pro).
- [x] `ITSAppUsesNonExemptEncryption: false` — skips the export
      compliance prompt since we only use HTTPS (no custom crypto).

Android permissions auto-derive from the libraries in use. Verify with
`eas build --platform android --profile preview` and inspect
`android/app/src/main/AndroidManifest.xml`.

## 5. Account and data controls (required by both stores)

- [x] **Account deletion in-app** — Settings → Account → Delete account
      (`app/(settings)/account.tsx` + `(modals)/delete-account.tsx`).
      Apple rejects apps that require email-only deletion. Confirm the
      flow works against a real Supabase row before submitting.
- [x] **Export / access data** — privacy policy section 7 offers
      `privacy@trackshpr.app` for NDPA/GDPR requests. Ensure that
      mailbox is monitored.
- [ ] **Sign-in**: Google-only. If you ever add a second provider (email,
      Apple) Apple requires "Sign in with Apple" as an option. Until
      then Google sign-in alone is allowed.

## 6. Payments

Paystack is a third-party payment for **digital services** (Pro
subscription). Apple's IAP rules:

- [ ] If the Pro subscription unlocks features **inside** the iOS app,
      Apple requires StoreKit / in-app purchases — Paystack will be
      rejected on iOS. Options:
      1. Gate all Pro CTAs on iOS behind `Platform.OS !== "ios"` until
         IAP is implemented (current `EXPO_PUBLIC_PAYMENTS_ENABLED=false`
         default already hides them, but re-check after enabling).
      2. Implement `expo-in-app-purchases` / `react-native-iap` for iOS
         and keep Paystack as the Android + web flow.
      3. Ship iOS with only free + waitlist (today's default).
- [ ] Android: Paystack is allowed as long as you disclose it clearly in
      the listing. No Google Play Billing required for NGN-denominated
      sellers.

Whichever path you pick, update `pro-upgrade.tsx` before the iOS
submission.

## 7. Build and submit

- [ ] `npx tsc --noEmit` — clean.
- [ ] `npx expo start --web --clear` — smoke test the web build.
- [ ] `eas build --platform ios --profile production`.
- [ ] `eas build --platform android --profile production`.
- [ ] `eas submit --platform ios` → uploads to App Store Connect.
- [ ] `eas submit --platform android` → uploads to Play Console.
- [ ] In App Store Connect: fill in the App Privacy questionnaire. Data
      collected: email (Google sign-in), phone, address, photos, coarse
      location, usage data. All linked to user identity. None used for
      tracking across apps.
- [ ] Select the build in App Store Connect and submit for review.

## 8. After approval

- [ ] Flip `EXPO_PUBLIC_PAYMENTS_ENABLED` to `true` only after
      Paystack Edge Functions are deployed and the Pro webhook flow is
      verified with at least one end-to-end test transaction.
- [ ] Monitor crash reports (Expo updates dashboard or Sentry).
- [ ] Keep the `LAST_UPDATED` strings in `app/legal/*.tsx` in sync with
      material changes to data handling or pricing.
