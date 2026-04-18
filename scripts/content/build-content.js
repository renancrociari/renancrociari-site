#!/usr/bin/env node

/**
 * Content Build Script
 * 
 * Converte arquivos MDX em content/pages e content/work para HTML,
 * pronto para o Parcel processar e gerar o site final.
 * 
 * Uso: node scripts/content/build-content.js
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { parseContentFrontmatter } = require('../lib/parse-frontmatter.cjs');

const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'src', 'pages-generated');

const TEMPLATE_PAGE = `<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Google Tag Manager -->
  <script>(function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({
        'gtm.start':
          new Date().getTime(), event: 'gtm.js'
      }); var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
          'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-P7FKT9N');</script>
  <!-- End Google Tag Manager -->
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width" />
  <title>{{TITLE}}</title>
  <meta name="description" content="{{DESCRIPTION}}" />
  <meta property="og:site_name" content="Renan Crociari" />
  <meta name="author" content="Renan Crociari">
  <meta property="og:type" content="website" />
  <link rel="canonical" href="{{CANONICAL}}" />
  <!-- Favicon -->
  <link rel="icon" href="../../public/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../../public/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../../public/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../../public/favicon-16x16.png">
  <link rel="manifest" href="../../public/site.webmanifest">
  <link rel="mask-icon" href="../../public/safari-pinned-tab.svg" color="#5bbad5">
  <meta name="msapplication-TileColor" content="#38C545">
  <meta name="theme-color" content="#38C545">
  <!-- Open Graph -->
  <meta property="og:url" content="{{CANONICAL}}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:image" content="{{OG_IMAGE}}">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta property="twitter:domain" content="renancrociari.com">
  <meta property="twitter:url" content="{{CANONICAL}}">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{DESCRIPTION}}">
  <meta name="twitter:image" content="{{OG_IMAGE}}">
  <!-- CSS -->
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
  <!-- Fonts -->
  <link rel="preload" href="../fonts/degular.woff2" as="font" type="font/woff2" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&text=renancrociari" rel="stylesheet">
  <link rel="preload" href="../fonts/source-serif-regular-300.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../fonts/source-serif-bold-600.woff2" as="font" type="font/woff2" crossorigin>
  <!-- Scripts -->
  {{HEAD_EXTRA}}
  <script type="module" src="../scripts/script.js"></script>
</head>

<body class="{{BODY_CLASS}}">
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P7FKT9N" height="0" width="0"
      style="display:none;visibility:hidden">
    </iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>
  
  <!-- CONTENT_START -->
  {{CONTENT}}
  <!-- CONTENT_END -->
  
  <include src="components/password-dialog.html"></include>
  <include src="components/footer.html"></include>
</body>

</html>`;

function parseFrontmatter(content) {
    return parseContentFrontmatter(content);
}

function cleanOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        return;
    }

    for (const file of fs.readdirSync(OUTPUT_DIR)) {
        if (file.endsWith('.html')) {
            fs.unlinkSync(path.join(OUTPUT_DIR, file));
        }
    }
}

/** MDX em content/pages/&lt;slug&gt;/index.mdx → HTML em src/pages-generated/ (Parcel resolve ../images). */
function normalizePageAssetPathForGeneratedHtml(value) {
    if (value === undefined || value === null) return value;
    const s = String(value);
    if (s.startsWith('../../images/')) {
        return s.replace(/^\.\.\/\.\.\/images\//, '../images/');
    }
    if (s.startsWith('../images/')) {
        return s;
    }
    return s;
}

/** Para meta og:url absoluto: images/foo a partir de ../images/foo */
function stripToSiteRelativeUrlPath(value) {
    return String(value || '').replace(/\.\.\//g, '').replace(/^\//, '');
}

function slugToHtmlFromParsed(data, mdxContent, slug, type, renderer, routing) {
    const collection = type === 'page' ? 'pages' : 'work';
    const pageData =
        type === 'page'
            ? {
                  ...data,
                  featured_image: data.featured_image
                      ? normalizePageAssetPathForGeneratedHtml(data.featured_image)
                      : data.featured_image,
                  og_image: data.og_image
                      ? normalizePageAssetPathForGeneratedHtml(data.og_image)
                      : data.og_image,
              }
            : data;
    const route = routing.resolveSiteRoute({
        collection,
        documentSlug: slug,
        metadata: pageData,
    });
    const baseUrl = routing.SITE_BASE_URL;
    const canonical = route.canonicalUrl;
    const bodyClass = route.bodyClass;
    
    let htmlContent = '';
    let headExtra = '';

    if (type === 'page' && slug === 'home') {
        htmlContent = renderer.renderSiteHomePage(pageData, mdxContent);
    } else if (type === 'page' && slug === 'about') {
        htmlContent = renderer.renderSiteAboutPage(pageData, mdxContent);
    } else if (type === 'page') {
        htmlContent = renderer.renderSiteGenericPage(pageData, mdxContent);
    } else {
        // Mesmo pipeline que o preview do editor (sem `editorPreview`: sem instrumentação nem blocos só-preview).
        htmlContent = renderer.renderEditorPreviewMainHtml({
            collection: 'work',
            slug,
            metadata: data,
            markdownBody: mdxContent,
        });
        if (data.status === 'protected' && data.protected_password) {
            const contentAuthId = route.authId;
            headExtra = `<script>
(function () {
  var contentId = '${contentAuthId}';
  var AUTH_KEY = 'rc_auth_tokens';
  function isAuthenticated(id) {
    try {
      var raw = sessionStorage.getItem(AUTH_KEY);
      var tokens = raw ? JSON.parse(raw) : {};
      return !!tokens[id];
    } catch (e) {
      return false;
    }
  }
  if (isAuthenticated(contentId)) return;
  sessionStorage.setItem('rc_attempted_url', window.location.pathname);
  var u = new URL(window.location.href);
  u.pathname = '/authbridge.html';
  u.hash = '#password-protected?content=' + encodeURIComponent(contentId);
  window.location.replace(u.href);
})();
</script>`;
        }
    }
    
    const pageTitle = route.metaTitle || (pageData.title + ' · Renan Crociari');

    return {
        outputFile: route.outputFile,
        html: TEMPLATE_PAGE
        .replaceAll('{{TITLE}}', pageTitle)
        .replaceAll('{{DESCRIPTION}}', pageData.description || '')
        .replaceAll('{{CANONICAL}}', canonical)
        .replaceAll('{{OG_IMAGE}}', pageData.og_image ? `${baseUrl}/${stripToSiteRelativeUrlPath(pageData.og_image)}` : `${baseUrl}/images/renan-og-image.jpg`)
        .replaceAll('{{BODY_CLASS}}', bodyClass)
        .replaceAll('{{HEAD_EXTRA}}', headExtra)
        .replaceAll('{{CONTENT}}', htmlContent),
    };
}

function slugToHtml(content, slug, type, renderer, routing) {
    const { data, content: mdxContent } = parseFrontmatter(content);
    return slugToHtmlFromParsed(data, mdxContent, slug, type, renderer, routing);
}

async function buildContent() {
    console.log('🔨 Building content...\n');

    const sharedPath = path.join(__dirname, '..', '..', 'src', 'portfolio-os-integration', 'renderer', 'shared-renderer.mjs');
    const routingPath = path.join(__dirname, '..', '..', 'src', 'portfolio-os-integration', 'config', 'routing-manifest.mjs');
    const workContentPath = path.join(__dirname, '..', '..', 'src', 'portfolio-os-integration', 'editor', 'work-content.mjs');
    const pagesContentPath = path.join(__dirname, '..', '..', 'src', 'portfolio-os-integration', 'editor', 'pages-content.mjs');
    const renderer = await import(pathToFileURL(sharedPath).href);
    const routing = await import(pathToFileURL(routingPath).href);
    const workContent = await import(pathToFileURL(workContentPath).href);
    const pagesContent = await import(pathToFileURL(pagesContentPath).href);

    cleanOutputDir();
    
    const workDir = path.join(CONTENT_DIR, 'work');

    const pageEntries = pagesContent.listPagesEntriesForEditor();
    if (pageEntries.length) {
        console.log(`📄 Pages: ${pageEntries.length}`);
        for (const page of pageEntries) {
            const document = pagesContent.readPageDocumentForEditor(page.documentId);
            const metadata = pagesContent.materializePageMetadataForRender(document.rawMetadata);
            const { outputFile, html } = slugToHtmlFromParsed(
                metadata,
                document.content,
                page.slug,
                'page',
                renderer,
                routing
            );
            fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), html);
            console.log(`  ✓ ${outputFile}`);
        }
    }
    
    console.log('');
    
    if (fs.existsSync(workDir)) {
        const works = workContent.listWorkEntriesForEditor();
        console.log(`📄 Work: ${works.length}`);
        
        for (const work of works) {
            const document = workContent.readWorkDocumentForEditor(work.documentId);
            const metadata = workContent.materializeWorkMetadataForRender(document.rawMetadata);
            const { outputFile, html } = slugToHtmlFromParsed(
                metadata,
                document.content,
                work.slug,
                'work',
                renderer,
                routing
            );
            fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), html);
            console.log(`  ✓ ${outputFile}`);
        }
    }
    
    console.log('\n✅ Content build complete!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);
}

buildContent().catch(console.error);
