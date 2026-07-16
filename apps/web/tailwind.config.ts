import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',
      'bg-base': '#0C0E12',
      'bg-surface': '#13161C',
      'bg-raised': '#1B1F28',
      'border-col': '#252A36',
      'border-sub': '#1E2330',
      'brand': '#4ADE80',
      'brand-muted': '#16532D',
      'text-pri': '#F1F5F9',
      'text-sec': '#94A3B8',
      'text-ter': '#475569',
      'status-applied': '#FCD34D',
      'status-interview': '#38BDF8',
      'status-offer': '#4ADE80',
      'status-rejected': '#F87171',
      'status-ghosted': '#6B7280',
      gray: {
        50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
        400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
        800: '#1f2937', 900: '#111827', 950: '#030712',
      },
      red: {
        50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
        400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
        800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
      },
      amber: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
        400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        800: '#92400e', 900: '#78350f', 950: '#451a03',
      },
      sky: {
        50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
        400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
        800: '#075985', 900: '#0c4a6e', 950: '#082f49',
      },
      green: {
        50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
        400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        800: '#166534', 900: '#14532d', 950: '#052e16',
      },
      purple: {
        50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
        400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
        800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
      },
    },
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      sans: ['DM Sans', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      keyframes: {
        'pulse-signal': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-signal': 'pulse-signal 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      boxShadow: {
        'brand': '0 0 0 1px rgba(74, 222, 128, 0.2)',
        'brand-glow': '0 0 20px rgba(74, 222, 128, 0.15)',
        'surface': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}

export default config
