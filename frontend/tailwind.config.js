/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        paper: '#FFF5F0',
        primary: '#C05621',
        primaryHover: '#9C4215',
        gold: '#D69E2E',
        success: '#38A169',
        'wedding-text': '#4A3A35',
        muted: '#8C7B75',
        border: '#E2D8D0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
