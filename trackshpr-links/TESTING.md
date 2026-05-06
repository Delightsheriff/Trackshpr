# Trackshpr Links Testing Guide

This file is the practical checklist for validating the new public-links app
before you point production rider/customer URLs at it.

## 1. Setup

Create `trackshpr-links/.env.local` with:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_TRACKSHPR_HOME_URL=https://trackshpr.app
NEXT_PUBLIC_TRACKSHPR_SUPPORT_EMAIL=support@trackshpr.app
NEXT_PUBLIC_TRACKSHPR_PRIVACY_EMAIL=privacy@trackshpr.app
```

Install and run:

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
```

## 2. Smoke Test

Verify these routes load:

- `/`
- `/legal/privacy`
- `/legal/terms`
- `/track/<valid-customer-token>`
- `/rider/<valid-rider-token>`

Verify invalid tokens show the not-found state:

- `/track/not-a-real-token`
- `/rider/not-a-real-token`

## 3. Customer Tracking Flow

Use a real customer token from your existing database.

Check:

- seller name displays correctly
- logo renders if present
- order number displays
- item name displays
- delivery fee displays when present
- delivery address displays when present
- timeline renders in chronological order
- contact seller button works when a seller phone exists

Regression checks:

- delivered orders show a delivered state instead of a pending-looking state
- pages without a logo still render cleanly
- pages without a delivery fee do not break layout

## 4. Rider Link Flow

Use a real rider token from your existing database.

Check:

- rider page loads with customer name, item, and address
- "I've Picked Up the Item" appears when status is `pending`
- "Delivery Complete" appears when status is `picked_up` or `in_transit`
- "Report a problem" opens the modal
- reporting a problem updates the order to `failed`
- after success, the timeline reflects the new state

Location behavior:

- allow location permission once and verify the action still succeeds
- deny location permission and verify the action still succeeds without coords

## 5. Polling / Freshness

Both public pages poll every 15 seconds.

Check:

- load the same order in two browser tabs
- update the order from the mobile app or the second rider page
- confirm the first page refreshes itself within one polling cycle

## 6. Legal Pages

Check:

- privacy page loads
- terms page loads
- support/privacy emails render from env vars
- pages are readable on mobile width

## 7. Production Preflight

Before going live on Vercel:

1. Set all env vars in Vercel.
2. Deploy a preview build.
3. Test one real customer token in preview.
4. Test one real rider token in preview.
5. Test all three rider actions:
   - pickup
   - deliver
   - fail
6. Confirm no unexpected CORS or Supabase permission errors appear in logs.

## 8. Known Follow-Ups

This scaffold intentionally favors stability and simplicity.

Not included yet:

- server-side rate limiting wrapper around lookups
- realtime subscriptions
- branded loading skeletons
- analytics / observability hooks
- custom domain redirect strategy

Those can be added after the core deployment path is proven stable.
