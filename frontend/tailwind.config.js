/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand / Primary Palette (Blue) ─────────────────────────────────
        forest: {
          50:  '#EFF6FF',   // extreme light tint
          100: '#DBEAFE',   // lightest blue
          200: '#BFDBFE',   // soft highlight
          300: '#93C5FD',   // mid-soft
          400: '#60A5FA',   // mid accent
          500: '#3B82F6',   // balanced
          600: '#2563EB',   // base brand (PRIMARY ACTION)
          700: '#1D4ED8',   // deeper
          800: '#1E40AF',   // dark
          900: '#1E3A8A',   // very dark
          950: '#172554',   // deepest
        },

        // ─── Surface / Background Neutrals (Light Mode focus) ───────────────
        canvas: {
          50:  '#FFFFFF',   // pure white for cards
          100: '#F8FAFF',   // main page background
          200: '#EEF2FF',   // subtle panel background
          300: '#E0E7FF',   // borders
          400: '#C7D2FE',   // stronger borders
          500: '#818CF8',   // muted text
          600: '#475569',   // secondary text — readable slate
          700: '#334155',   // primary text
          800: '#1E293B',   // heading text — high contrast
          900: '#0F172A',   // darkest
          950: '#020617',
        },

        surface:   'canvas',
        accent:    'forest',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        'forest-gradient':  'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
        'forest-radial':    'radial-gradient(ellipse at center, #DBEAFE 0%, #FFFFFF 70%)',
        'glass-surface':    'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
      },

      boxShadow: {
        'glow-sm':    '0 0 12px rgba(37,99,235,0.15)',
        'glow-md':    '0 0 28px rgba(37,99,235,0.25)',
        'card-3d':    '0 24px 48px -12px rgba(37,99,235,0.15), 0 4px 20px rgba(37,99,235,0.08)',
        'inset-glow': 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(37,99,235,0.1)',
      },

      keyframes: {
        // Entrance
        'slide-up':     { from: { transform: 'translateY(1.5rem)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in':      { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in':     { from: { transform: 'scale(0.92)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'slide-in-left':{ from: { transform: 'translateX(-2rem)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        // Continuous
        'float':        { '0%,100%': { transform: 'translateY(0px) rotate(0deg)' }, '50%': { transform: 'translateY(-20px) rotate(3deg)' } },
        'float-slow':   { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        'spin-slow':    { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        // 3D
        'rotate-3d':    { '0%': { transform: 'rotateX(0deg) rotateY(0deg)' }, '25%': { transform: 'rotateX(5deg) rotateY(10deg)' }, '50%': { transform: 'rotateX(0deg) rotateY(20deg)' }, '75%': { transform: 'rotateX(-5deg) rotateY(10deg)' }, '100%': { transform: 'rotateX(0deg) rotateY(0deg)' } },
      },

      animation: {
        'slide-up':      'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':       'fade-in 0.35s ease-out forwards',
        'scale-in':      'scale-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'float':         'float 6s ease-in-out infinite',
        'float-slow':    'float-slow 8s ease-in-out infinite',
        'spin-slow':     'spin-slow 20s linear infinite',
        'rotate-3d':     'rotate-3d 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
