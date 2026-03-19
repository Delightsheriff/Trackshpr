# Trackshpr Design System
## "Kinetic Precision" — v1.1 Production Spec

---

## 1. Core Philosophy

- **No 1px borders for layout sectioning.** Depth comes from background shifts only.
- **No dividers between list items.** Use vertical spacing or background toggle.
- **No pure black text.** Always use `text-primary` tokens.
- **No drop shadows on static cards.** Reserve elevation for modals, sheets, FABs.
- **Gradients only on:** primary CTAs, hero stat cards, avatars, profile headers. Nowhere else.
- **Always minimum 4px radius.** Nothing has sharp corners.
- **Rider and Customer web pages are always light mode** regardless of seller preference.

---

## 2. Color Tokens

### 2.1 Light Mode

```typescript
export const lightColors = {
  // Brand
  primary:          '#4647D3',
  primaryDim:       '#3939C7',   // pressed / active state
  primaryContainer: '#9396FF',   // gradient endpoint, secondary accents
  primarySoft:      '#EEEEFF',   // subtle tint backgrounds, chips

  // Surfaces
  surface:              '#FAF4FF',  // app background
  surfaceContainer:     '#ECE4FF',  // sections, input backgrounds, grouped content
  surfaceCard:          '#FFFFFF',  // cards, list items, elevated content
  surfaceElevated:      '#F4EEFF',  // modals, bottom sheets

  // Text
  textPrimary:   '#302950',
  textSecondary: '#5E5680',
  textMuted:     '#9590B0',

  // Status
  success:    '#00873A',
  successBg:  '#E6F4EC',
  warning:    '#F5A623',
  warningBg:  '#FEF3E2',
  error:      '#DC2626',
  errorBg:    '#FEE2E2',
  info:       '#1A7FCC',
  infoBg:     '#E1F0FA',

  // Misc
  border:  'rgba(70, 71, 211, 0.07)',   // bottom nav top border only
  overlay: 'rgba(48, 41, 80, 0.4)',     // sheet backdrop
} as const
```

### 2.2 Dark Mode

```typescript
export const darkColors = {
  // Brand — shifted lighter for dark bg readability
  primary:          '#6366F1',
  primaryDim:       '#4647D3',
  primaryContainer: '#9396FF',
  primarySoft:      '#1e1f4a',

  // Surfaces — layered darkest to lightest
  surface:              '#0f0e1a',
  surfaceContainer:     '#1a1828',
  surfaceCard:          '#1e1c2e',
  surfaceElevated:      '#252338',
  surfaceHighlight:     '#2a2840',  // toggles off, subtle separators

  // Text
  textPrimary:   '#EEEAF8',
  textSecondary: '#A89EC0',
  textMuted:     '#6B6180',

  // Status — softened for dark backgrounds
  success:    '#34D399',   // NOT #00873A — too dark on dark bg
  successBg:  '#0d2e22',
  warning:    '#FBBF24',
  warningBg:  '#2a1f08',
  error:      '#F87171',
  errorBg:    '#2e0f0f',
  info:       '#60A5FA',
  infoBg:     '#0d1f38',

  // Misc
  border:     'rgba(99, 102, 241, 0.1)',
  overlay:    'rgba(0, 0, 0, 0.6)',
  cardShine:  'rgba(255, 255, 255, 0.03)',  // subtle top edge on dark cards
} as const
```

### 2.3 Gradient Tokens

```typescript
export const gradients = {
  primary:     ['#4647D3', '#6366F1'],
  primaryHero: ['#1e1f4a', '#2d2f6b', '#3a3b82'],  // dark mode hero card
  avatar:      ['#4647D3', '#9396FF'],
  success:     ['#00873A', '#00A347'],
} as const
// Rule: max 2 gradient elements visible on screen at once
```

### 2.4 Status Color Map

