/**
 * Alinhado a @portfolio-os/core slugify (mesma regra de normalização).
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  if (!str || !String(str).trim()) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { slugify };
