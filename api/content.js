/**
 * API Local para Content Management
 * 
 * Simula as API routes do Next.js para o Parcel Dev Server.
 * Usa Parcel's dev middleware ou pode ser adaptado para servidor local.
 * 
 * No ambiente de dev, este arquivo é servido como endpoint API.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');

/**
 * Parse simples de frontmatter
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
 * Lista documentos de uma coleção
 */
function listDocuments(collection) {
  const dir = path.join(CONTENT_DIR, collection);
  
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  return files.map(file => {
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { metadata } = parseFrontmatter(raw);
    
    const slug = file.replace(/\.(mdx|md)$/, '');
    
    return {
      id: slug,
      slug,
      title: metadata.title || slug,
      published: metadata.published !== 'false',
      order: parseInt(metadata.order) || 0,
    };
  }).sort((a, b) => a.order - b.order);
}

/**
 * Carrega um documento
 */
function loadDocument(collection, id) {
  const dir = path.join(CONTENT_DIR, collection);
  const filePath = path.join(dir, `${id}.mdx`);
  
  if (!fs.existsSync(filePath)) {
    // Tenta com .md
    const mdPath = path.join(dir, `${id}.md`);
    if (!fs.existsSync(mdPath)) {
      throw new Error(`Document not found: ${collection}/${id}`);
    }
  }
  
  const actualPath = fs.existsSync(filePath) ? filePath : path.join(dir, `${id}.md`);
  const raw = fs.readFileSync(actualPath, 'utf-8');
  const { metadata, content } = parseFrontmatter(raw);
  
  return {
    id,
    collection,
    slug: id,
    metadata,
    content,
    title: metadata.title || id,
  };
}

/**
 * Salva um documento
 */
function saveDocument(collection, id, metadata, content) {
  const dir = path.join(CONTENT_DIR, collection);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, `${id}.mdx`);
  const raw = serializeFrontmatter(metadata, content);
  
  fs.writeFileSync(filePath, raw, 'utf-8');
}

/**
 * Cria um novo documento
 */
function createDocument(collection, title, slug) {
  const finalSlug = slug || title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
  
  const metadata = {
    title,
    slug: finalSlug,
    publishedAt: new Date().toISOString().split('T')[0],
    published: 'false',
  };
  
  const content = `# ${title}\n\nEm breve...`;
  
  saveDocument(collection, finalSlug, metadata, content);
  
  return {
    entry: {
      id: finalSlug,
      slug: finalSlug,
      title,
      published: false,
    },
    document: {
      id: finalSlug,
      collection,
      slug: finalSlug,
      metadata,
      content,
      title,
    },
  };
}

// Export para uso como módulo
module.exports = {
  listDocuments,
  loadDocument,
  saveDocument,
  createDocument,
};

// Handler para Parcel Dev Server (middleware)
module.exports.handler = function(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action') || 'list';
  const collection = url.searchParams.get('collection') || 'pages';
  const id = url.searchParams.get('id');
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  try {
    if (req.method === 'GET') {
      switch (action) {
        case 'list': {
          const entries = listDocuments(collection);
          res.statusCode = 200;
          res.end(JSON.stringify({ entries }));
          break;
        }
        case 'load': {
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing id parameter' }));
            return;
          }
          const document = loadDocument(collection, id);
          res.statusCode = 200;
          res.end(JSON.stringify(document));
          break;
        }
        default:
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Unknown action' }));
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          
          if (data.action === 'create') {
            const result = createDocument(
              data.collection || collection,
              data.title,
              data.slug
            );
            res.statusCode = 201;
            res.end(JSON.stringify(result));
          } else {
            // Save
            saveDocument(
              data.collection || collection,
              data.id || id,
              data.metadata,
              data.content
            );
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
