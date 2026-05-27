/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b111e',
        surface: '#111827',
        'surface-container-lowest': '#0f1420',
        'surface-container-low': '#131b2c',
        'surface-container': '#172136',
        'surface-container-high': '#1e293b',
        'on-surface': '#f8fafc',
        'on-surface-variant': '#94a3b8',
        'outline-variant': '#334155',
        primary: '#14b8a6',
        'on-primary': '#042f2e',
        'primary-container': '#0f766e',
        'on-primary-container': '#ccfbf1',
        secondary: '#818cf8',
        'secondary-container': '#4f46e5',
        tertiary: '#f472b6',
        'tertiary-container': '#db2777',
        error: '#ef4444',
        'error-container': '#991b1b',
      },
      fontFamily: {
        'display': ['Geist', 'sans-serif'],
        'headline-md': ['Geist', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}