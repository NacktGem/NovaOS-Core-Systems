import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#2563eb',
        success: {
          DEFAULT: '#16a34a',
          light: '#4ade80',
        },
        gold: '#facc15',
        onyx: '#27272a',
      },
    },
  },
  plugins: []
}
export default config
