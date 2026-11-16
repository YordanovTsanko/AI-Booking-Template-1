/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Barber blue
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Barber red
        accent: {
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        // Dark surfaces
        ink: {
          950: '#05070d',
          900: '#0a0e1a',
          800: '#0f1525',
          700: '#161e33',
          600: '#1f2a44',
          500: '#2b3858',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Oswald', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 40px -20px rgba(0, 0, 0, 0.7)',
        glow: '0 0 40px -10px rgba(37, 99, 235, 0.6)',
        'glow-red': '0 0 40px -10px rgba(220, 38, 38, 0.6)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'barber-spin': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '0 68px' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.25s ease-out',
        'barber-spin': 'barber-spin 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
