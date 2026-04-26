import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#2d6a4f',
        'accent-dark': '#1b4332',
        'accent-light': '#74c69d',
        gold: '#d4a843',
        'gold-hover': '#e8c065',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
