/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Trackshpr Design System color tokens (§14)
      // Dark mode handled via useThemeStore — NOT via dark: prefix.
      colors: {
        surface:       '#FAF4FF',
        'surface-c':   '#ECE4FF',
        'surface-card':'#FFFFFF',
        brand:         '#4647D3',
        'brand-dim':   '#3939C7',
        'brand-c':     '#9396FF',
        'brand-soft':  '#EEEEFF',
        't-primary':   '#302950',
        't-secondary': '#5E5680',
        't-muted':     '#9590B0',
        ok:            '#00873A',
        'ok-bg':       '#E6F4EC',
        warn:          '#F5A623',
        'warn-bg':     '#FEF3E2',
        danger:        '#DC2626',
        'danger-bg':   '#FEE2E2',
        notice:        '#1A7FCC',
        'notice-bg':   '#E1F0FA',
      },
      borderRadius: {
        card:  '18px',
        stat:  '20px',
        sheet: '28px',
        pill:  '100px',
        input: '13px',
      },
    },
  },
  plugins: [],
}
