import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    '../../admin-core/src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