| Status     | Light fg   | Light bg   | Dark fg    | Dark bg    |
|------------|------------|------------|------------|------------|
| Pending    | `#F5A623`  | `#FEF3E2`  | `#FBBF24`  | `#2a1f08`  |
| Picked Up  | `#1A7FCC`  | `#E1F0FA`  | `#60A5FA`  | `#0d1f38`  |
| In Transit | `#1A7FCC`  | `#E1F0FA`  | `#60A5FA`  | `#0d1f38`  |
| Delivered  | `#00873A`  | `#E6F4EC`  | `#34D399`  | `#0d2e22`  |
| Failed     | `#DC2626`  | `#FEE2E2`  | `#F87171`  | `#2e0f0f`  |

### 2.5 Dark Mode Color Shift Rationale

| Token        | Light      | Dark       | Why                          |
|--------------|------------|------------|------------------------------|
| primary      | `#4647D3`  | `#6366F1`  | Lighter reads better on dark |
| success      | `#00873A`  | `#34D399`  | Avoids mud on dark surfaces  |
| error        | `#DC2626`  | `#F87171`  | Softened for eye comfort     |
| warning      | `#F5A623`  | `#FBBF24`  | Softened                     |
| info         | `#1A7FCC`  | `#60A5FA`  | Softened                     |
| surface      | `#FAF4FF`  | `#0f0e1a`  | Inverted                     |
| surfaceCard  | `#FFFFFF`  | `#1e1c2e`  | Inverted                     |
| textPrimary  | `#302950`  | `#EEEAF8`  | Inverted                     |

---

## 3. Typography

**Fonts:** `DM Sans` (UI) + `DM Mono` (numbers, timestamps, IDs, amounts)

```typescript
export const typography = {
  // Display — hero metrics, large stat numbers
  displayLg: { fontSize: 40, fontWeight: '700', letterSpacing: -1.6,  fontFamily: 'DMSans_700Bold' },
  displayMd: { fontSize: 28, fontWeight: '700', letterSpacing: -0.84, fontFamily: 'DMSans_700Bold' },

  // Headings
  headingLg: { fontSize: 22, fontWeight: '700', letterSpacing: -0.44, fontFamily: 'DMSans_700Bold' },
  headingMd: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4,  fontFamily: 'DMSans_700Bold' },
  headingSm: { fontSize: 17, fontWeight: '700', letterSpacing: -0.34, fontFamily: 'DMSans_700Bold' },

  // Body
  bodyLg: { fontSize: 15, fontWeight: '400', fontFamily: 'DMSans_400Regular' },
  bodyMd: { fontSize: 14, fontWeight: '400', fontFamily: 'DMSans_400Regular' },
  bodySm: { fontSize: 13, fontWeight: '400', fontFamily: 'DMSans_400Regular' },

  // Labels
  labelLg: { fontSize: 15, fontWeight: '700', letterSpacing: -0.15, fontFamily: 'DMSans_700Bold' },
  labelMd: { fontSize: 14, fontWeight: '600', letterSpacing: -0.14, fontFamily: 'DMSans_600SemiBold' },
  labelSm: { fontSize: 13, fontWeight: '600', letterSpacing: -0.13, fontFamily: 'DMSans_600SemiBold' },
  labelXs: { fontSize: 11, fontWeight: '600', letterSpacing: 0.04,  fontFamily: 'DMSans_600SemiBold' },

  // Caps labels — section headers, small badges
  capsLg: { fontSize: 11, fontWeight: '700', letterSpacing: 0.08, textTransform: 'uppercase', fontFamily: 'DMSans_700Bold' },
  capsSm: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1,  textTransform: 'uppercase', fontFamily: 'DMSans_700Bold' },

  // Mono — all numbers, amounts, times, IDs
  monoLg: { fontSize: 40, fontWeight: '700', fontFamily: 'DMMono_500Medium', fontVariant: ['tabular-nums'] },
  monoMd: { fontSize: 22, fontWeight: '500', fontFamily: 'DMMono_500Medium', fontVariant: ['tabular-nums'] },
  monoSm: { fontSize: 14, fontWeight: '400', fontFamily: 'DMMono_400Regular', fontVariant: ['tabular-nums'] },
  monoXs: { fontSize: 11, fontWeight: '400', fontFamily: 'DMMono_400Regular', fontVariant: ['tabular-nums'] },
} as const

// Usage rules:
// ₦ amounts         → monoSm or monoMd
// Timestamps        → monoXs
// Order IDs         → monoXs
// Dashboard big num → monoLg
// Delivery count    → monoSm
```

