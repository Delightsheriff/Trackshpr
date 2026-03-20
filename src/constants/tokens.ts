// ─── Trackshpr Design System Tokens v1.1 ─────────────────────────────────────
// Source of truth for all colors, typography, spacing, radius, shadows, and
// animation values. No component may hardcode a value defined here.

// ── Colors — Light Mode (DS §2.1) ────────────────────────────────────────────
export const lightColors = {
  // Brand
  primary:          '#4647D3',
  primaryDim:       '#3939C7',
  primaryContainer: '#9396FF',
  primarySoft:      '#EEEEFF',

  // Surfaces
  surface:            '#FAF4FF',
  surfaceContainer:   '#ECE4FF',
  surfaceCard:        '#FFFFFF',
  surfaceElevated:    '#F4EEFF',
  surfaceHighlight:   '#ECE4FF',  // light alias → same as surfaceContainer

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
  white:   '#FFFFFF',
} as const

// ── Colors — Dark Mode (DS §2.2) ─────────────────────────────────────────────
export const darkColors = {
  // Brand — shifted lighter for dark bg readability
  primary:          '#6366F1',
  primaryDim:       '#4647D3',
  primaryContainer: '#9396FF',
  primarySoft:      '#1e1f4a',

  // Surfaces — layered darkest to lightest
  surface:            '#0f0e1a',
  surfaceContainer:   '#1a1828',
  surfaceCard:        '#1e1c2e',
  surfaceElevated:    '#252338',
  surfaceHighlight:   '#2a2840',  // toggles off, subtle separators

  // Text
  textPrimary:   '#EEEAF8',
  textSecondary: '#A89EC0',
  textMuted:     '#6B6180',

  // Status — softened for dark backgrounds
  success:   '#34D399',
  successBg: '#0d2e22',
  warning:   '#FBBF24',
  warningBg: '#2a1f08',
  error:     '#F87171',
  errorBg:   '#2e0f0f',
  info:      '#60A5FA',
  infoBg:    '#0d1f38',

  // Misc
  border:  'rgba(99, 102, 241, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  white:   '#FFFFFF',
} as const

// ── Default export (light) — kept for backwards compat ──────────────────────
export const colors = lightColors

// ── Onboarding-specific semantic tokens ──────────────────────────────────────
// Dark slides (1 & 3) and their unique rgba values live here.
export const onboardingColors = {
  darkBg: '#0e0c1a',
  darkBgGradientTop: '#14103a',
  accentPurple: '#9396FF',
  accentGreen:  '#4ade80',
  darkTagBg:     'rgba(255, 255, 255, 0.08)',
  darkTagBorder: 'rgba(255, 255, 255, 0.10)',
  darkTagText:   'rgba(255, 255, 255, 0.60)',
  greenTagBg:    'rgba(0, 135, 58, 0.15)',
  greenTagBorder:'rgba(0, 135, 58, 0.20)',
  greenTagText:  'rgba(74, 222, 128, 0.90)',
  bubbleCustomerBg:     'rgba(255, 255, 255, 0.10)',
  bubbleCustomerBorder: 'rgba(255, 255, 255, 0.12)',
  bubbleCustomerText:   '#FFFFFF',
  bubbleSellerGradStart:'#4647D3',
  bubbleSellerGradEnd:  '#6366F1',
  bubbleStressedBg:     'rgba(220, 38, 38, 0.15)',
  bubbleStressedBorder: 'rgba(220, 38, 38, 0.25)',
  bubbleStressedText:   '#FCA5A5',
  bubbleTimeText:       'rgba(255, 255, 255, 0.45)',
  subDark:  'rgba(255, 255, 255, 0.50)',
  skipDark: 'rgba(255, 255, 255, 0.35)',
  dotInactiveDark:  'rgba(255, 255, 255, 0.20)',
  dotInactiveLight: '#ECE4FF',
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
  darkBgS3GradTop:   '#0d1a12',
} as const

// ── Sign-in screen semantic tokens ────────────────────────────────────────────
// Always dark — brand entry point.
export const signInColors = {
  heroBg:              '#0e0c1a',
  heroGradBase:        '#1a1040',
  heroPurpleBloom:     'rgba(70, 71, 211, 0.55)',
  heroRightAccent:     'rgba(147, 150, 255, 0.20)',
  cardBg:              'rgba(255, 255, 255, 0.08)',
  cardBorder:          'rgba(255, 255, 255, 0.12)',
  cardLabel:           'rgba(255, 255, 255, 0.50)',
  cardDest:            'rgba(255, 255, 255, 0.50)',
  statusBg:            'rgba(0, 135, 58, 0.20)',
  statusText:          '#4ade80',
  progressTrack:       'rgba(255, 255, 255, 0.10)',
  progressLabel:       'rgba(255, 255, 255, 0.35)',
  progressLabelActive: 'rgba(255, 255, 255, 0.70)',
  orbitRing:           'rgba(147, 150, 255, 0.15)',
  orbitRingOuter:      'rgba(147, 150, 255, 0.07)',
  orbitDot:            'rgba(147, 150, 255, 0.60)',
} as const

// ── Gradients ─────────────────────────────────────────────────────────────────
// Rule: max 2 gradient elements visible on screen at once.
export const gradients = {
  primary: ['#4647D3', '#6366F1'] as [string, string],
  success: ['#00873A', '#00A347'] as [string, string],
  avatar:  ['#4647D3', '#9396FF'] as [string, string],
}

// ── Shadows — Light Mode ──────────────────────────────────────────────────────
export const shadowsLight = {
  card: {
    shadowColor: '#302950',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#302950',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 10,
  },
  fab: {
    shadowColor: '#4647D3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 12,
  },
  sheet: {
    shadowColor: '#302950',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
} as const

// ── Shadows — Dark Mode ───────────────────────────────────────────────────────
export const shadowsDark = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50,
    shadowRadius: 40,
    elevation: 12,
  },
  fab: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 24,
    elevation: 14,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 10,
  },
} as const

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

// ── Icon Sizes ────────────────────────────────────────────────────────────────
export const iconSize = {
  nav:     22,
  action:  16,
  input:   16,
  settings:18,
  heading: 20,
  large:   32,
  hero:    48,
} as const

// ── Shadows (boxShadow — New Architecture) — kept for backwards compat ────────
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
