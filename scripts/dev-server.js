#!/usr/bin/env node
/**
 * Dev Server com API para Portfolio-OS
 * 
 * Este script roda:
 * 1. Parcel dev server na porta 1234
 * 2. API server na porta 3001 para leitura/escrita de conteúdo MDX
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const API_PORT = 3001;
const PARCEL_PORT = 1234;

// Utils para frontmatter
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

function serializeFrontmatter(metadata, content) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    const strValue = String(value);
    const needsQuotes = strValue.includes(':') || strValue.includes('#') || 
                       strValue.includes('"') || strValue.includes('\n') ||
                       strValue.includes('[') || strValue.includes(']');
    if (needsQuotes) {
      lines.push(`${key}: "${strValue.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${strValue}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(content);
  return lines.join('\n');
}

// API Handlers
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

function loadDocument(collection, id) {
  const dir = path.join(CONTENT_DIR, collection);
  const filePath = path.join(dir, `${id}.mdx`);
  
  if (!fs.existsSync(filePath)) {
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

function saveDocument(collection, id, metadata, content) {
  const dir = path.join(CONTENT_DIR, collection);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, `${id}.mdx`);
  const raw = serializeFrontmatter(metadata, content);
  
  fs.writeFileSync(filePath, raw, 'utf-8');
}

function createDocument(collection, title, slug) {
  const finalSlug = slug || title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

// API Request Handler
function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${API_PORT}`);
  const pathname = url.pathname;
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PARCEL_PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // /api/content
  if (pathname === '/api/content') {
    const action = url.searchParams.get('action') || 'list';
    const collection = url.searchParams.get('collection') || 'pages';
    const id = url.searchParams.get('id');
    
    try {
      if (req.method === 'GET') {
        switch (action) {
          case 'list': {
            const entries = listDocuments(collection);
            res.statusCode = 200;
            res.end(JSON.stringify({ entries }));
            return;
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
            return;
          }
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
        return;
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }
  
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Start API Server
function startApiServer() {
  const server = http.createServer(handleApiRequest);
  
  server.listen(API_PORT, () => {
    console.log(`📡 API server running at http://localhost:${API_PORT}`);
  });
  
  return server;
}

// Start Parcel
function startParcel() {
  const parcel = spawn('npx', ['parcel', 'src/pages/*.html', '--port', String(PARCEL_PORT)], {
    stdio: 'inherit',
    shell: true,
  });
  
  parcel.on('close', (code) => {
    console.log(`Parcel exited with code ${code}`);
    process.exit(code);
  });
  
  return parcel;
}

// Main
console.log('🚀 Starting Portfolio-OS dev environment...\n');

startApiServer();
const parcel = startParcel();

console.log(`\n🌐 Site: http://localhost:${PARCEL_PORT}`);
console.log(`📝 Editor: http://localhost:${PARCEL_PORT}/editor.html`);
console.log(`📡 API: http://localhost:${API_PORT}/api/content\n`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  parcel.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  parcel.kill('SIGTERM');
  process.exit(0);
});