---

## 4. Spacing Scale

```typescript
export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const

export const layout = {
  screenPaddingH:   18,   // horizontal padding on all screens
  screenPaddingTop: 10,   // below status bar
  cardPadding:      14,   // internal card padding
  sectionGap:       18,   // gap between major page sections
  listGap:          8,    // gap between list item cards
} as const
```

---

## 5. Border Radius

```typescript
export const radius = {
  sm:   4,    // internal chips, micro elements
  md:   8,    // small tags, secondary badges
  lg:   13,   // order icons, small cards
  xl:   18,   // order cards, rider cards, customer cards
  card: 20,   // stat cards, hero cards
  xxl:  28,   // bottom sheets, modals
  full: 100,  // pills, FABs, filter tabs, status badges
} as const
```

---

## 6. Elevation (Shadows)

```typescript
export const shadowsLight = {
  card:  { shadowColor:'#302950', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:8,  elevation:2  },
  modal: { shadowColor:'#302950', shadowOffset:{width:0,height:8}, shadowOpacity:0.1,  shadowRadius:30, elevation:10 },
  fab:   { shadowColor:'#4647D3', shadowOffset:{width:0,height:6}, shadowOpacity:0.4,  shadowRadius:20, elevation:12 },
  sheet: { shadowColor:'#302950', shadowOffset:{width:0,height:-4},shadowOpacity:0.08, shadowRadius:20, elevation:8  },
}

export const shadowsDark = {
  card:  { shadowColor:'#000000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3,  shadowRadius:20, elevation:4  },
  modal: { shadowColor:'#000000', shadowOffset:{width:0,height:8}, shadowOpacity:0.5,  shadowRadius:40, elevation:12 },
  fab:   { shadowColor:'#6366F1', shadowOffset:{width:0,height:6}, shadowOpacity:0.5,  shadowRadius:24, elevation:14 },
  sheet: { shadowColor:'#000000', shadowOffset:{width:0,height:-4},shadowOpacity:0.4,  shadowRadius:24, elevation:10 },
}
```

---

## 7. Icons

**Library:** `@expo/vector-icons` — Feather set primary

### 7.1 Navigation Icons

| Tab       | Feather icon   | Size | Active       | Inactive   |
|-----------|----------------|------|--------------|------------|
| Home      | `home`         | 22   | `primary`    | `textMuted`|
| Orders    | `package`      | 22   | `primary`    | `textMuted`|
| New (FAB) | `plus`         | 24   | white        | —          |
| Riders    | `user`         | 22   | `primary`    | `textMuted`|
| Settings  | `settings`     | 22   | `primary`    | `textMuted`|

### 7.2 Action Icons

| Action          | Feather icon        | Size | Container bg          |
|-----------------|---------------------|------|-----------------------|
| Call            | `phone`             | 16   | `successBg`           |
| More options    | `more-horizontal`   | 16   | `surfaceContainer`    |
| Delete          | `trash-2`           | 15   | `errorBg`             |
| Edit            | `edit-2`            | 14   | transparent           |
| Copy link       | `copy`              | 14   | `primarySoft`         |
| Share           | `share-2`           | 14   | `primarySoft`         |
| Search          | `search`            | 15   | inline, `textMuted`   |
| Back            | `arrow-left`        | 18   | `surfaceCard` button  |
| Bell            | `bell`              | 20   | inline                |
| Camera          | `camera`            | 16   | `primarySoft`         |
| Export          | `download`          | 16   | `successBg`           |
| Map pin         | `map-pin`           | 14   | status-dependent      |
| Chevron right   | `chevron-right`     | 16   | inline, `textMuted`   |
| Check           | `check`             | 14   | inline (select state) |

