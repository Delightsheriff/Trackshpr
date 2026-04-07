// ─── Trackshpr Animation Tokens ───────────────────────────────────────────────
// Shared spring/timing presets and stagger helpers.

export const spring = { damping: 20, stiffness: 300, mass: 0.8 }
export const timing = { fast: 150, normal: 250, slow: 350 }
export const staggerDelay = (index: number) => Math.min(index * 50, 250)
