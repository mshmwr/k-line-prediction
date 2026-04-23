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
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
