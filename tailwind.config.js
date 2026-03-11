/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1f1f1f',
          card:    '#272727',
          hover:   '#2e2e2e',
          border:  '#333333',
        },
        accent: {
          DEFAULT: '#b0c4b1',
          hover:   '#c4d5c5',
          muted:   '#728c74',
        },
        text: {
          primary:   '#e5e7eb',
          secondary: '#9ca3af',
          muted:     '#6b7280',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
