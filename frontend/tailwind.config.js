/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        paper: '#FFF5F0',
        primary: {
          DEFAULT: '#C05621',
          hover: '#9C4215',
          light: '#FED7AA',
        },
        gold: '#D69E2E',
        success: '#38A169',
        wtext: '#4A3A35',
        muted: '#8C7B75',
        border: '#E2D8D0',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
