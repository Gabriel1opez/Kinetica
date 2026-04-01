
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Silkscreen"', 'monospace'],
        retro: ['"Inter"', 'sans-serif'],
      },
      colors: {
        retro: {
          bg:      '#120824',
          panel:   '#1e0d40',
          border:  '#3d1a6e',
          cyan:    '#00d4ff',
          pink:    '#ff3366',
          magenta: '#e040fb',
          orange:  '#ff6b35',
          yellow:  '#ffd700',
          green:   '#39ff14',
          purple:  '#a855f7',
          red:     '#ff073a',
          gray:    '#5a3a7a',
          white:   '#f0e8ff',
        },
      },
      animation: {
        'pixel-pulse':   'pixelPulse 1.2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'neon-flicker':  'neonFlicker 4s ease-in-out infinite',
        'slide-up':      'slideUp 0.35s ease-out',
        'fade-in':       'fadeIn 0.4s ease-out',
        'shake':         'shake 0.3s ease-in-out',
        'glitch':        'glitch 5s ease-in-out infinite',
        'blink':         'blink 1s step-end infinite',
        'scanline':      'scanline 8s linear infinite',
        'march':         'march 0.5s linear infinite',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        pixelPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.04)', opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        neonFlicker: {
          '0%, 89%, 93%, 97%, 100%': { opacity: '1' },
          '90%, 94%':                { opacity: '0.5' },
          '92%':                     { opacity: '0.8' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-5px)' },
          '75%':      { transform: 'translateX(5px)' },
        },
        glitch: {
          '0%, 88%, 100%': { textShadow: '0 0 10px currentColor, 0 0 30px currentColor' },
          '89%': { textShadow: '3px 0 #ff3366, -3px 0 #00d4ff, 0 0 10px currentColor' },
          '91%': { textShadow: '-3px 0 #ff3366, 3px 0 #00d4ff, 0 0 10px currentColor' },
          '93%': { textShadow: '0 0 10px currentColor, 0 0 30px currentColor' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        march: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '16px 0' },
        },
      },
      boxShadow: {
        'neon-cyan':  '0 0 6px #00d4ff, 0 0 24px rgba(0,212,255,0.35)',
        'neon-pink':  '0 0 6px #ff3366, 0 0 24px rgba(255,51,102,0.35)',
        'neon-gold':  '0 0 6px #ffd700, 0 0 24px rgba(255,215,0,0.35)',
        'neon-green': '0 0 6px #39ff14, 0 0 24px rgba(57,255,20,0.35)',
        'pixel':      '4px 4px 0 rgba(0,0,0,0.6)',
        'pixel-lg':   '6px 6px 0 rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
