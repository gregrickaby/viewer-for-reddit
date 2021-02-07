module.exports = {
  purge: ['./components/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      container: {
        center: true,
        margin: 'auto'
      },
      fontFamily: {
        comic: ['ComicNeue', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'sans-serif']
      },
      colors: {
        gray: {
          200: '#d9d9d9',
          500: '#2d2d2d',
          900: '#111'
        }
      }
    }
  },
  variants: {},
  plugins: [],
  future: {}
}
