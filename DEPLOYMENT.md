# Trackshpr Deployment Guide

How to deploy the three surfaces of Trackshpr:

1. **Web** — static export, hosted on Vercel (or any static host). Serves
   the public tracking pages (`/track-link`, `/rider-link`) and the
   legal pages (`/legal/privacy`, `/legal/terms`).
2. **iOS + Android** — EAS builds, submitted via `eas submit`.
3. **Supabase Edge Functions** — server-side Paystack init/verify that
   keep the secret key out of the client.

---

## 0. Prerequisites

```bash
npm i -g eas-cli supabase
eas login
supabase login
```

Create `.env.local` from `.env.example` and fill in real values. Anything
committed to git must be `.env.example`-safe — never commit `.env.local`.

For EAS, set the same variables as **EAS Secrets**:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://...supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_KEY --value "..."
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "..."
eas secret:create --name EXPO_PUBLIC_TRACKSHPR_WEB_URL --value "https://trackshpr.app"
eas secret:create --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_test_..."
eas secret:create --name EXPO_PUBLIC_PAYMENTS_ENABLED --value "false"
```

---

## 1. Web (static export → Vercel)

Trackshpr's web build is a **static export** (`app.json` → `web.output:
"static"`). This matters because:

- Public tracking links (`trackshpr.app/track-link?token=...`) are
  crawlable HTML that customers can open from an SMS/WhatsApp message
  without waiting on a Metro bundle.
- Legal pages can be linked from the App Store / Play listings as
  plain URLs — required by both stores.

### 1.1 Build locally

```bash
npx expo export --platform web
```

Artifacts land in `dist/`. Inspect `dist/track-link.html`,
`dist/rider-link.html`, `dist/legal/privacy.html`,
`dist/legal/terms.html` before deploying.

### 1.2 Deploy to Vercel

One-time setup:

```bash
npm i -g vercel
vercel link   # link the repo to a Vercel project
```

Vercel settings:

- **Framework preset**: Other
- **Build command**: `npx expo export --platform web`
- **Output directory**: `dist`
- **Install command**: `npm ci`
- **Node.js version**: 20.x

Environment variables (Project → Settings → Environment Variables) —
add every `EXPO_PUBLIC_*` from `.env.example`, at minimum the Supabase
pair and the web URL. Mirror production vs preview.

Deploy:

```bash
vercel --prod
```

### 1.3 DNS

Point `trackshpr.app` and `www.trackshpr.app` at Vercel. Add the domain
in Vercel → Project → Domains and follow the DNS instructions. Vercel
issues the TLS cert automatically.

Once DNS resolves, verify:

- `https://trackshpr.app` → redirects or serves the landing (currently
  the root redirects to sign-in; acceptable for MVP).
- `https://trackshpr.app/legal/privacy` → loads.
- `https://trackshpr.app/legal/terms` → loads.
- `https://trackshpr.app/track-link?token=TEST` → loads with the
  "order not found" state (proves the route exists).

### 1.4 Alternative hosts

Any static host works: Netlify (same build + output dir),
Cloudflare Pages (`npx expo export --platform web` + publish `dist`),
or even a Supabase Storage bucket fronted by a CDN. Vercel is
recommended because SPA fallbacks "just work" and preview deploys give
you a URL per PR.

---

## 2. Supabase Edge Functions (Paystack)

The Paystack **secret key** must never ship in the client bundle. Two
Edge Functions hold it: one to initialize a transaction, one to verify
it. The client calls these via `supabase.functions.invoke()` and only
ever sees the returned `authorization_url` and `reference`.

### 2.1 Skeleton

```
supabase/
  functions/
    paystack-initialize/
      index.ts
    paystack-verify/
      index.ts
```

`paystack-initialize/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { user_id, email, amount, plan, callback_url } = await req.json();

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      callback_url,
      metadata: { user_id, plan },
    }),
  });

  const body = await res.json();
  if (!body.status) {
    return new Response(JSON.stringify({ error: body.message }), { status: 400 });
  }

  return new Response(JSON.stringify({
    authorization_url: body.data.authorization_url,
    reference: body.data.reference,
  }), { headers: { "Content-Type": "application/json" } });
});
```

`paystack-verify/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { reference } = await req.json();

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
  );
  const body = await res.json();

  if (!body.status || body.data.status !== "success") {
    return new Response(JSON.stringify({ status: "failed" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = body.data.metadata?.user_id;
  if (userId) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await admin
      .from("profiles")
      .update({ is_pro: true, pro_since: new Date().toISOString() })
      .eq("id", userId);
  }

  return new Response(JSON.stringify({ status: "success" }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 2.2 Deploy

```bash
supabase link --project-ref okoszqbrjuwwgtmjcfzt
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx
supabase functions deploy paystack-initialize
supabase functions deploy paystack-verify
```

The client already points at these by default via
`EXPO_PUBLIC_PAYSTACK_INIT_ENDPOINT` and
`EXPO_PUBLIC_PAYSTACK_VERIFY_ENDPOINT`.

### 2.3 Webhook (recommended, not required for MVP)

`purchasePro()` verifies synchronously after the redirect. For a robust
flow, also add a Paystack webhook at `POST /functions/v1/paystack-webhook`
that flips `profiles.is_pro` when Paystack fires `charge.success`. That
handles the case where the user closes the browser before the redirect
completes.

---

## 3. Mobile (iOS + Android via EAS)

### 3.1 eas.json

Minimum profile, if not already present:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": "version" }
  },
  "submit": { "production": {} }
}
```

### 3.2 Build

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

First-time iOS: EAS will ask to generate certificates and an App Store
provisioning profile. Accept.

### 3.3 Submit

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

Follow the App Store Connect / Play Console submission flow — see
`APP_STORE_CHECKLIST.md` for the metadata you need prepared.

---

## 4. Turning on payments for the first time

Don't flip `EXPO_PUBLIC_PAYMENTS_ENABLED=true` until all four are true:

1. Paystack secret key is set in Supabase Edge Function env.
2. `paystack-initialize` and `paystack-verify` are deployed.
3. You've made one successful test transaction with a Paystack test
   card (4084 0840 8408 4081) end to end.
4. `profiles.is_pro` is actually flipping to `true` after verification
   (inspect in Supabase → Table editor).

Then set the secret both in `.env.local` and in EAS + Vercel, and rebuild
the affected surface.

---

## 5. Ongoing

- Every release: bump `expo.version` in `app.json`. EAS handles build
  numbers if `autoIncrement` is set.
- Keep `LAST_UPDATED` in `app/legal/privacy.tsx` and
  `app/legal/terms.tsx` synced to material changes.
- Rotate Paystack and Termii keys quarterly. Update EAS + Supabase +
  Vercel secrets at the same time, then rebuild.
