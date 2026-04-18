/**
 * Content Schema
 * 
 * Schemas canônicos para pages e work (case studies)
 */

/**
 * Schema para páginas estáticas (about, etc)
 * @type {Record<string, {type: string, required?: boolean, default?: any}>}
 */
export const PageSchema = {
  title: { type: 'string', required: true },
  slug: { type: 'string', required: true },
  type: { type: 'string', required: true },
  status: { type: 'string', required: false, default: 'published' },
  published: { type: 'boolean', required: false, default: true },
  description: { type: 'string', required: false },
  order: { type: 'number', required: false, default: 0 },
  featured_image: { type: 'string', required: false },
  og_image: { type: 'string', required: false },
  created_at: { type: 'date', required: false },
  updated_at: { type: 'date', required: false },
};

/**
 * Schema para case studies (work)
 * @type {Record<string, {type: string, required?: boolean, default?: any}>}
 */
export const WorkSchema = {
  title: { type: 'string', required: true },
  slug: { type: 'string', required: true },
  type: { type: 'string', required: true },
  status: { type: 'string', required: false, default: 'published' }, // 'published', 'protected'
  published: { type: 'boolean', required: false, default: true },
  description: { type: 'string', required: true },
  order: { type: 'number', required: false, default: 0 },
  
  // Categorização
  tags: { type: 'array', required: false },
  
  // Mídia
  featured_image: { type: 'string', required: false },
  og_image: { type: 'string', required: false },
  
  // Segurança
  protected_password: { type: 'string', required: false },
  
  // Datas
  created_at: { type: 'date', required: false },
  updated_at: { type: 'date', required: false },
};

/**
 * Templates de páginas disponíveis
 */
export const PageTemplates = {
  default: {
    name: 'default',
    label: 'Padrão',
    description: 'Layout padrão de página',
  },
  about: {
    name: 'about',
    label: 'About',
    description: 'Página de bio/perfil',
  },
  caseStudy: {
    name: 'case-study',
    label: 'Case Study',
    description: 'Página de case study completo',
  },
  simple: {
    name: 'simple',
    label: 'Simples',
    description: 'Layout simples sem hero',
  },
};

/**
 * Blocos editoriais suportados
 */
export const SupportedBlocks = {
  heading: {
    type: 'heading',
    label: 'Heading',
    props: ['level', 'text', 'anchor'],
  },
  paragraph: {
    type: 'paragraph',
    label: 'Parágrafo',
    props: ['text'],
  },
  textBlock: {
    type: 'textBlock',
    label: 'Bloco de Texto',
    props: ['title', 'content', 'columns'],
  },
  image: {
    type: 'image',
    label: 'Imagem',
    props: ['src', 'alt', 'caption', 'fullWidth'],
  },
  gallery: {
    type: 'gallery',
    label: 'Galeria',
    props: ['images'],
  },
  video: {
    type: 'video',
    label: 'Vídeo',
    props: ['src', 'title', 'provider'],
  },
  quote: {
    type: 'quote',
    label: 'Citação',
    props: ['text', 'author', 'source'],
  },
  list: {
    type: 'list',
    label: 'Lista',
    props: ['items', 'ordered'],
  },
  divider: {
    type: 'divider',
    label: 'Divisor',
    props: [],
  },
  results: {
    type: 'results',
    label: 'Resultados',
    props: ['title', 'items'],
  },
  embed: {
    type: 'embed',
    label: 'Embed',
    props: ['url', 'title'],
  },
};

/**
 * Valida metadados contra um schema
 * @param {Record<string, any>} metadata
 * @param {Record<string, {type: string, required?: boolean}>} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMetadata(metadata, schema) {
  const errors = [];
  
  for (const [key, def] of Object.entries(schema)) {
    if (def.required && !metadata[key]) {
      errors.push(`Campo obrigatório ausente: ${key}`);
    }
    
    if (metadata[key] && def.type) {
      const value = metadata[key];
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (def.type === 'date') {
        // Validação de data: aceita string ISO ou Date object
        const isValidDate = !isNaN(Date.parse(value));
        if (!isValidDate) {
          errors.push(`Data inválida para ${key}: ${value}`);
        }
      } else if (actualType !== def.type) {
        errors.push(`Tipo inválido para ${key}: esperado ${def.type}, recebido ${actualType}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Aplica valores padrão do schema
 * @param {Record<string, any>} metadata
 * @param {Record<string, {default?: any}>} schema
 * @returns {Record<string, any>}
 */
export function applyDefaults(metadata, schema) {
  const result = { ...metadata };
  
  for (const [key, def] of Object.entries(schema)) {
    if (def.default !== undefined && result[key] === undefined) {
      result[key] = def.default;
    }
  }
  
  return result;
}

/**
 * Gera slug a partir de título
 * @param {string} title
 * @returns {string}
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}
