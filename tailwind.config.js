/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020817',
          900: '#0a0f1e',
          800: '#0f1729',
          700: '#162035',
          600: '#1e2d47'
        },
        gold: {
          300: '#f2e44d',
          400: '#ebd600',
          500: '#e5c500',
          600: '#ccb000',
          700: '#a69000'
        }
      },
      fontFamily: {
        sans: ['Oswald', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.7s ease-out forwards',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(30px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(229,197,0,0.4)' }, '50%': { boxShadow: '0 0 20px 8px rgba(229,197,0,0.2)' } },
        slideInLeft: { '0%': { opacity: 0, transform: 'translateX(-40px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      }
    }
  },
  plugins: [],
}
