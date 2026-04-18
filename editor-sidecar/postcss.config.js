module.exports = {
  plugins: {
    // Next.js só aceita plugins como string (nome do pacote) ou config primitiva — não `require()` aqui.
    // `tailwindcss/nesting` com a string `postcss-nesting` usa a spec W3C (aninhamento sem `&`), alinhado a `src/styles/main.css`.
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {},
  },
};
