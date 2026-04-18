const sharedPreset = require('./src/editor-ui/lib/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  presets: [sharedPreset],
  content: [
    './src/editor-ui/**/*.{ts,tsx,js,jsx,html}',
    './editor-sidecar/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  plugins: [require('@tailwindcss/container-queries')],
};
