/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'
import typography from '@tailwindcss/typography'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    daisyui,
    typography,
  ],
  daisyui: {
    themes: ['light', 'dark'],
  },
}