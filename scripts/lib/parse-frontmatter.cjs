/**
 * Parser de frontmatter YAML simples (com suporte a arrays `  - item`)
 * usado pelo build de conteúdo, validação e API de dev — uma única implementação.
 */

/**
 * @param {string} content
 * @returns {{ data: Record<string, unknown>, content: string }}
 */
function parseContentFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };

  const data = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (currentArray) {
        data[currentKey] = currentArray;
        currentArray = null;
      }

      if (value.startsWith('"') || value.startsWith("'")) {
        data[key.trim()] = value.slice(1, -1);
      } else if (value === 'null') {
        data[key.trim()] = null;
      } else if (!isNaN(value) && value !== '') {
        data[key.trim()] = Number(value);
      } else if (value === 'true') {
        data[key.trim()] = true;
      } else if (value === 'false') {
        data[key.trim()] = false;
      } else {
        data[key.trim()] = value;
      }
      currentKey = key.trim();
    } else if (line.startsWith('  -')) {
      const value = line.replace('  -', '').trim();
      if (!currentArray) {
        currentArray = [];
        data[currentKey] = currentArray;
      }
      if (value.startsWith('"') || value.startsWith("'")) {
        currentArray.push(value.slice(1, -1));
      } else {
        currentArray.push(value);
      }
    }
  }

  return { data, content: match[2] };
}

module.exports = { parseContentFrontmatter };
