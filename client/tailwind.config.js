/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(240 10% 3.9%)',
        primary: {
          DEFAULT: 'hsl(340 82% 52%)',
          foreground: 'hsl(0 0% 100%)',
        },
        muted: 'hsl(240 4.8% 95.9%)',
        card: 'hsl(0 0% 100%)',
        border: 'hsl(240 5.9% 90%)',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}
