# Trackshpr

A React Native mobile app for delivery businesses to manage orders, track riders in real time, and share live tracking links with customers.

## Overview

Trackshpr gives sellers a single interface to create and dispatch deliveries, manage a fleet of riders, monitor live GPS locations on a map, and generate shareable tracking links for customers. The app supports Google OAuth sign-in and a guided onboarding flow that collects business details and branding before entering the main experience.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5 |
| Routing | Expo Router v6 (file-based) |
| Language | TypeScript 5.9 (strict mode) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Server state | TanStack React Query v5 |
| Client state | Zustand v5 |
| Forms | React Hook Form v7 + Zod v4 |
| Animations | React Native Reanimated v4 |
| Maps | react-native-maps v1.20.1 |
| Lists | @shopify/flash-list |
| Auth | Supabase Google OAuth via expo-auth-session |
| Token storage | expo-secure-store |

## Features

- **Dashboard** — KPI cards for total, pending, in-transit, and delivered orders; recent order list; quick-action tiles
- **Orders** — Searchable and filterable list; create order with customer, address, item details, rider assignment, and delivery fee; status progression timeline with timestamps
- **Delivery proof** — Photo upload on delivery (seller and rider sides)
- **Riders** — Add, edit, and remove fleet members; per-rider delivery counter; swipe-to-delete
- **Fleet map** — Real-time GPS pings plotted on a map with status indicators
- **Address book** — Save customers for quick reuse when creating orders
- **Analytics** — Order metrics and rider performance
- **Public tracking pages** — Shareable token-based URLs for riders and customers; always rendered in light mode
- **Brand customization** — Upload logo, set brand color and display name shown on tracking pages
- **Dark mode** — System-aware with manual toggle; tracking pages locked to light

## Project Structure

```
app/
  _layout.tsx           Root layout — auth guard and routing
  onboarding.tsx        3-slide carousel for first-time users
  (auth)/               Sign-in and profile setup screens
  (tabs)/               Main tab navigator (home, orders, riders, settings)
  (modals)/             Create/select overlays (delivery, rider, customer)
  (screens)/            Stack screens (order detail, fleet map, analytics, tracking links)
  (settings)/           Settings stack (business details, branding, account)

src/
  components/           UI components grouped by feature
  constants/            Design tokens, animation configs, icon map
  hooks/                React Query hooks for auth, orders, riders, customers
  lib/                  Supabase client, query functions, auth helpers, route map
  stores/               Zustand stores (theme, toasts, optimistic data, order form)
  types/                Supabase-generated database types
  utils/                Date formatting, string helpers
```

## Auth and Routing Flow

The root layout drives all routing through a state machine in `useAuthState`:

```
Loading
  No session   ->  Onboarding (first launch) or Sign-in
  Session, profile incomplete  ->  Profile Setup
  Session, profile complete    ->  Tabs (authenticated)
```

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Seller accounts — business name, phone, logo, brand settings |
| `orders` | Deliveries — status, customer, rider, tokens, proof photos |
| `riders` | Fleet members linked to a seller |
| `address_book` | Saved customers per seller |
| `location_pings` | GPS coordinates per order |
| `order_status_events` | Append-only audit trail for order status changes |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

## Getting Started

```bash
npm install
npx expo start
```

Open in an iOS simulator, Android emulator, or a development build on device. Expo Go is not recommended — the app uses libraries that require a custom native build.

## Design System

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the complete token reference (colors, typography, spacing, radius, shadows, gradients, component patterns, and animation specs). All UI code must follow these rules before any component is written or modified.
