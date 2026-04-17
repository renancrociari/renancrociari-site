/**
 * Filesystem Adapter for Portfolio-OS Integration
 * 
 * Este adapter implementa as operações de leitura/escrita diretamente no filesystem,
 * sem depender de API routes (já que o site usa Parcel, não Next.js).
 * 
 * No ambiente de dev, usa a API local. Em produção, pode ser substituído.
 */

/**
 * @typedef {Object} ContentDocument
 * @property {string} collection - 'pages' | 'work'
 * @property {string} slug
 * @property {string} filePath
 * @property {Record<string, string>} metadata
 * @property {string} content
 */

/**
 * @typedef {Object} EditorDocumentListItem
 * @property {string} documentId
 * @property {'pages' | 'work'} collection
 * @property {string} slug
 * @property {string} title
 * @property {boolean} [published]
 */

/**
 * @typedef {Object} EditorDocumentPayload
 * @property {string} id
 * @property {'pages' | 'work'} collection
 * @property {string} slug
 * @property {Record<string, string>} metadata
 * @property {string} content
 * @property {string} [title]
 */

// Em ambiente browser, usa a API local
// Em ambiente Node/Build, lê diretamente do filesystem

const IS_BROWSER = typeof window !== 'undefined';
// API server roda em porta separaada (3001) porque Parcel não suporta middleware
const API_BASE = IS_BROWSER 
  ? (window.location.port === '1234' ? 'http://localhost:3001/api/content' : '/api/content')
  : 'http://localhost:3001/api/content';

/**
 * Parse simples de frontmatter
 * @param {string} raw
 * @returns {{ metadata: Record<string, string>, content: string }}
 */
function parseFrontmatter(raw) {
  const lines = raw.split('\n');
  let inFrontmatter = false;
  let frontmatterStart = -1;
  let frontmatterEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }
  
  if (frontmatterStart === -1 || frontmatterEnd === -1) {
    return { metadata: {}, content: raw };
  }
  
  const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
  const content = lines.slice(frontmatterEnd + 1).join('\n').trim();
  
  const metadata = {};
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes se presentes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      metadata[key] = value;
    }
  }
  
  return { metadata, content };
}

/**
 * Serializa frontmatter
 * @param {Record<string, string>} metadata
 * @param {string} content
 * @returns {string}
 */
function serializeFrontmatter(metadata, content) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    const needsQuotes = value.includes(':') || value.includes('#') || 
                       value.includes('"') || value.includes('\n');
    if (needsQuotes) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(content);
  return lines.join('\n');
}

/**
 * Cria adapter para uma coleção
 * @param {'pages' | 'work'} collection
 * @returns {Object}
 */
export function createFilesystemAdapter(collection) {
  return {
    collection,

    /**
     * Lista todos os documentos da coleção
     * @returns {Promise<EditorDocumentListItem[] | null>}
     */
    async listDocuments() {
      if (!IS_BROWSER) {
        // Server-side: ler diretamente do FS
        return null; // Implementado no build step
      }
      
      const res = await fetch(`${API_BASE}?collection=${collection}&action=list`);
      if (!res.ok) return null;
      
      const data = await res.json();
      return (data.entries || []).map(e => ({
        documentId: e.id,
        collection,
        slug: e.slug,
        title: e.title,
        published: e.published,
      }));
    },

    /**
     * Carrega um documento
     * @param {string} documentId
     * @returns {Promise<EditorDocumentPayload>}
     */
    async loadDocument(documentId) {
      const res = await fetch(`${API_BASE}?collection=${collection}&id=${encodeURIComponent(documentId)}&action=load`);
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },

    /**
     * Salva um documento
     * @param {string} documentId
     * @param {Record<string, string>} metadata
     * @param {string} content
     * @returns {Promise<void>}
     */
    async saveDocument(documentId, metadata, content) {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          id: documentId,
          metadata,
          content,
          action: 'save'
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    },

    /**
     * Cria um novo documento
     * @param {string} title
     * @param {string} [slug]
     * @returns {Promise<{ entry: EditorDocumentListItem, document: EditorDocumentPayload }>}
     */
    async createDocument(title, slug) {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          action: 'create',
          title,
          slug: slug?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  };
}

/**
 * Bundle com todos os adapters
 */
export function createLocalAdapterBundle() {
  return {
    pages: createFilesystemAdapter('pages'),
    work: createFilesystemAdapter('work'),
  };
}

// Export individual para conveniência
export const pagesAdapter = createFilesystemAdapter('pages');
export const workAdapter = createFilesystemAdapter('work');
