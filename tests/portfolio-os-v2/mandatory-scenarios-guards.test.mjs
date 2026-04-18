import assert from 'node:assert';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const manifestHref = pathToFileURL(
  join(root, 'src/portfolio-os-integration/config/routing-manifest.mjs')
).href;

/**
 * Guardas estáticos para cenários do plano v2 (secção «Testes e Cenários Obrigatórios»)
 * que não dependem do browser.
 */

test('página pública journal (legado) referencia proteção case-journal-finder', () => {
  const html = readFileSync(
    join(root, 'src/pages/connecting-every-discovery-with-a-worthy-home.html'),
    'utf8'
  );
  assert.ok(
    html.includes('case-journal-finder') && html.includes('isAuthenticated'),
    'HTML legado deve exigir auth antes de mostrar conteúdo'
  );
});

test(
  'artefato dist/ não deve incluir referências ao editor-sidecar',
  { skip: !existsSync(join(root, 'dist')) },
  () => {
    const distDir = join(root, 'dist');
    const bad = [];

    function walk(dir) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) {
          if (name === 'editor-sidecar') {
            bad.push(`dir:${p}`);
          } else {
            walk(p);
          }
        } else if (
          st.isFile() &&
          ['.html', '.js', '.css', '.json'].includes(extname(name))
        ) {
          const chunk = readFileSync(p, 'utf8').slice(0, 400_000);
          if (chunk.includes('editor-sidecar')) {
            bad.push(`file:${p}`);
          }
        }
      }
    }

    walk(distDir);
    assert.strictEqual(bad.length, 0, `Ocorrências inesperadas: ${bad.join('; ')}`);
  }
);

test('paridade HTML 3 cases: ficheiro work-html-parity.test.mjs presente', () => {
  assert.ok(
    existsSync(join(root, 'tests/portfolio-os-v2/work-html-parity.test.mjs')),
    'Suite B18 em work-html-parity.test.mjs'
  );
});

test('manifesto: journal-finder é protegido e tem previewPath do editor', async () => {
  const { MANAGED_ROUTE_MANIFEST } = await import(manifestHref);
  const j = MANAGED_ROUTE_MANIFEST.work['journal-finder'];
  assert.strictEqual(j.isProtected, true);
  assert.ok(String(j.previewPath || '').includes('/editor/preview/work/journal-finder'));
});
