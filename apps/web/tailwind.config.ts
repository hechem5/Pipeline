import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        
        'bg-base': 'oklch(var(--background) / <alpha-value>)',
        'bg-surface': 'oklch(var(--surface) / <alpha-value>)',
        'bg-raised': 'oklch(var(--surface-raised) / <alpha-value>)',
        'border-col': 'oklch(var(--border) / <alpha-value>)',
        'brand': 'oklch(var(--brand) / <alpha-value>)',
        'brand-muted': 'oklch(var(--brand-muted) / <alpha-value>)',
        'text-pri': 'oklch(var(--text-primary) / <alpha-value>)',
        'text-sec': 'oklch(var(--text-secondary) / <alpha-value>)',
        'text-ter': 'oklch(var(--text-tertiary) / <alpha-value>)',
        
        'status-applied': 'oklch(var(--status-applied) / <alpha-value>)',
        'status-interview': 'oklch(var(--status-interview) / <alpha-value>)',
        'status-offer': 'oklch(var(--status-offer) / <alpha-value>)',
        'status-rejected': 'oklch(var(--status-rejected) / <alpha-value>)',
        'status-ghosted': 'oklch(var(--status-ghosted) / <alpha-value>)',

        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'pulse-signal': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'pulse-signal': 'pulse-signal 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        'brand': '0 0 0 1px oklch(var(--brand) / 0.2)',
        'brand-glow': '0 0 20px oklch(var(--brand) / 0.15)',
        'surface': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
