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
        gypsyCove: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
