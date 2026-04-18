const path = require('path');

const repoRoot = path.join(__dirname, '..');
const sharedPreset = require(path.join(repoRoot, 'src/editor-ui/lib/tailwind-preset'));

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  presets: [sharedPreset],
  content: [
    path.join(repoRoot, 'src/editor-ui/**/*.{ts,tsx,js,jsx,html}'),
    path.join(__dirname, '**/*.{ts,tsx,js,jsx,mdx}'),
  ],
  plugins: [require('@tailwindcss/container-queries')],
};
