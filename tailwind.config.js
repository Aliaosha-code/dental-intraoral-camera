/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: token('--ink-950'),
          900: token('--ink-900'),
          800: token('--ink-800'),
          700: token('--ink-700'),
          600: token('--ink-600'),
          500: token('--ink-500'),
          400: token('--ink-400'),
          300: token('--ink-300'),
        },
        accent: {
          50: token('--accent-50'),
          100: token('--accent-100'),
          200: token('--accent-200'),
          300: token('--accent-300'),
          400: token('--accent-400'),
          500: token('--accent-500'),
          600: token('--accent-600'),
          700: token('--accent-700'),
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Microsoft YaHei UI',
          'Microsoft YaHei',
          'PingFang SC',
          'Noto Sans SC',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 32, 56, 0.03), 0 10px 30px rgba(15, 32, 56, 0.045)',
        float: '0 8px 30px rgba(20, 35, 60, 0.14)',
        'blue-glow': '0 8px 20px rgb(var(--accent-500) / 0.22)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.5', transform: 'scale(.82)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'fade-up': 'fadeUp .25s ease-out both',
      },
    },
  },
  plugins: [],
}
