/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        apex: {
          bg: '#0A0A0A',
          surface: '#1A1A1A',
          'surface-light': '#242424',
          'surface-border': '#2A2A2A',
          accent: '#FF2D2D',
          'accent-dark': '#CC2424',
          'accent-light': '#FF4D4D',
          success: '#22C55E',
          warning: '#FACC15',
          warmup: '#FACC15',
          working: '#FF2D55',
          'myo-rep': '#3B82F6',
          'drop-set': '#A78BFA',
          'text-primary': '#FFFFFF',
          'text-secondary': '#9CA3AF',
          'text-tertiary': '#6B7280',
          divider: '#1F1F1F',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
