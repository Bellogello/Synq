/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-container-lowest': 'var(--surface-lowest)',
        'surface-container-low': 'var(--surface-low)',
        'surface-container': 'var(--surface-low)', /* fallback */
        'surface-container-high': 'var(--surface-high)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        'outline-variant': 'var(--outline-variant)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary-container': 'var(--on-surface)',
        secondary: 'var(--primary)', 
        tertiary: 'var(--primary)',
        error: 'var(--error)',
        'error-container': 'var(--error-container)',
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