### 7.3 Status + State Emoji Illustrations

| Context              | Emoji | Notes                          |
|----------------------|-------|--------------------------------|
| App icon / splash    | 📦    | Brand mark                     |
| Rider / in transit   | 🚴    | Hero cards, map pins, nav FAB  |
| Delivered            | ✅    | Delivered order icon           |
| Failed               | ❌    | Failed order icon              |
| Pending              | 🛍️   | Pending order icon             |
| Photo / evidence     | 📸    | Upload prompts                 |
| WhatsApp sent        | 📲    | Confirmation card              |
| Call (web pages)     | 📞    | Call seller / rider buttons    |
| Address / location   | 📍    | Address fields, map labels     |
| Network offline      | 📡    | Network error screen           |
| Server error         | ⚡    | 5xx error screen               |
| Invalid link         | 🔗    | Rider/customer bad link screen |
| Not found            | 🗺️   | 404 screen                     |

### 7.4 Settings Row Icons

| Row                  | Emoji | Container bg       |
|----------------------|-------|--------------------|
| Business details     | 🏪    | `primarySoft`      |
| Brand customization  | 🎨    | `warningBg`        |
| Export history       | 📊    | `successBg`        |
| Dark mode            | 🌙    | `surfaceContainer` |
| Push notifications   | 🔔    | `primarySoft`      |
| Help & support       | 💬    | `infoBg`           |
| Sign out             | 🚪    | `errorBg`          |

### 7.5 Icon Sizing Rules

```typescript
export const iconSize = {
  nav:       22,   // bottom navigation tabs
  action:    16,   // action buttons inside cards
  input:     16,   // inside input fields
  settings:  18,   // settings row icons (inside 36px container)
  heading:   20,   // next to screen titles
  large:     32,   // empty states
  hero:      48,   // splash, error screens
} as const

export const iconContainerSize = {
  settings: { size: 36, radius: 12 },
  order:    { size: 42, radius: 13 },
  action:   { size: 32, radius: 10 },
}
```

---

## 8. Component Patterns

### 8.1 Cards

```
Light:
  background:  surfaceCard (#FFFFFF)
  shadow:      shadowsLight.card

Dark:
  background:  surfaceCard (#1e1c2e)
  topEdge:     1px rgba(255,255,255,0.03) — subtle material shine
  shadow:      shadowsDark.card

borderRadius:  xl (18px) list cards / card (20px) stat cards
padding:       13px 14px list / 16px 18px stat
listGap:       8px between cards
NO stroke borders, NO dividers inside
```

### 8.2 Input Fields

```
Default:
  background:  surfaceContainer (light) / surfaceCard (dark)
  borderRadius: lg (13px)
  padding:     13px 14px
  border:      none

Focused:
  background:  surfaceCard
  border:      2px solid primary

Error:
  background:  surfaceCard
  border:      2px solid error
  label color: error
  message:     labelXs below field, error color

Disabled:
  opacity:     0.5
  not interactive
```

### 8.3 Buttons

```
Primary CTA:
  bg:          gradient primary → #6366F1, 135°
  radius:      full (100px)
  padding:     15px 24px
  text:        labelLg, white
  shadow:      fab shadow

Success CTA (send delivery):
  bg:          gradient success
  Otherwise same as primary

Secondary:
  Light: surfaceContainer bg, textSecondary text
  Dark:  surfaceHighlight bg, textSecondary text
  radius: full, padding: 14px

Ghost:
  bg:          transparent
  text:        primary color, labelSm
  no shadow, no border

Danger:
  bg:          error color
  text:        white, labelMd
  radius:      full

States on all buttons:
  pressed:  scale 0.98, opacity 0.9
  disabled: 0.4 opacity, surfaceContainer bg, textMuted text
  loading:  ActivityIndicator white replaces text, dims press
```

