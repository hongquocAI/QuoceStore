/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        appleBg: '#f5f5f7',
        appleDark: '#1d1d1f',
        appleGray: '#86868b',
        appleCard: '#ffffff',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        apple: '0 4px 24px rgba(0, 0, 0, 0.04)',
        appleHover: '0 16px 40px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}