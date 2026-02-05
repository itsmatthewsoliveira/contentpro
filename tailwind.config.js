/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ServiceGrowth AI
        sg: {
          bg: '#0D0D0D',
          bgAlt: '#1A1A1A',
          cyan: '#00D4FF',
          teal: '#00B4D8',
        },
        // Caviar Pavers
        cp: {
          brown: '#5C4033',
          brownDark: '#3D2914',
          blue: '#1E3A5F',
          navy: '#1A2F4A',
          gold: '#C9A227',
          goldLight: '#E5C158',
          cream: '#F5F0E6',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