### 8.4 Status Pills

```
borderRadius:  full (100px)
padding:       3px 9px
font:          capsSm (10px bold)
prefix dot:    5×5px circle, currentColor, marginRight 4px
colors:        use status map from section 2.4 per mode
```

### 8.5 Bottom Navigation

```
height:        68px
background:    surface at 94% opacity + backdropBlur 24px
borderTop:     1px solid border token  ← only permitted border in system
paddingBottom: 6px (device safe area)

Active tab:
  label:  primary color, weight 700
  dot:    4×4px circle, primary, below label

Center FAB:
  52×52px, borderRadius 18px
  background: gradient primary
  marginTop: -14px (floats above nav bar)
  shadow: fab shadow token
```

### 8.6 Bottom Sheets

```
background:    surfaceElevated
borderRadius:  28px 28px 0 0
shadow:        shadowsSheet
handle:        36×4px pill, surfaceHighlight color, 10px top margin, centered
backdrop:      overlay token color, dismisses on tap

Inputs inside sheets:
  background:  surface (light) / surfaceContainer (dark)
```

### 8.7 Toggle Switch

```
size:          40×22px, full border radius
On:            primary bg, thumb right (left: 20px)
Off:           surfaceHighlight bg, thumb left (left: 2px)
thumb:         18×18px white circle, 2px inset, subtle shadow
transition:    200ms
```

### 8.8 Swipe-to-Delete

```
Swipe threshold:   80px left
Delete zone:       80px wide, error bg, right-anchored
  icon:            trash-2, white, centered
  label:           "Delete" caps 9px, white
On confirm tap:    destructive confirmation sheet appears
On cancel:         snap back animation
```

### 8.9 Skeleton Shimmer

```typescript
// Shimmer animates left → right, 1.6s ease-in-out infinite
const shimmerColors = {
  light: ['#ECE4FF', '#E0D6F5', '#ECE4FF'],
  dark:  ['#1a1828', '#252338', '#1a1828'],
}
// Shapes must match real content dimensions exactly — no layout shift on load
```

---

## 9. Dark Mode Implementation

### 9.1 Zustand Theme Store

```typescript
// stores/themeStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors } from '@/constants/tokens'

interface ThemeState {
  isDark: boolean
  colors: typeof lightColors
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      colors: lightColors,
      toggle: () => {
        const next = !get().isDark
        set({ isDark: next, colors: next ? darkColors : lightColors })
      },
    }),
    { name: 'trackshpr-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
)

// Shortcut hook
export const useTheme = () => useThemeStore(s => ({ colors: s.colors, isDark: s.isDark }))
```

### 9.2 Always-Light Screens

| Screen                 | Mode   | Reason                          |
|------------------------|--------|---------------------------------|
| Rider web page         | Light  | Outdoor, bright environments    |
| Customer tracking page | Light  | All devices, all audiences      |
| Sign-in page           | Dark   | Always dark — brand entry       |
| Splash screen          | Dark   | Always dark — brand entry       |
| Onboarding slides      | Mixed  | Dark/light alternating by slide |

---

## 10. States & Interactions

### 10.1 Button States

```
Primary:
  default  → gradient, full opacity
  pressed  → primaryDim, scale 0.98
  disabled → surfaceContainer bg, textMuted, 0.4 opacity
  loading  → ActivityIndicator (white, small), text hidden, disabled

Danger:
  default  → error bg
  pressed  → rgba(error, 0.85), scale 0.98
```

### 10.2 Card / List Item States

```
default   → surfaceCard bg
pressed   → surfaceContainer (light) / surfaceHighlight (dark), scale 0.99
swiped    → translateX(-80px), delete zone revealed behind
selected  → primarySoft bg
```

### 10.3 Input States

