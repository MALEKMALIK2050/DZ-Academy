/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        heading: ["'Cairo'", "'Reem Kufi'", "'Aref Ruqaa'", "'Outfit'", "'Segoe UI'", 'sans-serif'],
        body: ["'Tajawal'", "'Cairo'", "'Inter'", "'Segoe UI'", 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        ruqaa: ["'Aref Ruqaa'", "'Amiri'", 'serif'],
        kufi: ["'Reem Kufi'", "'Cairo'", 'sans-serif'],
        cairo: ["'Cairo'", 'sans-serif'],
        tajawal: ["'Tajawal'", 'sans-serif'],
        amiri: ["'Amiri'", 'serif'],
      },
    },
  },
  plugins: [],
}
