export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4EFE5',
        ink: '#1A1814',
        brick: '#B43A2C',
        'brick-dark': '#9C4A3B',
        charcoal: '#2A2520',
        muted: '#6B5F4E',
      },
      fontFamily: {
        mono: ['"Geist Mono"', 'monospace'],
      },
      keyframes: {
        // K-059 — fade-in animation for DiaryEntryV2 (design §4).
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        // Consumed via arbitrary class: animate-[fadeIn_300ms_ease-in-out_forwards]
        // Defining the keyframe here makes it part of the Tailwind build chain.
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
