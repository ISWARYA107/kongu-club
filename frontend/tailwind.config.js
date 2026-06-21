/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#1a2a6c',
          dark: '#101c4d',
          light: '#2a3a7c',
        },
        gold: {
          DEFAULT: '#ffcc00',
          dark: '#e6b800',
        },
        admin: {
          DEFAULT: '#1e293b',
          accent: '#dc2626',
        },
        coord: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
};
