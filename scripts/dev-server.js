#!/usr/bin/env node
/**
 * Dev Server com API para Portfolio-OS
 * 
 * Este script roda:
 * 1. Parcel dev server (porta padrão 1234, ou PARCEL_PORT / próxima livre)
 * 2. API server (porta padrão 3001, ou API_PORT / próxima livre) para MDX
 *
 * Variáveis de ambiente opcionais:
 * - API_PORT: porta fixa da API (falha se estiver ocupada)
 * - PARCEL_PORT: porta fixa do Parcel (falha se estiver ocupada)
 */

const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { parseContentFrontmatter } = require('./lib/parse-frontmatter.cjs');
const { slugify } = require('./lib/slugify.cjs');

const CONTENT_DIR = path.join(__dirname, '..', 'content');

const DEFAULT_API_PORT = 3001;
const DEFAULT_PARCEL_PORT = 1234;
const API_PORT_SCAN_END = 3060;
const PARCEL_PORT_SCAN_END = 1290;

/**
 * @param {string} name
 * @returns {number | null}
 */
function readFixedPort(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.warn(`Ignorando ${name}="${raw}" (porta inválida).`);
    return null;
  }
  return n;
}

/**
 * @param {number} startPort
 * @param {number} endPortInclusive
 * @returns {Promise<number>}
 */
function findFreePort(startPort, endPortInclusive) {
  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      if (port > endPortInclusive) {
        reject(
          new Error(
            `Nenhuma porta livre entre ${startPort} e ${endPortInclusive}. ` +
              'Encerre o processo que usa a porta ou defina API_PORT / PARCEL_PORT.'
          )
        );
        return;
      }
      const s = net.createServer();
      s.once('error', () => {
        s.close();
        tryListen(port + 1);
      });
      s.listen(port, () => {
        s.close(() => resolve(port));
      });
    };
    tryListen(startPort);
  });
}

/**
 * @param {'API_PORT' | 'PARCEL_PORT'} envName
 * @param {number} preferredStart
 * @param {number} scanEndInclusive
 */
async function resolveListeningPort(envName, preferredStart, scanEndInclusive) {
  const fixed = readFixedPort(envName);
  if (fixed !== null) {
    try {
      return await findFreePort(fixed, fixed);
    } catch (e) {
      throw new Error(
        `Porta ${envName}=${fixed} está em uso. Libere a porta ou escolha outro valor.`
      );
    }
  }
  return findFreePort(preferredStart, scanEndInclusive);
}

function applyDevCors(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const origin = req.headers.origin;
  if (
    origin &&
    (/^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

/** @returns {{ metadata: Record<string, unknown>, content: string }} */
function parseFrontmatter(raw) {
  const { data, content } = parseContentFrontmatter(raw);
  return { metadata: data, content };
}

function yamlScalarLine(key, value) {
  if (typeof value === 'boolean') {
    return `${key}: ${value ? 'true' : 'false'}`;
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${key}: ${value}`;
  }
  const strValue = String(value);
  const needsQuotes =
    strValue.includes(':') ||
    strValue.includes('#') ||
    strValue.includes('"') ||
    strValue.includes('\n') ||
    strValue.includes('[') ||
    strValue.includes(']') ||
    strValue === '' ||
    strValue === 'true' ||
    strValue === 'false';
  if (needsQuotes) {
    return `${key}: "${strValue.replace(/"/g, '\\"')}"`;
  }
  return `${key}: ${strValue}`;
}

function serializeFrontmatter(metadata, content) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        const s = String(item);
        const q = s.includes(':') || /[\s"#]/.test(s);
        lines.push(q ? `  - "${s.replace(/"/g, '\\"')}"` : `  - ${s}`);
      }
      continue;
    }
    lines.push(yamlScalarLine(key, value));
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
      published: metadata.published !== 'false' && metadata.published !== false,
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
  const base = slug && String(slug).trim() ? slugify(String(slug).trim()) : slugify(title);
  const finalSlug = (base || 'untitled').substring(0, 100);
  
  const metadata = {
    title,
    slug: finalSlug,
    type: collection === 'work' ? 'work' : 'page',
    publishedAt: new Date().toISOString().split('T')[0],
    published: 'false',
    ...(collection === 'work' ? { description: 'Em breve' } : { description: 'Rascunho' }),
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
  applyDevCors(req, res);
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = url.pathname;

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
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
  
  // /api/verify-password
  if (pathname === '/api/verify-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { password, hash } = JSON.parse(body);
        if (!password || !hash) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing password or hash' }));
          return;
        }
        const valid = bcrypt.compareSync(password, hash);
        res.statusCode = 200;
        res.end(JSON.stringify({ valid }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Start API Server
function startApiServer(port) {
  const server = http.createServer(handleApiRequest);

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      console.log(`📡 API server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

// Start Parcel
function startParcel(port) {
  const parcel = spawn(
    'npx',
    [
      'parcel',
      'src/pages/*.html',
      'src/pages-generated/*.html',
      '--port',
      String(port),
    ],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

  parcel.on('close', (code) => {
    console.log(`Parcel exited with code ${code}`);
    process.exit(code ?? 0);
  });

  return parcel;
}

async function main() {
  console.log('🚀 Starting Portfolio-OS dev environment...\n');

  let apiPort;
  let parcelPort;
  try {
    apiPort = await resolveListeningPort('API_PORT', DEFAULT_API_PORT, API_PORT_SCAN_END);
    parcelPort = await resolveListeningPort(
      'PARCEL_PORT',
      DEFAULT_PARCEL_PORT,
      PARCEL_PORT_SCAN_END
    );
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
    return;
  }

  let apiServer;
  let parcel;
  try {
    apiServer = await startApiServer(apiPort);
  } catch (err) {
    console.error('Falha ao iniciar a API:', err.message || err);
    process.exit(1);
    return;
  }

  parcel = startParcel(parcelPort);

  console.log(`\n🌐 Site: http://localhost:${parcelPort}`);
  console.log(`📝 Editor: http://localhost:${parcelPort}/editor.html`);
  console.log(`📡 API: http://localhost:${apiPort}/api/content`);
  console.log(
    `🔐 Password verify: http://localhost:${apiPort}/api/verify-password\n`
  );

  function shutdown(signal) {
    return () => {
      console.log(`\n👋 Shutting down (${signal})...`);
      if (parcel) {
        parcel.kill(signal);
      }
      if (apiServer) {
        apiServer.close(() => process.exit(0));
        return;
      }
      process.exit(0);
    };
  }

  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
