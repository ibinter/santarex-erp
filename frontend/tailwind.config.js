/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D47A1',
          medium: '#1565C0',
          light: '#1976D2',
        },
        secondary: {
          DEFAULT: '#00838F',
          light: '#00ACC1',
        },
        accent: '#00BCD4',
        surface: '#F5F7FA',
        'text-primary': '#37474F',
        'text-secondary': '#546E7A',
        success: '#2E7D32',
        warning: '#F57F17',
        danger: '#C62828',
        border: '#B0BEC5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(13,71,161,0.15)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
