// ─── Trackshpr Design System Tokens v1.1 ─────────────────────────────────────
// Source of truth for all colors, typography, spacing, radius, shadows, and
// animation values. No component may hardcode a value defined here.

// ── Colors — Light Mode ──────────────────────────────────────────────────────
export const colors = {
  // Brand
  primary:          '#4647D3',
  primaryDim:       '#3939C7',
  primaryContainer: '#9396FF',
  primarySoft:      '#EEEEFF',

  // Surfaces
  surface:          '#FAF4FF',
  surfaceContainer: '#ECE4FF',
  surfaceCard:      '#FFFFFF',
  surfaceElevated:  '#F4EEFF',

  // Text
  textPrimary:   '#302950',
  textSecondary: '#5E5680',
  textMuted:     '#9590B0',

  // Status
  success:   '#00873A',
  successBg: '#E6F4EC',
  warning:   '#F5A623',
  warningBg: '#FEF3E2',
  error:     '#DC2626',
  errorBg:   '#FEE2E2',
  info:      '#1A7FCC',
  infoBg:    '#E1F0FA',

  // Misc
  border:  'rgba(70, 71, 211, 0.07)',
  overlay: 'rgba(48, 41, 80, 0.4)',

  // Always-white: used on gradient buttons and dark-slide text only
  white: '#FFFFFF',
} as const

// ── Onboarding-specific semantic tokens ─────────────────────────────────────
// Dark slides (1 & 3) and their unique rgba values live here.
export const onboardingColors = {
  darkBg: '#0e0c1a',

  // Slide 1 background layers
  darkBgGradientTop: '#14103a',

  // Accent text on dark backgrounds (approximates gradient text — no MaskedView needed)
  accentPurple: '#9396FF', // matches primaryContainer
  accentGreen:  '#4ade80', // bright green on dark bg

  // Tag variants
  darkTagBg:     'rgba(255, 255, 255, 0.08)',
  darkTagBorder: 'rgba(255, 255, 255, 0.10)',
  darkTagText:   'rgba(255, 255, 255, 0.60)',
  greenTagBg:    'rgba(0, 135, 58, 0.15)',
  greenTagBorder:'rgba(0, 135, 58, 0.20)',
  greenTagText:  'rgba(74, 222, 128, 0.90)',

  // Chat bubbles (slide 1)
  bubbleCustomerBg:     'rgba(255, 255, 255, 0.10)',
  bubbleCustomerBorder: 'rgba(255, 255, 255, 0.12)',
  bubbleCustomerText:   '#FFFFFF',
  bubbleSellerGradStart:'#4647D3',
  bubbleSellerGradEnd:  '#6366F1',
  bubbleStressedBg:     'rgba(220, 38, 38, 0.15)',
  bubbleStressedBorder: 'rgba(220, 38, 38, 0.25)',
  bubbleStressedText:   '#FCA5A5',
  bubbleTimeText:       'rgba(255, 255, 255, 0.45)',

  // Sub-text on dark slides
  subDark: 'rgba(255, 255, 255, 0.50)',

  // Skip button on dark slides
  skipDark: 'rgba(255, 255, 255, 0.35)',

  // Dot indicators
  dotInactiveDark:  'rgba(255, 255, 255, 0.20)',
  dotInactiveLight: '#ECE4FF',

  // Timeline (slide 3)
  tlLineDark:        'rgba(255, 255, 255, 0.08)',
  tlLineDone:        'rgba(0, 135, 58, 0.30)',
  tlDotDoneBg:       'rgba(0, 135, 58, 0.20)',
  tlDotDoneBorder:   'rgba(0, 135, 58, 0.50)',
  tlDotPendingBg:    'rgba(255, 255, 255, 0.05)',
  tlDotPendingBorder:'rgba(255, 255, 255, 0.10)',
  tlLabelDone:       'rgba(74, 222, 128, 0.90)',
  tlLabelActive:     '#FFFFFF',
  tlLabelPending:    'rgba(255, 255, 255, 0.30)',
  tlMetaDone:        'rgba(74, 222, 128, 0.50)',
  tlMetaActive:      'rgba(255, 255, 255, 0.55)',
  tlMetaPending:     'rgba(255, 255, 255, 0.35)',
  tlProofTagBg:      'rgba(0, 135, 58, 0.15)',
  tlProofTagText:    'rgba(74, 222, 128, 0.80)',
  tlProofTagBorder:  'rgba(0, 135, 58, 0.20)',
  tlLiveTagBg:       'rgba(70, 71, 211, 0.20)',
  tlLiveTagText:     'rgba(147, 150, 255, 0.90)',
  tlLiveTagBorder:   'rgba(70, 71, 211, 0.30)',

  // Slide 3 background
  darkBgS3GradTop:    '#0d1a12',
} as const

