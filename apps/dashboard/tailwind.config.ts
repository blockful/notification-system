import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b0f19',
        panel: '#111827',
        border: '#1f2937',
        text: '#e5e7eb',
        muted: '#9ca3af',
        accent: '#60a5fa',
      },
    },
  },
  plugins: [],
};

export default config;