```
default   → surfaceContainer bg (light) / surfaceCard bg (dark)
focused   → surfaceCard bg, 2px primary border
error     → surfaceCard bg, 2px error border
           + error message labelXs below, error color
           + label turns error color
disabled  → surfaceContainer bg, 0.5 opacity
```

### 10.4 Form Validation

```
Trigger:  onBlur + onSubmit attempt

Required fields — order creation:
  - Item description       → "Please describe the item"
  - Customer address       → "Add a customer address"
  - Rider number/selection → "Select or enter a rider's number"
  - Phone format           → "Phone number must be 11 digits"

Visual:   2px error border on field, error label, message below
```

---

## 11. Error States & Error Handling

### 11.1 Full-Screen Error Screens

```
Layout (all):
  centered column, icon → code badge → title → sub → CTAs
  background: surface (light) / surface (dark)

Network Error:
  icon:   📡 in warningBg container, 56×56px radius 18px
  ring:   warningColor pulse, 0.3 opacity
  code:   "No Connection" — warningBg bg, warningColor text
  title:  "You're offline"
  sub:    "Check your data or WiFi. Your orders are safe."
  CTA 1:  "Try Again" — primary gradient
  CTA 2:  "View cached orders" — secondary

Server Error (5xx):
  icon:   ⚡ in errorBg container
  code:   "Server Error" — errorBg/error color
  title:  "Something broke on our end"
  sub:    "We've been notified. Your delivery data is safe."
  CTA 1:  "Refresh"
  CTA 2:  "Go to Dashboard"

Invalid / Expired Link (rider + customer web pages):
  icon:   🔗 in infoBg container
  code:   "Invalid Link" — infoBg/info color
  title:  "This link isn't valid"
  sub:    "This tracking link may have already been used. Contact the seller directly."
  CTA 1:  "Contact Seller" — info gradient
  CTA 2:  "What is Trackshpr?"

404 Not Found:
  theme:  dark screen always
  bg num: "404" — 120px DM Mono, rgba(white,0.08) ghost text
  icon:   🗺️ 48px, floating above number
  title:  "Wrong turn, rider" — white
  sub:    text rgba(white,0.35)
  CTA:    "Back to Dashboard" — primary gradient
```

### 11.2 Empty States

All empty states share this layout: illustration → title → sub → optional CTA

```
No orders:
  icon:  📦 64px, primarySoft bg, radius 24px
  title: "No deliveries yet"
  sub:   "Create your first delivery and send a tracking link to your customer."
  CTA:   "New Delivery"

No riders:
  icon:  🚴
  title: "No riders saved"
  sub:   "Save your frequent riders to assign them faster."
  CTA:   "Add Rider"

No customers:
  icon:  👤
  title: "Address book is empty"
  sub:   "Saved addresses make creating deliveries much faster."
  CTA:   "Add Customer"

Search no results:
  icon:  🔍
  title: "Nothing found"
  sub:   "Try a different name or phone number."
  NO CTA

Filtered list empty:
  icon:  📋
  title: "No [status] orders"
  sub:   "Switch filters to see other orders."
  NO CTA
```

### 11.3 Toast / Snackbar Notifications

```
Position:    top of screen, 18px horizontal margin, below status bar
padding:     12px 16px
borderRadius: xl (18px)
duration:    3000ms auto-dismiss

Types:
  success: successBg bg, success text, ✅ prefix
  error:   errorBg bg, error text, ❌ prefix
  info:    infoBg bg, info text, 📦 prefix

Animation:
  enter: translateY(-20) → 0, opacity 0→1, 300ms spring
  exit:  translateY(-20), opacity →0, 200ms ease

Rules:
  Always show a toast on API error — never silent failure
  Never show raw error codes or stack traces
  Error copy is human — "Couldn't save rider. Try again." not "Error 500"
```

### 11.4 Destructive Action Pattern

Every delete / sign-out follows this exact flow — no exceptions:

