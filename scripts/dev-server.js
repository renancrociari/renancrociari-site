#!/usr/bin/env node
/**
 * Dev server unificado do projeto.
 *
 * Sobe:
 * 1. Parcel para o site público local
 * 2. Next sidecar para o editor original + APIs locais
 *
 * Produção continua ignorando o sidecar. `npm start` é apenas desenvolvimento.
 */

const { execFileSync, spawn } = require('child_process');
const net = require('net');
const path = require('path');
const { getSiteEntryFiles, ROOT_DIR } = require('./lib/site-entrypoints.cjs');

const EDITOR_SIDECAR_DIR = path.join(ROOT_DIR, 'editor-sidecar');

const DEFAULT_API_PORT = 3001;
const DEFAULT_PARCEL_PORT = 1234;
const API_PORT_SCAN_END = 3060;
const PARCEL_PORT_SCAN_END = 1290;

function readFixedPort(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    console.warn(`Ignorando ${name}="${raw}" (porta inválida).`);
    return null;
  }
  return value;
}

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

      const server = net.createServer();
      server.once('error', () => {
        server.close();
        tryListen(port + 1);
      });
      server.listen(port, () => {
        server.close(() => resolve(port));
      });
    };

    tryListen(startPort);
  });
}

async function resolveListeningPort(envName, preferredStart, scanEndInclusive) {
  const fixed = readFixedPort(envName);
  if (fixed !== null) {
    try {
      return await findFreePort(fixed, fixed);
    } catch {
      throw new Error(
        `Porta ${envName}=${fixed} está em uso. Libere a porta ou escolha outro valor.`
      );
    }
  }
  return findFreePort(preferredStart, scanEndInclusive);
}

function buildGeneratedContent() {
  console.log('🔄 Refreshing generated content...\n');
  execFileSync(process.execPath, [path.join(__dirname, 'content', 'build-content.js')], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
}

async function startParcel(port) {
  const entryFiles = await getSiteEntryFiles();
  const parcelBin = require.resolve('parcel/lib/bin.js');

  const child = spawn(
    process.execPath,
    [parcelBin, ...entryFiles, '--port', String(port)],
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    }
  );

  child.meta = { name: 'Parcel', port };
  return child;
}

function startEditorSidecar(apiPort, parcelPort) {
  const nextBin = require.resolve('next/dist/bin/next');
  const child = spawn(
    process.execPath,
    [nextBin, 'dev', '-p', String(apiPort), '--hostname', '0.0.0.0'],
    {
      cwd: EDITOR_SIDECAR_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORTFOLIO_API_ORIGIN: `http://localhost:${apiPort}`,
        PORTFOLIO_SITE_ORIGIN: `http://localhost:${parcelPort}`,
      },
    }
  );

  child.meta = { name: 'Editor sidecar', port: apiPort };
  return child;
}

async function main() {
  console.log('🚀 Starting Portfolio-OS dev environment...\n');

  try {
    buildGeneratedContent();
  } catch (error) {
    console.error(
      'Falha ao gerar pages-managed antes do dev server:',
      error.message || error
    );
    process.exit(1);
    return;
  }

  let apiPort;
  let parcelPort;
  try {
    apiPort = await resolveListeningPort('API_PORT', DEFAULT_API_PORT, API_PORT_SCAN_END);
    parcelPort = await resolveListeningPort(
      'PARCEL_PORT',
      DEFAULT_PARCEL_PORT,
      PARCEL_PORT_SCAN_END
    );
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
    return;
  }

  const children = [];
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n👋 Shutting down (${signal})...`);
    for (const child of children) {
      if (!child.killed) {
        child.kill(signal);
      }
    }
  };

  const attachExitHandler = (child) => {
    child.on('exit', (code, signal) => {
      if (shuttingDown) {
        return;
      }

      console.error(
        `${child.meta?.name || 'Child process'} finalizou ` +
          `${signal ? `com sinal ${signal}` : `com código ${code ?? 0}`}.`
      );
      shutdown('SIGTERM');
      process.exit(code ?? 1);
    });
  };

  try {
    const parcel = await startParcel(parcelPort);
    const sidecar = startEditorSidecar(apiPort, parcelPort);
    children.push(parcel, sidecar);
    attachExitHandler(parcel);
    attachExitHandler(sidecar);
  } catch (error) {
    console.error('Falha ao iniciar o ambiente de desenvolvimento:', error.message || error);
    shutdown('SIGTERM');
    process.exit(1);
    return;
  }

  console.log(`\n🌐 Site: http://localhost:${parcelPort}`);
  console.log(`📝 Editor redirect: http://localhost:${parcelPort}/editor.html`);
  console.log(`🧠 Editor sidecar: http://localhost:${apiPort}/editor`);
  console.log(`📡 API health: http://localhost:${apiPort}/api/health`);
  console.log(`📄 Work API: http://localhost:${apiPort}/api/editor/work`);
  console.log(`🗂️ Legacy content API: http://localhost:${apiPort}/api/content`);
  console.log(`🔐 Password verify: http://localhost:${apiPort}/api/verify-password\n`);

  process.on('SIGINT', () => {
    shutdown('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
