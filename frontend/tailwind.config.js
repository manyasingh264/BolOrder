/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Primary Brand (Orange) ───────────────────────────────────────────
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // main brand orange
          600: '#ea580c',  // hover state
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // ─── Neutral (Slate for text, borders, surfaces) ─────────────────────
        surface: {
          50:  '#f8fafc',  // page background / sidebar bg
          100: '#f1f5f9',  // card hover
          200: '#e2e8f0',  // borders / dividers
          300: '#cbd5e1',
          400: '#94a3b8',  // disabled text
          500: '#64748b',  // muted text
          600: '#475569',
          700: '#334155',
          800: '#1e293b',  // dark headings
          900: '#0f172a',  // near-black text
        },
        // ─── Status Colors ─────────────────────────────────────────────────────
        status: {
          draft:    '#94a3b8', // slate-400
          pending:  '#f59e0b', // amber-500
          confirmed:'#3b82f6', // blue-500
          dispatched:'#8b5cf6',// violet-500
          delivered: '#22c55e',// green-500
          cancelled: '#ef4444',// red-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'sidebar': '2px 0 8px 0 rgb(0 0 0 / 0.06)',
        'navbar':  '0 1px 3px 0 rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-in':   'slideIn 0.2s ease-out',
        'spin-slow':  'spin 2s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '80': '20rem',
        '88': '22rem',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