```
1. User triggers action (swipe or tap)
2. Bottom sheet appears:
   - Icon in errorBg container (56×56px, radius 18px)
   - Title names the specific item: "Remove Emeka Musa?"
   - Sub explains data consequences: "Their delivery history stays on record."
   - Red confirm button (full width, labelMd, white)
   - Secondary cancel button (full width)
3. Dismiss on cancel or backdrop tap
4. On confirm: optimistic UI update → API call → revert + error toast on failure
```

### 11.5 Inline Loading (Buttons)

```
Replace text with ActivityIndicator (white, size 'small')
Keep button dimensions fixed — no layout shift
Disable all pointer events while loading
Show loading state max 10s — then auto-reset with error toast
```

---

## 12. Animation Tokens

```typescript
import { withSpring, withTiming } from 'react-native-reanimated'

export const spring = { damping: 20, stiffness: 300, mass: 0.8 }

export const timing = {
  fast:   150,   // button press feedback, color transitions
  normal: 250,   // tab switches, input focus
  slow:   350,   // sheet slide up, modal appear
}

export const staggerDelay = (index: number) => Math.min(index * 50, 250)
// Max 5 items staggered — 250ms total cap

// Recurring animations
export const animations = {
  float: {
    // Floating hero icons, splash mark
    // translateY 0 → -6px → 0, 3000ms ease-in-out infinite
  },
  pulse: {
    // Live status dots, notification badge
    // opacity 1 → 0.3 → 1, 1500ms infinite
  },
  shimmer: {
    // Skeleton loading
    // backgroundPosition -400 → 400, 1600ms ease-in-out infinite
  },
}
```

---

## 13. File Structure for Tokens

```
constants/
  tokens.ts         ← lightColors, darkColors, gradients, spacing,
                       radius, shadows, typography, iconSize, layout
  icons.ts          ← icon name constants per action/context
  animations.ts     ← spring, timing, stagger, animation configs

stores/
  themeStore.ts     ← isDark, colors, toggle — Zustand persisted to AsyncStorage

hooks/
  useTheme.ts       ← const { colors, isDark } = useTheme()
  useToast.ts       ← show(message, type) / hide()
```

---

## 14. NativeWind / Tailwind Class Mapping

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'surface':        '#FAF4FF',
        'surface-c':      '#ECE4FF',
        'surface-card':   '#FFFFFF',
        'brand':          '#4647D3',
        'brand-soft':     '#EEEEFF',
        'brand-c':        '#9396FF',
        't-primary':      '#302950',
        't-secondary':    '#5E5680',
        't-muted':        '#9590B0',
        'ok':             '#00873A',
        'ok-bg':          '#E6F4EC',
        'warn':           '#F5A623',
        'warn-bg':        '#FEF3E2',
        'danger':         '#DC2626',
        'danger-bg':      '#FEE2E2',
        'notice':         '#1A7FCC',
        'notice-bg':      '#E1F0FA',
      },
      borderRadius: {
        'card':  '18px',
        'stat':  '20px',
        'sheet': '28px',
        'pill':  '100px',
        'input': '13px',
      },
    },
  },
}
// Note: dark mode values applied via useTheme hook + inline styles
// NativeWind dark: prefix not used — theme store controls colors directly
```

---

## 15. Absolute Don'ts

```
❌  border: '1px solid' for layout sections — use background shifts
❌  Horizontal View dividers between list items
❌  color: '#000000' anywhere
❌  color: '#FFFFFF' for text in dark mode (use textPrimary token)
❌  borderRadius: 0 on any visible UI element
❌  Drop shadows on static list cards
❌  Gradient on more than 2 elements per screen simultaneously
❌  Inter, Roboto, or system fonts — always DM Sans / DM Mono
❌  Standard logistics green (#16A34A) as primary — success states only
❌  Skipping the destructive confirmation sheet for any delete action
❌  Showing raw error codes or stack traces to users
❌  Silent failures — always show a toast on API error
❌  Layout shift during skeleton → content transition
❌  Disabling a button without visual + accessible reason
❌  Hardcoded color values in components — always use token
```
