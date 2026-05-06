# Trackshpr Links

Small public web app for Trackshpr customer tracking links, rider action links,
and legal pages.

## Why this repo exists

This app isolates the public-facing surface from the Expo mobile app so link
deployments stay simple and low-risk.

It contains only:

- customer tracking page: `/track/[token]`
- rider action page: `/rider/[token]`
- privacy page: `/legal/privacy`
- terms page: `/legal/terms`

All seller-authenticated workflows remain in the main mobile app repo.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Vercel-ready deployment

## Environment

Copy `.env.example` to `.env.local`.

Required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional:

- `NEXT_PUBLIC_TRACKSHPR_HOME_URL`
- `NEXT_PUBLIC_TRACKSHPR_SUPPORT_EMAIL`
- `NEXT_PUBLIC_TRACKSHPR_PRIVACY_EMAIL`

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## How it talks to Supabase

This app uses server-side route handlers and server utilities to call the
existing public Supabase RPC functions:

- `get_customer_tracking_order`
- `get_rider_link_order`
- `rider_pickup_order`
- `rider_complete_order`
- `rider_fail_order`

That keeps the web repo thin and avoids copying business logic into a second
backend.

## Deploy

Deploy to Vercel as a standard Next.js app.

Set the same environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TRACKSHPR_HOME_URL`
- `NEXT_PUBLIC_TRACKSHPR_SUPPORT_EMAIL`
- `NEXT_PUBLIC_TRACKSHPR_PRIVACY_EMAIL`

## Suggested domain mapping

- `links.trackshpr.app`
- or `trackshpr.app` if this becomes the primary public site

Then point generated URLs to:

- `https://your-domain/track/<customer-token>`
- `https://your-domain/rider/<rider-token>`
