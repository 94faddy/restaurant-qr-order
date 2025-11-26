/**
 * ===================================================
 * FILE: tailwind.config.ts
 * PATH: /restaurant-qr-order/tailwind.config.ts
 * DESCRIPTION: Tailwind CSS Configuration
 * ===================================================
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a5',
          300: '#f6ba6d',
          400: '#f19433',
          500: '#ee7712',
          600: '#df5c08',
          700: '#b94409',
          800: '#93360f',
          900: '#772f10',
          950: '#401506',
        },
        secondary: {
          50: '#f4f7f7',
          100: '#e2ebea',
          200: '#c8d9d7',
          300: '#a1bfbc',
          400: '#739d99',
          500: '#58827e',
          600: '#456a67',
          700: '#3a5755',
          800: '#324847',
          900: '#2c3e3d',
          950: '#172423',
        },
        accent: {
          50: '#fdf4f3',
          100: '#fce7e4',
          200: '#fad3cd',
          300: '#f5b4aa',
          400: '#ed897a',
          500: '#e16350',
          600: '#cd4533',
          700: '#ac3727',
          800: '#8e3124',
          900: '#762e24',
          950: '#40140e',
        },
      },
      fontFamily: {
        sans: ['Prompt', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Kanit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'order': '0 0 0 3px rgba(238, 119, 18, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;