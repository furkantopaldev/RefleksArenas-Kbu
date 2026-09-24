/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        party: {
          yellow: '#FFDE59',
          blue: '#3B82F6',
          sky: '#00D2FF',
          purple: '#8B5CF6',
          pink: '#FF4081',
          orange: '#FF8C00',
          green: '#10B981',
          red: '#EF4444',
          dark: '#1E1B4B',
          card: '#2A265F',
        }
      },
      fontFamily: {
        game: ['"Fredoka"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounceShort 0.4s ease-in-out',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
        'pop': 'pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'flash-error': 'flashError 0.3s ease-in-out',
      },
      keyframes: {
        bounceShort: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flashError: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
