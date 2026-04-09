import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pharma: {
          green: '#2D6A4F',
          'green-light': '#52B788',
          'green-medium': '#40916C',
          'green-dark': '#1B3A2D',
          'green-darker': '#143026',
          blue: '#1B4F72',
          gray: '#F8F9FA',
          'gray-light': '#F0F4F1',
          text: '#1A1A2E',
          'text-secondary': '#6C757D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        standard: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow-green': '0 0 20px rgba(82, 183, 136, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)',
        'gradient-green-dark': 'linear-gradient(180deg, #1B3A2D 0%, #143026 100%)',
        'gradient-card-1': 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
        'gradient-card-2': 'linear-gradient(135deg, #40916C 0%, #74C69D 100%)',
        'gradient-card-3': 'linear-gradient(135deg, #1B4F72 0%, #2D6A4F 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #F0F4F1 0%, #F8F9FA 100%)',
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'count-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(82, 183, 136, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(82, 183, 136, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'count-up': 'count-up 0.5s ease-out',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
