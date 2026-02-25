/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card-bg)',
          border: 'var(--card-border)',
        },
        nav: {
          DEFAULT: 'var(--nav-bg)',
          text: 'var(--nav-text)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        border: {
          primary: 'var(--border-primary)',
        },
        'tab-active': 'var(--tab-active)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
