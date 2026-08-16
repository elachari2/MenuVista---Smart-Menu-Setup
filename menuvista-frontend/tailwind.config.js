/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Initiale Officielle du Projet (Orange #E85D2C + Blanc & Gradients Gris)
        primary: {
          50: '#FDF0EB',
          100: '#FADBD8',
          200: '#F5B7B1',
          300: '#F1948A',
          400: '#EC7063',
          500: '#E85D2C', // Primary Brand Orange
          600: '#E85D2C', // Primary Brand Orange
          700: '#D14C1E', // Hover Orange
          800: '#B03A12',
          900: '#78281F',
        },
        brand: {
          orange: '#E85D2C',
          'orange-hover': '#D14C1E',
          'orange-light': '#FDF0EB',
          bg: '#FAF8F6',
          dark: '#1E1A18',
          muted: '#5A554F',
          border: '#E8E4E0',
          success: '#2ECC71',
          error: '#E74C3C',
          pending: '#F39C12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