// ── Gradients ───────────────────────────────────────────────────────────────
// Rule: max 2 gradient elements visible on screen at once.
export const gradients = {
  primary: ['#4647D3', '#6366F1'] as [string, string],
  success: ['#00873A', '#00A347'] as [string, string],
  avatar:  ['#4647D3', '#9396FF'] as [string, string],
}

// ── Spacing Scale ─────────────────────────────────────────────────────────────
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
  screenPaddingH:   18,
  screenPaddingTop: 10,
  cardPadding:      14,
  sectionGap:       18,
  listGap:          8,
} as const

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radius = {
  sm:   4,
  md:   8,
  lg:   13,
  xl:   18,
  card: 20,
  xxl:  28,
  full: 100,
} as const

// ── Font Families ─────────────────────────────────────────────────────────────
export const font = {
  sans: {
    regular:  'DMSans_400Regular',
    semiBold: 'DMSans_600SemiBold',
    bold:     'DMSans_700Bold',
  },
  mono: {
    regular: 'DMMono_400Regular',
    medium:  'DMMono_500Medium',
  },
} as const

// ── Typography Scale ──────────────────────────────────────────────────────────
export const type = {
  // Display
  displayLg: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.6,  fontFamily: font.sans.bold },
  displayMd: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.84, fontFamily: font.sans.bold },

  // Headings
  headingLg: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.44, fontFamily: font.sans.bold },
  headingMd: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.4,  fontFamily: font.sans.bold },
  headingSm: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.34, fontFamily: font.sans.bold },

  // Body
  bodyLg: { fontSize: 15, fontWeight: '400' as const, fontFamily: font.sans.regular },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, fontFamily: font.sans.regular },
  bodySm: { fontSize: 13, fontWeight: '400' as const, fontFamily: font.sans.regular },

  // Labels
  labelLg: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.15, fontFamily: font.sans.bold },
  labelMd: { fontSize: 14, fontWeight: '600' as const, letterSpacing: -0.14, fontFamily: font.sans.semiBold },
  labelSm: { fontSize: 13, fontWeight: '600' as const, letterSpacing: -0.13, fontFamily: font.sans.semiBold },
  labelXs: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.04,  fontFamily: font.sans.semiBold },

  // Caps
  capsLg: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.08, textTransform: 'uppercase' as const, fontFamily: font.sans.bold },
  capsSm: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.10, textTransform: 'uppercase' as const, fontFamily: font.sans.bold },

  // Mono — numbers, timestamps, IDs, amounts
  monoLg: { fontSize: 40, fontWeight: '700' as const, fontFamily: font.mono.medium, fontVariant: ['tabular-nums'] as const },
  monoMd: { fontSize: 22, fontWeight: '500' as const, fontFamily: font.mono.medium, fontVariant: ['tabular-nums'] as const },
  monoSm: { fontSize: 14, fontWeight: '400' as const, fontFamily: font.mono.regular, fontVariant: ['tabular-nums'] as const },
  monoXs: { fontSize: 11, fontWeight: '400' as const, fontFamily: font.mono.regular, fontVariant: ['tabular-nums'] as const },
} as const

// ── Shadows ───────────────────────────────────────────────────────────────────
// Use CSS boxShadow prop (New Architecture). Never use legacy shadow/elevation.
export const shadows = {
  card:       { boxShadow: '0 1px 8px rgba(48, 41, 80, 0.05)' },
  modal:      { boxShadow: '0 8px 30px rgba(48, 41, 80, 0.10)' },
  fab:        { boxShadow: '0 6px 20px rgba(70, 71, 211, 0.40)' },
  fabSuccess: { boxShadow: '0 6px 20px rgba(0, 135, 58, 0.35)' },
  sheet:      { boxShadow: '0 -4px 20px rgba(48, 41, 80, 0.08)' },
  actorCard:  { boxShadow: '0 2px 16px rgba(48, 41, 80, 0.06)' },
} as const

// ── Animation ─────────────────────────────────────────────────────────────────
export const animation = {
  spring: { damping: 20, stiffness: 300, mass: 0.8 },
  timing: { fast: 150, normal: 250, slow: 350 },
} as const
