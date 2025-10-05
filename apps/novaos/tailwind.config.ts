import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        novaOS: {
          blueLight: '#e0f2fe',
          blueDark: '#0c4a6e',
          lavender: '#f3e8ff',
        },
        studios: {
          inkSteel: {
            steel: '#64748b',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
