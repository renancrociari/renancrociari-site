/**
 * Shared Renderer
 * 
 * Renderer compartilhado entre o site público e o preview do editor.
 * Converte conteúdo MDX/canônico em HTML usando os mesmos componentes e CSS.
 * 
 * Compatibilidade com Portfolio-OS Blocks:
 * @see BLOCK_CATALOG.md para catálogo completo
 */

import { rewriteRelativeImagePaths } from '@portfolio-os/core/content-utils';
import { resolveSiteRouteFromPath } from '../config/routing-manifest.mjs';

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [isPreview] - Se é preview do editor
 * @property {string} [baseUrl] - URL base para resolução de links
 * @property {'comment'|'warning'|'error'|'degraded'} [fallbackMode='comment'] - Modo de fallback
 * @property {string} [rewriteMarkdownImageBase] - Base opcional para `rewriteRelativeImagePaths` do core (ex.: `../` para snippets sem prefixo)
 * @property {boolean} [editorInstrumentation] - Atributos `data-editor-*` para preview postMessage (não usar no HTML público).
 * @property {boolean} [editorPreviewShell] - Blocos extra shell-meta/shell-summary só para preview do editor (não usar no build público).
 */

/**
 * Aplica o utilitário do core e corrige o caso comum em que o conteúdo já usa `](../…)`
 * e a base é `../`, evitando `](../../…)` duplicado.
 * @param {string} text
 * @param {string} [base]
 * @returns {string}
 */
function applyRewriteRelativeImagePaths(text, base) {
  const src = text ?? '';
  if (!base) return src;
  let out = rewriteRelativeImagePaths(src, base);
  const norm = String(base).replace(/\/$/, '');
  if (norm === '..' || norm === '.') {
    out = out.replace(/\]\(\.\.\/\.\.\//g, '](../');
  }
  return out;
}

/**
 * Catálogo de blocos suportados e seus mapeamentos
 * Chave: nome do componente Portfolio-OS / bloco local
 * Valor: função de renderização e metadados
 */
const BLOCK_REGISTRY = {
  // Narrative
  'CaseHero': { renderer: 'hero', category: 'narrative', required: [] },
  'hero': { renderer: 'hero', category: 'narrative', required: [] },
  
  'PullQuote': { renderer: 'quote', category: 'narrative', required: ['quote'] },
  'quote': { renderer: 'quote', category: 'narrative', required: ['quote'] },
  
  'Callout': { renderer: 'callout', category: 'narrative', required: [] },
  'callout': { renderer: 'callout', category: 'narrative', required: [] },
  
  'TOC': { renderer: 'toc', category: 'narrative', required: ['items'] },
  'toc': { renderer: 'toc', category: 'narrative', required: ['items'] },
  
  // Evidence
  'ImpactResults': { renderer: 'results', category: 'evidence', required: [] },
  'Stats': { renderer: 'results', category: 'evidence', required: [] }, // alias
  'results': { renderer: 'results', category: 'evidence', required: [] },
  
  'MetadataPanel': { renderer: 'metadata', category: 'evidence', required: [] },
  'metadata': { renderer: 'metadata', category: 'evidence', required: [] },
  
  // Media
  'Figure': { renderer: 'image', category: 'media', required: ['src', 'alt'] },
  'image': { renderer: 'image', category: 'media', required: ['src', 'alt'] },
  
  'GalleryGrid': { renderer: 'gallery', category: 'media', required: ['items'] },
  'ImageGrid': { renderer: 'gallery', category: 'media', required: ['items'] }, // alias
  'gallery': { renderer: 'gallery', category: 'media', required: ['items'] },
  
  'FigmaEmbed': { renderer: 'figma', category: 'media', required: ['url'] },
  'figma': { renderer: 'figma', category: 'media', required: ['url'] },
  
  'VideoEmbed': { renderer: 'video', category: 'media', required: ['url'] },
  'video': { renderer: 'video', category: 'media', required: ['url'] },
  
  // Process
  'ProcessTimeline': { renderer: 'timeline', category: 'process', required: ['items'] },
  'timeline': { renderer: 'timeline', category: 'process', required: ['items'] },
  
  // Markdown nativo
  'heading': { renderer: 'heading', category: 'markdown', required: [] },
  'paragraph': { renderer: 'paragraph', category: 'markdown', required: [] },
  'list': { renderer: 'list', category: 'markdown', required: [] },
  'divider': { renderer: 'divider', category: 'markdown', required: [] },
  'embed': { renderer: 'embed', category: 'markdown', required: [] },
  'textBlock': { renderer: 'textBlock', category: 'markdown', required: [] },
};

/**
 * Blocos não suportados (legado ou não implementado)
 * Estes recebem fallback silencioso
 */
const UNSUPPORTED_BLOCKS = new Set([
  'BeforeAfter',   // Legado, mantido para runtime compatibility
  'Confidential',  // Legado, mantido para runtime compatibility
]);

/**
 * Valida se um bloco tem as props obrigatórias
 * @param {string} type
 * @param {Record<string, any>} props
 * @returns {string[]}
 */
function validateBlockProps(type, props) {
  const registry = BLOCK_REGISTRY[type];
  if (!registry) return ['tipo desconhecido'];
  
  const missing = [];
  for (const required of registry.required) {
    if (props[required] === undefined || props[required] === null || props[required] === '') {
      missing.push(required);
    }
  }
  return missing;
}

/**
 * Renderiza fallback para blocos não suportados ou inválidos
 * @param {string} type
 * @param {Record<string, any>} props
 * @param {RenderOptions} options
 * @param {Object} meta
 * @returns {string}
 */
function renderFallback(type, props, options, meta = {}) {
  const mode = options.fallbackMode || 'comment';
  const { missing = [], message = '' } = meta;
  
  const info = message || (missing.length > 0 
    ? `Props faltando: ${missing.join(', ')}` 
    : `Bloco "${type}" não suportado`);
  
  switch (mode) {
    case 'error':
      return `
        <div class="block-error" style="padding: 1rem; background: #fee2e2; border: 1px solid #ef4444; border-radius: 4px; color: #991b1b;">
          <strong>Erro de renderização:</strong> ${escapeHtml(info)}
          <br><small>Type: ${type}</small>
        </div>
      `;
    
    case 'warning':
      return `
        <div class="block-warning" style="padding: 1rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; color: #92400e;">
          <strong>Aviso:</strong> ${escapeHtml(info)}
        </div>
      `;
    
    case 'degraded':
      // Tenta renderizar com o que tem
      return `
        <div class="block-degraded" style="opacity: 0.7; border: 1px dashed #9ca3af; padding: 0.5rem;">
          ${renderDegradedBlock(type, props, options)}
        </div>
      `;
    
    case 'comment':
    default:
      // Fallback silencioso para desenvolvimento
      return `<!-- [${type}] ${info} -->`;
  }
}

/**
 * Tenta renderizar um bloco degradado com props disponíveis
 */
function renderDegradedBlock(type, props, options) {
  // Para blocos de mídia, tenta renderizar mesmo sem todas as props
  if (['Figure', 'image'].includes(type) && props.src) {
    return renderImage({ ...props, alt: props.alt || 'Imagem' }, options);
  }
  if (['VideoEmbed', 'video'].includes(type) && props.url) {
    return renderVideo(props);
  }
  return `<span style="color: #6b7280;">[${type}]</span>`;
}

/**
 * Resolve o nome do bloco para o renderer (canonicalização)
 * @param {string} type
 * @returns {string|null}
 */
function resolveBlockRenderer(type) {
  const registry = BLOCK_REGISTRY[type];
  return registry ? registry.renderer : null;
}

/**
 * Renderiza blocos de conteúdo editorial
 * @param {Array<{type: string, props: Record<string, any>}>} blocks
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderBlocks(blocks, options = {}) {
  if (!Array.isArray(blocks)) return '';
  
  return blocks.map((block, index) => {
    try {
      return renderBlock(block, options);
    } catch (err) {
      console.error(`Erro renderizando bloco ${index}:`, err);
      return renderFallback(block.type, block.props, options, { 
        message: `Erro: ${err.message}` 
      });
    }
  }).join('\n');
}

/**
 * Renderiza um único bloco
 * @param {{type: string, props: Record<string, any>}} block
 * @param {RenderOptions} options
 * @returns {string}
 */
function renderBlock(block, options) {
  const { type, props = {} } = block;
  
  // Verifica se é bloco não suportado (legado)
  if (UNSUPPORTED_BLOCKS.has(type)) {
    return renderFallback(type, props, options, { 
      message: `Bloco legado "${type}" não implementado - mantido para compatibilidade` 
    });
  }
  
  // Resolve nome canônico do renderer
  const rendererName = resolveBlockRenderer(type);
  
  if (!rendererName) {
    return renderFallback(type, props, options, { 
      message: `Bloco desconhecido: ${type}. Verifique BLOCK_CATALOG.md` 
    });
  }
  
  // Valida props obrigatórias
  const registry = BLOCK_REGISTRY[type];
  const missing = validateBlockProps(type, props);
  
  if (missing.length > 0) {
    // Tenta modo degraded primeiro
    if (options.fallbackMode === 'degraded') {
      return renderDegradedBlock(type, props, options);
    }
    return renderFallback(type, props, options, { missing });
  }
  
  // Renderiza o bloco
  switch (rendererName) {
    case 'heading':
      return renderHeading(props);
    case 'paragraph':
      return renderParagraph(props);
    case 'image':
      return renderImage(props, options);
    case 'gallery':
      return renderGallery(props, options);
    case 'video':
      return renderVideo(props);
    case 'quote':
      return renderQuote(props);
    case 'list':
      return renderList(props);
    case 'divider':
      return '<hr class="content-divider" />';
    case 'embed':
      return renderEmbed(props);
    case 'textBlock':
      return renderTextBlock(props);
    case 'results':
      return renderResults(props);
    case 'hero':
      return renderHero(props, options);
    case 'callout':
      return renderCallout(props);
    case 'toc':
      return renderToc(props);
    case 'metadata':
      return renderMetadataPanel(props);
    case 'timeline':
      return renderTimeline(props);
    case 'figma':
      return renderFigmaEmbed(props);
    default:
      return renderFallback(type, props, options, { 
        message: `Renderer "${rendererName}" não implementado` 
      });
  }
}

function renderHeading({ level = 2, text, anchor }) {
  const tag = `h${level}`;
  const idAttr = anchor ? ` id="${anchor}"` : '';
  return `<${tag}${idAttr} class="content-heading h${level}">${escapeHtml(text)}</${tag}>`;
}

function renderParagraph({ text, className = '' }) {
  const cls = className ? ` class="${className}"` : '';
  return `<p${cls}>${escapeHtml(text)}</p>`;
}

function renderImage({ src, alt, caption, fullWidth }, options) {
  const srcResolved = resolvePath(src, options);
  const captionHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
  const widthClass = fullWidth ? ' full-width' : '';
  
  return `
    <figure class="content-image${widthClass}">
      <img src="${srcResolved}" alt="${escapeHtml(alt || '')}" loading="lazy" />
      ${captionHtml}
    </figure>
  `;
}

function renderGallery({ images, items, columns = 2 }, options) {
  // Portfolio-OS usa 'items' (JSON string) + 'columns'
  // Formato legado usa 'images' (array)
  let galleryItems = images || [];
  
  // Se recebeu items como string JSON (Portfolio-OS), converte
  if (typeof items === 'string') {
    try {
      galleryItems = JSON.parse(items);
    } catch (e) {
      console.warn('Gallery items não é JSON válido:', items);
      return '<!-- Gallery: items inválido -->';
    }
  } else if (Array.isArray(items)) {
    galleryItems = items;
  }
  
  if (!Array.isArray(galleryItems) || galleryItems.length === 0) {
    return '<!-- Gallery: sem imagens -->';
  }
  
  // Limita colunas entre 1-4
  const colCount = Math.max(1, Math.min(4, parseInt(columns) || 2));
  
  const imagesHtml = galleryItems.map(img => `
    <div class="gallery-item" style="overflow: hidden; border-radius: 8px;">
      <img src="${resolvePath(img.src || img.url, options)}" 
           alt="${escapeHtml(img.alt || img.caption || '')}" 
           loading="lazy"
           style="width: 100%; height: auto; display: block;" />
      ${img.caption ? `<figcaption style="font-size: 0.75rem; color: #6b7280; padding: 0.5rem;">${escapeHtml(img.caption)}</figcaption>` : ''}
    </div>
  `).join('');
  
  return `
    <div class="content-gallery" style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: 1rem; margin: 1.5rem 0;">
      ${imagesHtml}
    </div>
  `;
}

function renderVideo({ src, url, title, provider }) {
  // Portfolio-OS usa 'url', formato legado usa 'src'
  const videoUrl = url || src;
  
  if (!videoUrl) return '<!-- Video: URL obrigatória -->';
  
  // Detecta YouTube se não especificado
  const isYouTube = provider === 'youtube' || 
                    videoUrl.includes('youtube.com') || 
                    videoUrl.includes('youtu.be');
  
  if (isYouTube) {
    // Extrai video ID do YouTube
    let videoId = '';
    if (videoUrl.includes('youtube.com/watch')) {
      const match = videoUrl.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : '';
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else {
      videoId = src || '';
    }
    
    if (!videoId) return '<!-- Video: ID do YouTube não encontrado -->';
    
    return `
      <div class="content-video" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 1.5rem 0;">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}" 
          title="${escapeHtml(title || 'Video')}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    `;
  }
  
  // Vídeo direto (MP4)
  return `
    <div class="content-video" style="margin: 1.5rem 0; border-radius: 8px; overflow: hidden;">
      <video controls style="width: 100%; display: block;">
        <source src="${videoUrl}" type="video/mp4">
        Seu navegador não suporta vídeos.
      </video>
    </div>
  `;
}

function renderQuote({ text, quote, author, role, company, source }) {
  // Portfolio-OS usa 'quote', local usa 'text'
  const quoteText = text || quote;
  
  // Portfolio-OS: author + role + company
  // Local legado: author + source
  let citeText = '';
  if (author) {
    citeText = escapeHtml(author);
    if (role) citeText += `, ${escapeHtml(role)}`;
    if (company) citeText += ` · ${escapeHtml(company)}`;
  } else if (source) {
    citeText = escapeHtml(source);
  }
  
  const citeHtml = citeText ? `<cite>${citeText}</cite>` : '';
  
  return `
    <blockquote class="content-quote">
      <p>${escapeHtml(quoteText)}</p>
      ${citeHtml}
    </blockquote>
  `;
}

function renderList({ items, ordered = false }) {
  if (!Array.isArray(items)) return '';
  
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  
  return `<${tag} class="content-list">${itemsHtml}</${tag}>`;
}

function renderEmbed({ url, title }) {
  return `
    <div class="content-embed">
      <iframe src="${url}" title="${escapeHtml(title || 'Embedded content')}" loading="lazy"></iframe>
    </div>
  `;
}

function renderTextBlock({ title, content, columns = 1 }) {
  const colClass = columns > 1 ? ` columns-${columns}` : '';
  return `
    <div class="text-block${colClass}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      ${content ? `<p>${escapeHtml(content)}</p>` : ''}
    </div>
  `;
}

function renderResults({ title, summary, items, 
  metricOneLabel, metricOneValue, metricOneNote,
  metricTwoLabel, metricTwoValue, metricTwoNote,
  metricThreeLabel, metricThreeValue, metricThreeNote 
}) {
  // Converte formato Portfolio-OS (metricXLabel/Value/Note) para items array
  let results = [];
  
  if (Array.isArray(items)) {
    // Já está no formato items
    results = items;
  } else {
    // Converte do formato Portfolio-OS
    if (metricOneValue) {
      results.push({
        label: metricOneLabel,
        value: metricOneValue,
        note: metricOneNote
      });
    }
    if (metricTwoValue) {
      results.push({
        label: metricTwoLabel,
        value: metricTwoValue,
        note: metricTwoNote
      });
    }
    if (metricThreeValue) {
      results.push({
        label: metricThreeLabel,
        value: metricThreeValue,
        note: metricThreeNote
      });
    }
  }
  
  if (results.length === 0) return '<!-- Results: sem métricas -->';
  
  const itemsHtml = results.map(item => `
    <div class="result-item" style="text-align: center; padding: 1rem;">
      <span class="result-number" style="display: block; font-size: 2rem; font-weight: 700; color: #10b981;">${escapeHtml(item.value)}</span>
      <span class="result-label" style="display: block; font-size: 0.875rem; color: #374151; margin-top: 0.25rem;">${escapeHtml(item.label)}</span>
      ${item.note ? `<span class="result-note" style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${escapeHtml(item.note)}</span>` : ''}
    </div>
  `).join('');
  
  return `
    <div class="results-block" style="margin: 2rem 0; padding: 1.5rem; background: #f9fafb; border-radius: 8px;">
      ${title ? `<h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(title)}</h3>` : ''}
      ${summary ? `<p style="margin: 0 0 1.5rem 0; color: #6b7280; font-size: 0.875rem;">${escapeHtml(summary)}</p>` : ''}
      <div class="results-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderHero({ title, subtitle, image, tags }, options) {
  const imageHtml = image ? `
    <figure class="featured-image mt-2xl">
      <img src="${resolvePath(image, options)}" class="featured-image-img" alt="" fetchpriority="high" />
    </figure>
  ` : '';
  
  const tagsHtml = Array.isArray(tags) && tags.length > 0
    ? `<div class="hero-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  
  return `
    <header class="content-header mt-5xl">
      <div class="wrapper">
        <div class="content-hero">
          <h1 class="t-gray-200">${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="hero-subtitle">${escapeHtml(subtitle)}</p>` : ''}
          ${tagsHtml}
          ${imageHtml}
        </div>
      </div>
    </header>
  `;
}

/**
 * Renderiza bloco de callout/insight
 * @param {{title?: string, variant?: 'insight'|'warning'|'note', children?: string}} props
 * @returns {string}
 */
function renderCallout({ title, variant = 'insight', children }) {
  const variantClass = `callout-${variant}`;
  const variantStyles = {
    insight: 'background: #ecfdf5; border-color: #10b981; color: #065f46;',
    warning: 'background: #fffbeb; border-color: #f59e0b; color: #92400e;',
    note: 'background: #eff6ff; border-color: #3b82f6; color: #1e40af;'
  };
  
  const style = variantStyles[variant] || variantStyles.insight;
  
  return `
    <div class="callout ${variantClass}" style="padding: 1rem; border-left: 4px solid; margin: 1rem 0; ${style}">
      ${title ? `<h4 style="margin: 0 0 0.5rem 0; font-weight: 600;">${escapeHtml(title)}</h4>` : ''}
      ${children ? `<div>${escapeHtml(children)}</div>` : ''}
    </div>
  `;
}

/**
 * Renderiza tabela de conteúdo
 * @param {{title?: string, items: string}} props - items é JSON string
 * @returns {string}
 */
function renderToc({ title = 'On this page', items }) {
  let parsedItems = [];
  try {
    parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  } catch (e) {
    console.warn('TOC items não é JSON válido:', items);
    return '<!-- TOC: items inválido -->';
  }
  
  if (!Array.isArray(parsedItems)) {
    return '<!-- TOC: items deve ser array -->';
  }
  
  const itemsHtml = parsedItems.map(item => `
    <li><a href="#${item.id || item.href || ''}">${escapeHtml(item.label)}</a></li>
  `).join('');
  
  return `
    <nav class="toc" style="margin: 1.5rem 0; padding: 1rem; background: #f9fafb; border-radius: 8px;">
      <h5 style="margin: 0 0 0.75rem 0; font-size: 0.875rem; color: #6b7280;">${escapeHtml(title)}</h5>
      <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.875rem;">
        ${itemsHtml}
      </ul>
    </nav>
  `;
}

/**
 * Renderiza painel de metadados do case study
 * @param {{rows?: Array<{label: string, value: string}>}} props
 * @returns {string}
 */
function renderMetadataPanel({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<!-- MetadataPanel: sem rows -->';
  }
  
  const rowsHtml = rows.map(row => `
    <div class="metadata-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
      <span style="color: #6b7280; font-size: 0.875rem;">${escapeHtml(row.label)}</span>
      <span style="font-weight: 500; font-size: 0.875rem;">${escapeHtml(row.value)}</span>
    </div>
  `).join('');
  
  return `
    <div class="metadata-panel" style="margin: 1.5rem 0; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${rowsHtml}
    </div>
  `;
}

/**
 * Renderiza timeline de processo
 * @param {{title?: string, items: string}} props - items é JSON string
 * @returns {string}
 */
function renderTimeline({ title, items }) {
  let parsedItems = [];
  try {
    parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  } catch (e) {
    console.warn('Timeline items não é JSON válido:', items);
    return '<!-- Timeline: items inválido -->';
  }
  
  if (!Array.isArray(parsedItems)) {
    return '<!-- Timeline: items deve ser array -->';
  }
  
  const itemsHtml = parsedItems.map((item, index) => `
    <div class="timeline-item" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
      <div class="timeline-marker" style="flex-shrink: 0; width: 2rem; height: 2rem; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
        ${index + 1}
      </div>
      <div class="timeline-content" style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h5 style="margin: 0; font-weight: 600;">${escapeHtml(item.title)}</h5>
          ${item.period ? `<span style="font-size: 0.75rem; color: #6b7280;">${escapeHtml(item.period)}</span>` : ''}
        </div>
        ${item.description ? `<p style="margin: 0.25rem 0 0 0; color: #4b5563; font-size: 0.875rem;">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </div>
  `).join('');
  
  return `
    <div class="process-timeline" style="margin: 2rem 0;">
      ${title ? `<h4 style="margin-bottom: 1rem;">${escapeHtml(title)}</h4>` : ''}
      <div class="timeline-items">
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Renderiza embed do Figma
 * @param {{url: string, title?: string, height?: number, caption?: string}} props
 * @returns {string}
 */
function renderFigmaEmbed({ url, title = 'Figma', height = 640, caption }) {
  if (!url) return '<!-- FigmaEmbed: URL obrigatória -->';
  
  // Normaliza URL do Figma para embed
  let embedUrl = url;
  
  // Converte URL de design para embed
  if (url.includes('figma.com/design/') || url.includes('figma.com/file/')) {
    const fileMatch = url.match(/figma\.com\/(?:design|file)\/([^/?]+)/);
    const nodeMatch = url.match(/[?&]node-id=([^&]+)/);
    
    if (fileMatch) {
      const fileKey = fileMatch[1];
      const nodeId = nodeMatch ? nodeMatch[1].replace('-', ':') : '';
      embedUrl = `https://www.figma.com/embed?embed_host=renancrociari&url=${encodeURIComponent(url)}`;
    }
  }
  
  const captionHtml = caption ? `<p style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">${escapeHtml(caption)}</p>` : '';
  
  return `
    <figure class="figma-embed" style="margin: 1.5rem 0;">
      <div style="position: relative; padding-bottom: ${Math.min(height, 800)}px; height: 0; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px;">
        <iframe 
          src="${embedUrl}" 
          title="${escapeHtml(title)}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
      ${captionHtml}
    </figure>
  `;
}

/**
 * Resolve caminhos relativos
 * @param {string} path
 * @param {RenderOptions} options
 * @returns {string}
 */
function resolvePath(path, options) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }
  if (path.startsWith('/')) {
    return path;
  }
  return path; // Mantém relativo
}

/**
 * Escapa HTML básico
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInlineMarkdown(text) {
  if (!text) return '';
  let out = escapeHtml(String(text));
  out = out.replace(/&lt;br\s*\/?&gt;/gi, '<br />');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^\w])_([^_]+)_/g, '$1<i>$2</i>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>');
  return out;
}

function parseMarkdownImageLine(line) {
  const match = String(line || '').match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) return null;
  return {
    alt: match[1].trim(),
    src: match[2].trim(),
  };
}

function parseMarkdownHeading(line) {
  const match = String(line || '').trim().match(/^(#{1,3})\s+(.+)$/);
  if (!match) return null;
  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

function isMarkdownSpecialLine(line) {
  const value = String(line || '').trim();
  return (
    /^#{1,3}\s+/.test(value) ||
    value === '---' ||
    value.startsWith('![') ||
    /^[-*]\s+/.test(value) ||
    /^\d+\.\s+/.test(value)
  );
}

function parseMarkdownList(lines, startIndex, ordered) {
  const itemRegex = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;
  const items = [];
  let currentItem = '';
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = String(lines[i] || '').trim();

    if (!trimmed) {
      const nextTrimmed = String(lines[i + 1] || '').trim();

      if (itemRegex.test(nextTrimmed)) {
        if (currentItem) {
          items.push(currentItem.trim());
          currentItem = '';
        }
        i += 1;
        continue;
      }

      if (currentItem && nextTrimmed && !isMarkdownSpecialLine(nextTrimmed)) {
        currentItem += ' ';
        i += 1;
        continue;
      }

      break;
    }

    const itemMatch = trimmed.match(itemRegex);
    if (itemMatch) {
      if (currentItem) {
        items.push(currentItem.trim());
      }
      currentItem = itemMatch[1].trim();
      i += 1;
      continue;
    }

    if (isMarkdownSpecialLine(trimmed)) {
      break;
    }

    currentItem = currentItem ? `${currentItem} ${trimmed}` : trimmed;
    i += 1;
  }

  if (currentItem) {
    items.push(currentItem.trim());
  }

  return {
    items,
    nextIndex: i,
  };
}

function parseMarkdownSection(rawSection) {
  const lines = String(rawSection || '')
    .split('\n')
    .map((line) => line.replace(/\r/g, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) return null;

  let title = null;
  let titleLevel = 0;
  const initialHeading = parseMarkdownHeading(lines[0]);
  if (initialHeading) {
    title = initialHeading.text;
    titleLevel = initialHeading.level;
    lines.shift();
  }

  const blocks = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = parseMarkdownHeading(trimmed);
    if (heading) {
      blocks.push({ type: 'subheading', level: heading.level, text: heading.text });
      i += 1;
      continue;
    }

    const image = parseMarkdownImageLine(trimmed);
    if (image) {
      blocks.push({ type: 'image', ...image });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const { items, nextIndex } = parseMarkdownList(lines, i, false);
      blocks.push({ type: 'list', ordered: false, items });
      i = nextIndex;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const { items, nextIndex } = parseMarkdownList(lines, i, true);
      blocks.push({ type: 'list', ordered: true, items });
      i = nextIndex;
      continue;
    }

    const paragraphLines = [trimmed];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isMarkdownSpecialLine(lines[i])) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return {
    title,
    titleLevel,
    blocks,
  };
}

function parseMarkdownSections(raw) {
  return String(raw || '')
    .split(/\n---\n/g)
    .map((section) => parseMarkdownSection(section))
    .filter(Boolean);
}

function mergeStructuredSubsections(sections, slug) {
  if (slug !== 'dating-platform') {
    return sections;
  }

  const merged = [];

  for (const section of sections) {
    const parent = merged[merged.length - 1];
    const canMerge =
      section.titleLevel === 2 &&
      parent &&
      parent.titleLevel === 1 &&
      !String(parent.title || '').startsWith('Achievements of');

    if (canMerge) {
      parent.blocks.push({ type: 'subheading', level: section.titleLevel, text: section.title });
      parent.blocks.push(...section.blocks);
      continue;
    }

    merged.push({
      ...section,
      blocks: [...section.blocks],
    });
  }

  return merged;
}

/**
 * Paralelo a `mergeStructuredSubsections`, mantém o texto MDX bruto por secção lógica
 * (para outline / `splitMdxSections` alinhados ao DOM `section-N` do preview).
 * @param {ReturnType<parseMarkdownSection>[]} sections
 * @param {string[]} rawParts
 * @param {string} slug
 */
function mergeStructuredSubsectionsWithRaw(sections, rawParts, slug) {
  if (slug !== 'dating-platform') {
    return sections.map((s, i) => ({ section: s, raw: rawParts[i] ?? '' }));
  }

  const merged = [];
  const mergedRaw = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const raw = rawParts[i] ?? '';
    const parent = merged[merged.length - 1];
    const parentRaw = mergedRaw[mergedRaw.length - 1];
    const canMerge =
      section.titleLevel === 2 &&
      parent &&
      parent.titleLevel === 1 &&
      !String(parent.title || '').startsWith('Achievements of');

    if (canMerge) {
      parent.blocks.push({ type: 'subheading', level: section.titleLevel, text: section.title });
      parent.blocks.push(...section.blocks);
      mergedRaw[mergedRaw.length - 1] = `${parentRaw}\n---\n\n${raw}`;
      continue;
    }

    merged.push({
      ...section,
      blocks: [...section.blocks],
    });
    mergedRaw.push(raw);
  }

  return merged.map((section, i) => ({ section, raw: mergedRaw[i] }));
}

function rawChunkToMdxSectionSplit(section, rawChunk) {
  const lines = String(rawChunk || '').split('\n');
  const trimmedFirst = lines[0]?.trim() ?? '';
  if (/^#\s+/.test(trimmedFirst) && section.title) {
    return {
      title: section.title,
      body: lines.slice(1).join('\n').trim(),
    };
  }
  return {
    title: section.title,
    body: String(rawChunk || '').trim(),
  };
}

/**
 * Secções MDX alinhadas ao `renderStructuredWorkBody` (--- + merge dating): mesma ordem e contagem que `data-editor-section-index`.
 * Formato compatível com `MdxSectionSplit` do `@portfolio-os/editor`.
 * @param {string} mdx
 * @param {string} slug
 * @returns {{ title: string | null, body: string }[]}
 */
export function getStructuredWorkMdxSectionSplits(mdx, slug) {
  const raw = applyRewriteRelativeImagePaths(mdx, undefined);
  const rawParts = String(raw || '').split(/\n---\n/g);
  const parsed = rawParts.map(parseMarkdownSection).filter(Boolean);
  const pairs = mergeStructuredSubsectionsWithRaw(parsed, rawParts, String(slug || ''));
  return pairs.map(({ section, raw: chunk }) => rawChunkToMdxSectionSplit(section, chunk));
}

/**
 * @param {string} mdx
 * @param {string} slug
 * @returns {number}
 */
export function getStructuredWorkSectionCount(mdx, slug) {
  return getStructuredWorkMdxSectionSplits(mdx, slug).length;
}

function renderMetricTitle(title) {
  const raw = String(title || '').trim();
  const match = raw.match(/^Achievements of the improved (.+)$/);
  if (match) {
    return `Achievements of the improved <br /> ${escapeHtml(match[1])}`;
  }
  return escapeHtml(raw);
}

function parseMetricItem(item) {
  const raw = String(item || '').trim();
  let arrow = '';
  let value = '';
  let label = raw;

  let match = raw.match(/^\*\*([↑↓])\s*([\d.]+)%\*\*\s*(.+)$/);
  if (match) {
    arrow = match[1];
    value = match[2];
    label = match[3];
    return { arrow, value, percent: true, label };
  }

  match = raw.match(/^\*\*([\d.]+)%\*\*\s*(.+)$/);
  if (match) {
    value = match[1];
    label = match[2];
    return { arrow, value, percent: true, label };
  }

  match = raw.match(/^\*\*([↑↓])\s*([^*]+)\*\*\s*(.+)$/);
  if (match) {
    arrow = match[1];
    value = match[2].trim();
    label = match[3];
    return { arrow, value, percent: /%$/.test(value), label };
  }

  match = raw.match(/^\*\*([^*]+)\*\*\s*(.+)$/);
  if (match) {
    value = match[1].trim();
    label = match[2];
  }

  return {
    arrow,
    value,
    percent: /%$/.test(value),
    label,
  };
}

function renderMetricBlock(metric, { centered = false } = {}) {
  const value = String(metric.value || '').replace(/%$/, '').trim();
  const bodyClass = centered ? 'body-medium t-ct' : 'body-medium';
  const arrowHtml = metric.arrow
    ? `<span class="metric-number-arrow t-bold display-xl t-green-light">${metric.arrow}</span>`
    : '';
  const percentHtml = metric.percent
    ? '<span class="metric-number-percentage t-bold display-xl">%</span>'
    : '';

  return `
          <div class="metric">
            <span class="metric-number display-xxxl">
              ${arrowHtml}
              ${escapeHtml(value)}
              ${percentHtml}
            </span>
            <span class="${bodyClass}">${renderInlineMarkdown(metric.label)}</span>
          </div>`;
}

function renderZoomImage(image, { wrapper = 'wrapper', zoomClass = 'medium-zoom-medium', marginClass = 'mt-2xl' } = {}) {
  const className = [wrapper, zoomClass, marginClass].filter(Boolean).join(' ');
  return `
<figure class="${className}">
  <img class="medium-zoom-image" src="${image.src}" style="width: 100%; height: auto;" alt="${escapeHtml(image.alt)}" loading="lazy" />
</figure>`;
}

function renderZoomVideoFromPoster(image, { marginClass = 'mt-2xl' } = {}) {
  const mp4 = image.src.replace(/-poster\.webp$/i, '-compressed.mp4');
  return `
<figure class="medium-zoom-medium ${marginClass}">
  <video poster="${image.src}" style="width: 100%; height: auto; display: block;" autoplay loop muted playsinline>
    <source src="${mp4}" type="video/mp4">
  </video>
  <figcaption class="body-small" style="text-align: center; margin-top: 8px;">
    ${renderInlineMarkdown(image.alt)}
  </figcaption>
</figure>`;
}

function renderTwoColumnImages(images, { marginClass = 'mt-3xl' } = {}) {
  const figures = images
    .map(
      (image, index) => `
  <figure class="medium-zoom-small${index === 0 ? ' ' : ''}">
    <img class="medium-zoom-image" src="${image.src}" style="width: 100%; height: auto;" alt="${escapeHtml(image.alt)}" loading="lazy" />
  </figure>`
    )
    .join('\n');
  return `
<div class="wrapper two-column-image ${marginClass}">
${figures}
</div>`;
}

function renderBrandsGrid(section) {
  const images = section.blocks.filter((block) => block.type === 'image');
  const itemsHtml = images
    .map(
      (image) =>
        `        <img class="brands-list-image" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy">`
    )
    .join('\n');
  return `
<div class="brands-list mt-4xl">
  <h3>${escapeHtml(section.title || '')}</h3>
  <div class="brands-list-grid mt-xl">
${itemsHtml}
  </div>
</div>`;
}

function renderExecutiveSummarySection(section) {
  const groups = [];
  let current = null;

  for (const block of section.blocks) {
    if (block.type === 'subheading') {
      current = { title: block.text, blocks: [] };
      groups.push(current);
      continue;
    }
    if (current) {
      current.blocks.push(block);
    }
  }

  const groupsHtml = groups
    .map((group) => {
      const bodyHtml = group.blocks
        .map((block) => {
          if (block.type === 'paragraph') {
            return `<p class="body-medium mt-sm">${renderInlineMarkdown(block.text)}</p>`;
          }
          if (block.type === 'list') {
            const items = block.items
              .map((item, index) => `<li class="li body-large ${index === 0 ? 'mt-xs' : 'mt-xs'}">${renderInlineMarkdown(item)}</li>`)
              .join('\n');
            return `<ul class="ul mt-sm no-bullet">\n${items}\n</ul>`;
          }
          return '';
        })
        .join('\n');

      return `
        <div>
          <h3 class="body-small t-upper t-gray-300 t-semibold">${escapeHtml(group.title)}</h3>
          ${bodyHtml}
        </div>`;
    })
    .join('\n');

  return `
<div class="executive-summary">
  <h2 class="mt-5xl">${escapeHtml(section.title || 'Executive summary')}</h2>
  <div class="wrapper executive-summary-text mt-2xl mb-4xl">
${groupsHtml}
  </div>
</div>`;
}

function renderFeaturedMetricsSection(section, { centered = false, extraClass = 'featured-metrics', title = section.title } = {}) {
  const listBlock = section.blocks.find((block) => block.type === 'list');
  if (!listBlock) return '';
  const metricsHtml = listBlock.items
    .map((item) => renderMetricBlock(parseMetricItem(item), { centered }))
    .join('\n');
  const titleHtml = title ? `        <h3 class="display-xl">${renderMetricTitle(title)}</h3>\n` : '';

  return `
<div class="${extraClass} mt-3xl">
  <div class="wrapper">
${titleHtml}        <div class="metrics-list">
${metricsHtml}
        </div>
  </div>
</div>`;
}

function renderFootnotesSection(section) {
  const listBlock = section.blocks.find((block) => block.type === 'list' && block.ordered);
  if (!listBlock) return '';
  const items = listBlock.items
    .map((item, index) => `    <li class="body-small t-gray-300">${renderInlineMarkdown(item)}</li>`)
    .join('\n');
  return `
<div class="footnotes mt-4xl" role="contentinfo">
  <ol class="ol">
${items}
  </ol>
</div>`;
}

function renderWorkListBlock(block, ctx, sectionTitle) {
  const items = block.items || [];

  if (!block.ordered && ctx.slug === 'journal-finder' && (sectionTitle === 'The problem: A high cost of discovery' || sectionTitle === 'My approach') && items.length > 2) {
    const visible = items.slice(0, 2)
      .map((item) => `  <li class="p mt-md">${renderInlineMarkdown(item)}</li>`)
      .join('\n');
    const hidden = items.slice(2)
      .map((item) => `    <li class="p mt-md">${renderInlineMarkdown(item)}</li>`)
      .join('\n');

    return `<ul class="ul">\n${visible}\n</ul>
<details class="read-more mt-xl">
  <summary class="read-more-toggle body-large">Read more...</summary>
  <ul class="ul read-more-content">
${hidden}
  </ul>
</details>`;
  }

  if (block.ordered) {
    const itemsHtml = items
      .map((item, index) => `  <li class="${index === 0 ? 'p' : 'p mt-sm'}">${renderInlineMarkdown(item)}</li>`)
      .join('\n');
    return `<ol class="ol mt-md" type="1">\n${itemsHtml}\n</ol>`;
  }

  if (ctx.slug === 'dating-platform' && sectionTitle === "Defining business KPI's") {
    const itemsHtml = items
      .map((item, index) => `  <li class="${index === 0 ? 'p' : 'p mt-sm'}">${renderInlineMarkdown(item)}</li>`)
      .join('\n');
    return `<ul class="ul mt-md">\n${itemsHtml}\n</ul>`;
  }

  const listItemClass = ctx.slug === 'farfetch-performance' ? 'p mt-md' : 'p mt-md';
  const itemsHtml = items
    .map((item) => `  <li class="${listItemClass}">${renderInlineMarkdown(item)}</li>`)
    .join('\n');
  return `<ul class="ul">\n${itemsHtml}\n</ul>`;
}

function getSectionTitleHtml(title, ctx) {
  if (!title) return '';
  if (ctx.slug === 'journal-finder') {
    const match = title.match(/^(The context|The problem):\s*(.+)$/);
    if (match) {
      return `${escapeHtml(match[1])} <br /> ${escapeHtml(match[2])}`;
    }
  }
  return renderInlineMarkdown(title);
}

function getSectionTitleMeta(ctx, { title = '', sectionTitle = '', titleLevel = 1 } = {}) {
  if (ctx.slug === 'journal-finder') {
    return { tag: 'h2', className: 'mt-5xl t-ct t-gray-300' };
  }

  if (ctx.slug === 'dating-platform') {
    if (titleLevel >= 3) {
      return { tag: 'h4', className: 'mt-xl' };
    }

    if (titleLevel === 2) {
      if (/^Painpoint \d+:/i.test(title)) {
        return { tag: 'h3', className: 'mt-3xl' };
      }
      if (/metrics$/i.test(title)) {
        return { tag: 'h4', className: 'mt-xl' };
      }
      return { tag: 'h3', className: 'mt-xl' };
    }

    return {
      tag: 'h3',
      className: ctx.sectionIndex === 0 ? 'mt-5xl' : 'mt-3xl',
    };
  }

  if (ctx.slug === 'farfetch-performance') {
    if (titleLevel >= 2) {
      return {
        tag: 'h3',
        className: String(sectionTitle || '').startsWith('Case study') ? 'mt-2xl' : 'mt-xl',
      };
    }
    return { tag: 'h3', className: 'mt-3xl' };
  }

  return { tag: 'h3', className: 'mt-3xl' };
}

function getSubheadingMeta(block, ctx, { sectionTitle = '', subheadingIndex = 0 } = {}) {
  if (ctx.slug === 'dating-platform') {
    if (sectionTitle === "Defining business KPI's") {
      return { tag: 'h4', className: 'mt-xl' };
    }

    if (sectionTitle === 'Understanding the problem' && /^Painpoint \d+:/i.test(block.text)) {
      return { tag: 'h3', className: subheadingIndex === 0 ? 'mt-3xl' : 'mt-xl' };
    }

    return { tag: 'h3', className: subheadingIndex === 0 ? 'mt-3xl' : 'mt-xl' };
  }

  if (ctx.slug === 'farfetch-performance') {
    return {
      tag: block.level >= 3 ? 'h4' : 'h3',
      className: String(sectionTitle || '').startsWith('Case study') && subheadingIndex === 0 ? 'mt-2xl' : 'mt-3xl',
    };
  }

  return {
    tag: block.level >= 3 ? 'h4' : 'h3',
    className: 'mt-3xl',
  };
}

function renderTextCluster(blocks, ctx, { title = '', sectionTitle = '', titleLevel = 1, clusterIndex = 0 } = {}) {
  if (!blocks.length) return '';
  const wrapperClass =
    ctx.slug === 'journal-finder' && title === 'Impact'
      ? 'text-block mt-4xl'
      : 'text-block';
  const titleMeta = getSectionTitleMeta(ctx, { title, sectionTitle, titleLevel });

  let html = `\n<div class="${wrapperClass}">\n`;
  if (title) {
    html += `  <${titleMeta.tag} class="${titleMeta.className}">${getSectionTitleHtml(title, ctx)}</${titleMeta.tag}>\n`;
  }

  let subheadingIndex = 0;
  let paragraphIndex = 0;
  for (const block of blocks) {
    if (block.type === 'subheading') {
      const subheadingMeta = getSubheadingMeta(block, ctx, { sectionTitle, subheadingIndex });
      html += `  <${subheadingMeta.tag} class="${subheadingMeta.className}">${renderInlineMarkdown(block.text)}</${subheadingMeta.tag}>\n`;
      subheadingIndex += 1;
      paragraphIndex = 0;
      continue;
    }

    if (block.type === 'paragraph') {
      let paragraphClass = 'mt-md';
      if (ctx.slug === 'journal-finder') {
        paragraphClass = paragraphIndex === 0 ? 'p-high mt-3xl' : 'mt-xl';
      }
      html += `  <p class="${paragraphClass}">${renderInlineMarkdown(block.text)}</p>\n`;
      paragraphIndex += 1;
      continue;
    }

    if (block.type === 'list') {
      html += `${renderWorkListBlock(block, ctx, sectionTitle)}\n`;
    }
  }

  html += '</div>\n';
  return html;
}

function inferInstrumentImageCanonical(images, slug, sectionTitle, groupIndex) {
  if (slug === 'dating-platform' && images.length === 1 && /menu-hamburger-poster\.webp$/i.test(images[0].src)) {
    return 'VideoFigure';
  }
  if (images.length === 2) {
    return 'FigurePair';
  }
  if (slug === 'dating-platform' && images.length === 1 && /explore-page\.webp$|profile-page\.webp$/i.test(images[0].src)) {
    return 'FigureLarge';
  }
  if (images.length === 1) {
    return 'Figure';
  }
  return 'FigureGroup';
}

function renderImageGroup(images, ctx, sectionTitle, groupIndex) {
  if (!images.length) return '';

  if (ctx.slug === 'dating-platform' && images.length === 1 && /menu-hamburger-poster\.webp$/i.test(images[0].src)) {
    return `${renderZoomVideoFromPoster(images[0])}\n`;
  }

  if (images.length === 12 && sectionTitle === 'Brands I collaborated with at Farfetch') {
    return renderBrandsGrid({ title: sectionTitle, blocks: images.map((image) => ({ type: 'image', ...image })) });
  }

  if (ctx.slug === 'journal-finder' && sectionTitle === 'My approach' && images.length === 4) {
    const captionText = images[0].alt;
    return `${renderTwoColumnImages(images.slice(0, 2), { marginClass: 'mt-4xl' })}
${renderTwoColumnImages(images.slice(2), { marginClass: 'mt-sm' })}
<figcaption class="body-small wrapper mt-xs t-ct">${renderInlineMarkdown(captionText)}</figcaption>\n`;
  }

  if (ctx.slug === 'journal-finder' && sectionTitle === 'The solution' && images.length === 5) {
    return `${renderZoomImage(images[0], { wrapper: 'wrapper', zoomClass: 'medium-zoom-large', marginClass: 'mt-4xl' })}
${renderTwoColumnImages(images.slice(1, 3), { marginClass: 'mt-sm' })}
${renderTwoColumnImages(images.slice(3), { marginClass: 'mt-sm' })}\n`;
  }

  if (images.length === 2) {
    const marginClass = ctx.slug === 'journal-finder' && groupIndex > 0 ? 'mt-sm' : 'mt-3xl';
    return `${renderTwoColumnImages(images, { marginClass })}\n`;
  }

  if (images.length === 1) {
    const image = images[0];
    let zoomClass = 'medium-zoom-medium';
    let marginClass = 'mt-2xl';
    let wrapper = 'wrapper';

    if (ctx.slug === 'journal-finder' && sectionTitle === 'The context: a fragmented legacy') {
      marginClass = 'mt-4xl';
    }
    if (ctx.slug === 'dating-platform' && /explore-page\.webp$|profile-page\.webp$/i.test(image.src)) {
      zoomClass = 'medium-zoom-large';
      marginClass = 'mt-3xl';
    }

    const figure = renderZoomImage(image, { wrapper, zoomClass, marginClass });
    const captionHtml = image.alt
      ? `<figcaption class="body-small${ctx.slug === 'journal-finder' ? '  mt-xs t-ct' : ' mt-xs t-ct'}">${renderInlineMarkdown(image.alt)}</figcaption>\n`
      : '';
    return `${figure}
${captionHtml}`;
  }

  return images
    .map((image) => renderZoomImage(image, { wrapper: 'wrapper', zoomClass: 'medium-zoom-medium', marginClass: groupIndex === 0 ? 'mt-2xl' : 'mt-sm' }))
    .join('\n');
}

/**
 * Wrapper de bloco editorial para preview (outline `sec{n}-blk{m}-Component`).
 * @param {string} html
 * @param {number} sectionIndex
 * @param {number} blockSeq
 * @param {string} componentName
 * @returns {string}
 */
function wrapEditorInstrumentedBlock(html, sectionIndex, blockSeq, componentName) {
  const safe = String(componentName || 'Block').replace(/[^A-Za-z0-9_-]/g, '');
  const nodeId = `sec${sectionIndex}-blk${blockSeq}-${safe}`;
  return `<div data-editor-kind="block" data-editor-node-id="${nodeId}" data-editor-section-index="${sectionIndex}" data-editor-block="${safe}">${html}</div>`;
}

/**
 * Fragmentos HTML na mesma ordem do render — usado pelo outline do editor e por `renderStructuredWorkSection`.
 * @param {ReturnType<parseMarkdownSection>} section
 * @param {{ slug: string, sectionIndex?: number }} ctx
 * @returns {{ componentName: string, html: string }[]}
 */
function buildStructuredSectionFragments(section, ctx) {
  if (!section?.blocks?.length && !section?.title) return [];

  if (section.title === 'Executive summary') {
    const html = renderExecutiveSummarySection(section);
    return html ? [{ componentName: 'ExecutiveSummary', html }] : [];
  }

  if (ctx.slug === 'journal-finder' && section.title === 'Metrics') {
    const html = renderFeaturedMetricsSection(section, {
      centered: true,
      extraClass: 'featured-metrics-2',
      title: '',
    });
    return html ? [{ componentName: 'FeaturedMetrics', html }] : [];
  }

  if (ctx.slug === 'journal-finder' && section.title === 'Footnotes') {
    const html = renderFootnotesSection(section);
    return html ? [{ componentName: 'Footnotes', html }] : [];
  }

  if (String(section.title || '').startsWith('Achievements of')) {
    const html = renderFeaturedMetricsSection(section);
    return html ? [{ componentName: 'ImpactResults', html }] : [];
  }

  const imagesOnly = section.blocks.length > 0 && section.blocks.every((block) => block.type === 'image');
  if (imagesOnly && section.title === 'Brands I collaborated with at Farfetch') {
    const html = renderBrandsGrid(section);
    return html ? [{ componentName: 'BrandsGrid', html }] : [];
  }

  const fragments = [];
  let titleConsumed = false;
  let textBlocks = [];
  let imageGroup = [];
  let imageGroupIndex = 0;

  const flushTextBlocks = () => {
    if (!textBlocks.length) return;
    const html = renderTextCluster(textBlocks, ctx, {
      title: titleConsumed ? '' : section.title,
      sectionTitle: section.title,
      titleLevel: section.titleLevel || 1,
      clusterIndex: titleConsumed ? 1 : 0,
    });
    const textName = ctx.slug === 'dating-platform' ? 'TextBlock' : 'TextCluster';
    if (html) fragments.push({ componentName: textName, html });
    textBlocks = [];
    titleConsumed = true;
  };

  const flushImageGroup = () => {
    if (!imageGroup.length) return;
    const html = renderImageGroup(imageGroup, ctx, section.title, imageGroupIndex);
    const imageName =
      ctx.slug === 'dating-platform'
        ? inferInstrumentImageCanonical(imageGroup, ctx.slug, section.title, imageGroupIndex)
        : 'ImageGroup';
    if (html) fragments.push({ componentName: imageName, html });
    imageGroup = [];
    imageGroupIndex += 1;
  };

  for (const block of section.blocks) {
    if (block.type === 'image') {
      flushTextBlocks();
      imageGroup.push(block);
      continue;
    }
    flushImageGroup();
    textBlocks.push(block);
  }

  flushTextBlocks();
  flushImageGroup();
  return fragments;
}

/**
 * @param {string[]} lines
 * @param {number} lineIdx
 */
function lineCharStartInJoinedBody(lines, lineIdx) {
  let o = 0;
  for (let k = 0; k < lineIdx && k < lines.length; k += 1) {
    o += lines[k].length + 1;
  }
  return o;
}

/**
 * Mesma ordem e contagem que `section.blocks` após parse do corpo (sem título).
 * @param {string[]} lines
 * @returns {{ startLine: number, endLineExclusive: number }[]}
 */
function parseBodyLinesIntoBlockLineSpans(lines) {
  const spans = [];
  for (let i = 0; i < lines.length; ) {
    const trimmed = String(lines[i] || '').trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    const startLine = i;

    if (parseMarkdownHeading(trimmed)) {
      spans.push({ startLine, endLineExclusive: i + 1 });
      i += 1;
      continue;
    }

    if (parseMarkdownImageLine(trimmed)) {
      spans.push({ startLine, endLineExclusive: i + 1 });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const { nextIndex } = parseMarkdownList(lines, i, false);
      spans.push({ startLine, endLineExclusive: nextIndex });
      i = nextIndex;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const { nextIndex } = parseMarkdownList(lines, i, true);
      spans.push({ startLine, endLineExclusive: nextIndex });
      i = nextIndex;
      continue;
    }

    let j = i + 1;
    while (j < lines.length && lines[j].trim() && !isMarkdownSpecialLine(lines[j])) {
      j += 1;
    }
    spans.push({ startLine, endLineExclusive: j });
    i = j;
  }
  return spans;
}

/**
 * @param {string[]} lines
 * @param {number} bodyLen
 * @param {{ startLine: number, endLineExclusive: number }[]} spanArr
 */
function mergeLineSpansToCharRange(lines, bodyLen, spanArr) {
  if (!spanArr.length) return { start: 0, end: 0 };
  const first = spanArr[0].startLine;
  const last = spanArr[spanArr.length - 1].endLineExclusive;
  const start = lineCharStartInJoinedBody(lines, first);
  const end = last >= lines.length ? bodyLen : lineCharStartInJoinedBody(lines, last);
  return { start, end };
}

/**
 * Intervalos `[start,end)` em `bodyText` (corpo da secção de `getStructuredWorkMdxSectionSplits`),
 * na mesma ordem e critérios de emissão que `buildStructuredSectionFragments` / preview `sec{n}-blk{m}-*`.
 * @param {ReturnType<parseMarkdownSection>} section
 * @param {{ slug: string, sectionIndex?: number }} ctx
 * @param {string} bodyText
 * @returns {{ start: number, end: number }[]}
 */
function buildStructuredSectionFragmentBodyRanges(section, ctx, bodyText) {
  const body = String(bodyText ?? '');
  const fragments = buildStructuredSectionFragments(section, ctx);
  if (!fragments.length) return [];

  const slug = String(ctx.slug || '');

  const singleInstrumentedAggregation =
    fragments.length === 1 &&
    (section.title === 'Executive summary' ||
      (slug === 'journal-finder' && section.title === 'Metrics') ||
      (slug === 'journal-finder' && section.title === 'Footnotes') ||
      String(section.title || '').startsWith('Achievements of') ||
      (section.blocks?.length > 0 &&
        section.blocks.every((b) => b.type === 'image') &&
        section.title === 'Brands I collaborated with at Farfetch'));

  if (singleInstrumentedAggregation) {
    return [{ start: 0, end: body.length }];
  }

  const lines = body.split('\n');
  const blockSpans = parseBodyLinesIntoBlockLineSpans(lines);
  const blocks = section.blocks || [];
  if (blockSpans.length !== blocks.length) {
    const step = fragments.length ? body.length / fragments.length : 0;
    const out = [];
    for (let fi = 0; fi < fragments.length; fi += 1) {
      out.push({
        start: Math.floor(fi * step),
        end: Math.min(body.length, Math.floor((fi + 1) * step)),
      });
    }
    return out;
  }

  const ranges = [];
  let titleConsumed = false;
  let textBlocks = [];
  let imageGroup = [];
  let textSpans = [];
  let imageSpans = [];
  let imageGroupIndex = 0;

  const flushText = () => {
    if (!textBlocks.length) return;
    const html = renderTextCluster(textBlocks, ctx, {
      title: titleConsumed ? '' : section.title,
      sectionTitle: section.title,
      titleLevel: section.titleLevel || 1,
      clusterIndex: titleConsumed ? 1 : 0,
    });
    if (html) {
      ranges.push(mergeLineSpansToCharRange(lines, body.length, textSpans));
    }
    textBlocks = [];
    textSpans = [];
    titleConsumed = true;
  };

  const flushImg = () => {
    if (!imageGroup.length) return;
    const html = renderImageGroup(imageGroup, ctx, section.title, imageGroupIndex);
    if (html) {
      ranges.push(mergeLineSpansToCharRange(lines, body.length, imageSpans));
    }
    imageGroup = [];
    imageSpans = [];
    imageGroupIndex += 1;
  };

  for (let bi = 0; bi < blocks.length; bi += 1) {
    const block = blocks[bi];
    const span = blockSpans[bi];
    if (block.type === 'image') {
      flushText();
      imageGroup.push(block);
      imageSpans.push(span);
    } else {
      flushImg();
      textBlocks.push(block);
      textSpans.push(span);
    }
  }
  flushText();
  flushImg();

  if (ranges.length !== fragments.length) {
    const step = fragments.length ? body.length / fragments.length : 0;
    const out = [];
    for (let fi = 0; fi < fragments.length; fi += 1) {
      out.push({
        start: Math.floor(fi * step),
        end: Math.min(body.length, Math.floor((fi + 1) * step)),
      });
    }
    return out;
  }

  return ranges;
}

/**
 * Mapa `sectionIndex` → intervalos no corpo MDX da secção (alinhado a `sec{n}-blk{m}-*` do preview).
 * @param {string} mdx
 * @param {string} slug
 * @returns {Map<number, { start: number, end: number }[]>}
 */
export function getStructuredWorkBlockBodyRangesMap(mdx, slug) {
  const raw = applyRewriteRelativeImagePaths(mdx, undefined);
  const splits = getStructuredWorkMdxSectionSplits(mdx, slug);
  const sections = mergeStructuredSubsections(parseMarkdownSections(raw), String(slug || ''));
  const map = new Map();
  sections.forEach((section, sectionIndex) => {
    const body = splits[sectionIndex]?.body ?? '';
    const ranges = buildStructuredSectionFragmentBodyRanges(
      section,
      {
        slug: String(slug || ''),
        sectionIndex,
      },
      body
    );
    map.set(sectionIndex, ranges);
  });
  return map;
}

function labelStructuredInstrumentBlock(componentName) {
  switch (componentName) {
    case 'TextCluster':
    case 'TextBlock':
      return 'Text';
    case 'ImageGroup':
      return 'Image';
    case 'Figure':
      return 'Image';
    case 'FigurePair':
      return 'Image pair';
    case 'FigureLarge':
      return 'Image (large)';
    case 'VideoFigure':
      return 'Video';
    case 'FigureGroup':
      return 'Images';
    case 'ExecutiveSummary':
      return 'Executive summary';
    case 'FeaturedMetrics':
      return 'Metrics';
    case 'Footnotes':
      return 'Footnotes';
    case 'BrandsGrid':
      return 'Brands';
    case 'ImpactResults':
      return 'Metrics';
    default:
      return componentName;
  }
}

/**
 * Itens de outline `kind: 'block'` alinhados ao DOM instrumentado do preview (B9/B10).
 * @param {string} mdx
 * @param {string} slug
 * @returns {Array<{ kind: 'block', nodeId: string, sectionIndex: number, blockName: string, label: string }>}
 */
export function getStructuredWorkEditorBlockOutlineItems(mdx, slug) {
  const raw = applyRewriteRelativeImagePaths(mdx, undefined);
  const sections = mergeStructuredSubsections(parseMarkdownSections(raw), String(slug || ''));
  const items = [];
  sections.forEach((section, sectionIndex) => {
    const fragments = buildStructuredSectionFragments(section, {
      slug: String(slug || ''),
      sectionIndex,
    });
    fragments.forEach((f, blockSeq) => {
      items.push({
        kind: 'block',
        nodeId: `sec${sectionIndex}-blk${blockSeq}-${f.componentName}`,
        sectionIndex,
        blockName: f.componentName,
        label: labelStructuredInstrumentBlock(f.componentName),
      });
    });
  });
  return items;
}

function renderStructuredWorkSection(section, ctx) {
  const fragments = buildStructuredSectionFragments(section, ctx);
  if (!fragments.length) return '';
  if (!ctx.editorInstrumentation) {
    return fragments.map((f) => f.html).join('');
  }
  const sectionIndex = ctx.sectionIndex ?? 0;
  return fragments
    .map((f, i) => wrapEditorInstrumentedBlock(f.html, sectionIndex, i, f.componentName))
    .join('');
}

function renderStructuredWorkBody(metadata, mdx, renderOpts = {}) {
  const raw = applyRewriteRelativeImagePaths(mdx, renderOpts.rewriteMarkdownImageBase);
  const slug = String(metadata?.slug || '');
  const sections = mergeStructuredSubsections(parseMarkdownSections(raw), slug);
  const instrument = renderOpts.editorInstrumentation === true;
  return sections
    .map((section, sectionIndex) => {
      const inner = renderStructuredWorkSection(section, {
        slug,
        sectionIndex,
        editorInstrumentation: instrument,
      });
      if (!inner) return '';
      if (!instrument) return inner;
      return `<div data-editor-kind="section" data-editor-node-id="section-${sectionIndex}" data-editor-section-index="${sectionIndex}">${inner}</div>`;
    })
    .join('');
}

/**
 * Blocos opcionais só no preview do editor (alinhamento com shell da sidebar).
 * @param {Record<string, unknown>} metadata
 * @returns {string}
 */
function renderEditorPreviewShellBlocks(metadata) {
  const summary = String(metadata?.summary || '').trim();
  let year = '';
  if (metadata?.publishedAt) {
    const d = new Date(String(metadata.publishedAt));
    if (!Number.isNaN(d.getTime())) {
      year = String(d.getFullYear());
    }
  }
  const items = [
    { label: 'Company', value: metadata?.company },
    { label: 'Role', value: metadata?.role },
    { label: 'Year', value: year || undefined },
    { label: 'Platform', value: metadata?.platforms },
    { label: 'Focus', value: metadata?.domain },
  ].filter((item) => String(item.value || '').trim());

  let html = '';
  if (items.length) {
    const cells = items
      .map(
        (item) => `
    <div>
      <h3 class="body-small t-upper t-gray-300 t-semibold">${escapeHtml(item.label)}</h3>
      <p class="body-medium mt-sm">${escapeHtml(String(item.value))}</p>
    </div>`
      )
      .join('\n');
    html += `
<div class="wrapper mt-3xl" data-editor-kind="shell" data-editor-node-id="shell-meta">
  <div class="executive-summary-text mt-2xl mb-4xl">
${cells}
  </div>
</div>`;
  }

  if (summary) {
    html += `
<div class="wrapper mt-3xl" data-editor-kind="shell" data-editor-node-id="shell-summary">
  <h2 class="mt-5xl">Overview</h2>
  <div class="executive-summary-text mt-2xl mb-4xl">
    <p class="body-medium mt-sm">${escapeHtml(summary)}</p>
  </div>
</div>`;
  }

  return html;
}

/**
 * Markdown do corpo editorial com as mesmas classes/CSS do site publicado
 * (antes só existia em scripts/content/build-content.js).
 * @param {string} mdx
 * @param {{ rewriteMarkdownImageBase?: string }} [renderOpts]
 * @returns {string}
 */
export function renderSiteMarkdownBody(mdx, renderOpts = {}) {
  const raw = applyRewriteRelativeImagePaths(mdx, renderOpts.rewriteMarkdownImageBase);
  const lines = raw.split('\n');
  let html = '';
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    if (line.startsWith('# ') || line.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }

      const level = line.startsWith('# ') ? 'mt-5xl' : 'mt-3xl';
      const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      html += `<h2 class="${level}">${title}</h2>\n`;
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }

      const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      html += `<h3 class="mt-2xl">${title}</h3>\n`;
      continue;
    }

    if (line.startsWith('**') && line.endsWith('**')) {
      const metric = line.replace(/\*\*/g, '');
      if (metric.includes('↑')) {
        const [, value] = metric.split('↑');
        html += `<span class="metric-number display-xxxl"><span class="metric-number-arrow t-bold display-xl t-green-light">↑</span>${value}<span class="metric-number-percentage t-bold display-xl"></span></span>\n`;
      } else if (metric.includes('↓')) {
        const [, value] = metric.split('↓');
        html += `<span class="metric-number display-xxxl"><span class="metric-number-arrow t-bold display-xl t-green-light">↓</span>${value}<span class="metric-number-percentage t-bold display-xl"></span></span>\n`;
      }
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        if (inOrderedList) { html += '</ol>\n'; inOrderedList = false; }
        html += '<ul class="ul">\n';
        inList = true;
      }
      const item = line.replace(/^[-*]\s+/, '');
      html += `<li class="li mt-sm">${renderInlineMarkdown(item)}</li>\n`;
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inOrderedList) {
        if (inList) { html += '</ul>\n'; inList = false; }
        html += '<ol class="ol mt-md" type="1">\n';
        inOrderedList = true;
      }
      const item = line.trim().replace(/^\d+\.\s+/, '');
      html += `<li class="p">${renderInlineMarkdown(item)}</li>\n`;
      continue;
    }

    if (line.startsWith('![')) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        const [, alt, src] = match;
        html += '<figure class="wrapper medium-zoom-medium mt-2xl">\n';
        html += `  <img class="medium-zoom-image" src="${src}" style="width: 100%; height: auto;" alt="${escapeHtml(alt)}" loading="lazy" />\n`;
        html += '</figure>\n';
        if (nextLine && !nextLine.startsWith('![') && !nextLine.startsWith('#') && !nextLine.startsWith('-') && nextLine.trim()) {
          html += `<figcaption class="body-small mt-xs t-ct">${renderInlineMarkdown(nextLine)}</figcaption>\n`;
          i++;
        }
      }
      continue;
    }

    if (line.trim() === '') {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inOrderedList) { html += '</ol>\n'; inOrderedList = false; }
      continue;
    }

    let p = renderInlineMarkdown(line);
    html += `<p class="mt-md">${p}</p>\n`;
  }

  if (inList) html += '</ul>\n';
  if (inOrderedList) html += '</ol>\n';

  return html;
}

/**
 * @param {string} content
 * @returns {Array<{ title: string, description: string[], link: { text: string, url: string } | null }>}
 */
export function parseFeaturedProjects(content) {
  const lines = content.split('\n');
  const projects = [];
  let currentProject = null;
  let inFeaturedProjects = false;

  for (const line of lines) {
    if (line.startsWith('# Featured Projects')) {
      inFeaturedProjects = true;
      continue;
    }

    if (inFeaturedProjects) {
      if (line.startsWith('## ')) {
        if (currentProject) {
          projects.push(currentProject);
        }
        currentProject = {
          title: line.substring(3).trim(),
          description: [],
          link: null,
        };
      } else if (currentProject) {
        if (line.startsWith('[') && line.includes('](')) {
          const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            currentProject.link = {
              text: match[1],
              url: match[2],
            };
          }
        } else if (line.trim() !== '' && !line.startsWith('---')) {
          currentProject.description.push(line.trim());
        }
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

export function renderProjectCard(project, cardClass, index) {
  const resolvedRoute = project.link ? resolveSiteRouteFromPath(project.link.url) : null;
  const linkLabel = project.link?.text || 'View case study';
  const linkUrl = resolvedRoute?.publicPath || project.link?.url || '';
  const buttonContent = `          ${linkLabel}
          <div class="svg-button">
            <svg viewBox="0 0 24.96 14.4" width="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5512 1.092C17.4649 1.18378 17.3963 1.29296 17.3496 1.41326C17.3028 1.53356 17.2787 1.6626 17.2787 1.79292C17.2787 1.92324 17.3028 2.05228 17.3496 2.17258C17.3963 2.29288 17.4649 2.40206 17.5512 2.49384L21.7897 7.03499H0.921394C0.677025 7.03499 0.442665 7.139 0.26987 7.32414C0.0970752 7.50928 0 7.76038 0 8.0222C0 8.28403 0.0970752 8.53513 0.26987 8.72026C0.677025 8.9054 0.677025 9.00941 0.921394 9.00941H21.7712L17.5512 13.521C17.3796 13.7059 17.2833 13.9561 17.2833 14.2169C17.2833 14.4777 17.3796 14.7279 17.5512 14.9129C17.7239 15.0968 17.9574 15.2 18.2008 15.2C18.4442 15.2 18.6778 15.0968 18.8504 14.9129L24.7105 8.63427C24.7893 8.55319 24.8521 8.45586 24.895 8.34814C24.9378 8.24041 24.9599 8.12451 24.9599 8.00739C24.9599 7.89028 24.9378 7.77438 24.895 7.66665C24.8521 7.55892 24.7893 7.4616 24.7105 7.38052L18.8596 1.092C18.774 0.999473 18.6721 0.92603 18.5598 0.875911C18.4475 0.825792 18.3271 0.799988 18.2054 0.799988C18.0838 0.799988 17.9634 0.825792 17.8511 0.875911C17.7388 0.92603 17.6369 0.999473 17.5512 1.092Z" />
            </svg>
          </div>`;
  let html = `    <article class="project-card ${cardClass}">\n`;
  html += '      <div class="project-card-content">\n';
  html += `        <h2 class="t-white display-lg">${project.title}</h2>\n`;

  if (project.link) {
    if (resolvedRoute?.isProtected && resolvedRoute.authId) {
      html += `        <button class="btn body-medium btn-white btn-show-password" data-content-id="${resolvedRoute.authId}" aria-haspopup="dialog">\n`;
      html += `${buttonContent}\n`;
      html += '        </button>\n';
    } else {
      html += `        <a class="btn body-medium btn-white" href="${linkUrl}">\n`;
      html += `${buttonContent}\n`;
      html += '        </a>\n';
    }
  }

  html += '      </div>\n';
  html += '    </article>\n';

  return html;
}

/**
 * Home: hero + featured projects (igual ao HTML gerado pelo build).
 */
export function renderSiteHomePage(data, content) {
  const lines = content.split('\n');
  let html = '';
  html += '<header class="home-header wrapper">\n';
  html += '  <div class="home-logo-container">\n';
  html += '    <a class="home-logo-link btn btn-green body-small" href="/" aria-label="Renan Crociari logo">renancrociari</a>\n';
  html += '  </div>\n';
  html += '  <div class="home-hero">\n';
  html += '    <div class="hero-content">\n';

  const heroContent = [];
  let inHero = true;

  for (const line of lines) {
    if (line.trim() === '---') {
      break;
    }
    if (line.startsWith('# Featured Projects')) {
      break;
    }
    if (inHero) {
      heroContent.push(line);
    }
  }

  while (heroContent.length > 0 && heroContent[0].trim() === '') {
    heroContent.shift();
  }

  let heroTitle = '';
  const heroBody = [];

  for (let i = 0; i < heroContent.length; i++) {
    const line = heroContent[i];
    if (line.startsWith('# ') && !heroTitle) {
      heroTitle = line.substring(2).trim();
    } else {
      heroBody.push(line);
    }
  }

  if (!heroTitle && heroContent.length > 0) {
    heroTitle = heroContent[0];
    heroBody.length = 0;
    heroContent.slice(1).forEach((l) => heroBody.push(l));
  }

  const heroBodyHtml = heroBody
    .map(l => (l.trim() === '' ? '<br>' : l))
    .join(' ')
    .replace(/<br>\s*<br>/g, '<br>')
    .trim();

  html += `      <h1 class="hero">${heroTitle}</h1>\n`;
  if (heroBodyHtml) {
    html += `      <span class="body-medium mt-xl">${heroBodyHtml}</span>\n`;
  }

  html += '    </div>\n';
  html += '  </div>\n';
  html += '</header>\n';

  html += '<section class="featured-projects wrapper">\n';

  const projects = parseFeaturedProjects(content);
  const cardClasses = ['card-4', 'card-1', 'card-2', 'card-3'];

  projects.forEach((project, index) => {
    const cardClass = cardClasses[index] || 'card-1';
    html += renderProjectCard(project, cardClass, index);
  });

  html += '</section>\n';

  return html;
}

/**
 * About: hero + artigo (igual ao build).
 */
export function renderSiteAboutPage(metadata, mdx, renderOpts = {}) {
  let html = '<header class="content-header mt-5xl">\n';
  html += '  <div class="wrapper">\n';
  html += '    <div class="content-hero">\n';
  html += `      <h1 class="t-gray-200">${metadata.description}</h1>\n`;
  if (metadata.featured_image) {
    html += '      <figure class="featured-image mt-2xl">\n';
    html += `        <img src="${metadata.featured_image}" class="featured-image-img" alt="Picture of Renan Crociari" fetchpriority="high" />\n`;
    html += '      </figure>\n';
  }
  html += '    </div>\n';
  html += '  </div>\n';
  html += '</header>\n';

  html += '<div class="article-content">\n';
  html += renderSiteMarkdownBody(mdx, renderOpts);
  html += '</div>\n';

  return html;
}

/**
 * Case study: hero + corpo (igual ao build).
 */
export function renderSiteWorkPage(metadata, mdx, renderOpts = {}) {
  let html = '';
  const workSlug = String(metadata.slug || '');
  const isStructuredWork = new Set([
    'farfetch-performance',
    'dating-platform',
    'journal-finder',
  ]).has(workSlug);
  const heroTitleClass = workSlug === 'journal-finder' ? 't-gray-200' : 't-white';
  const instrument = renderOpts.editorInstrumentation === true;
  const previewShell = renderOpts.editorPreviewShell === true;

  const headerShellAttrs = instrument
    ? ' data-editor-kind="shell" data-editor-node-id="shell-hero"'
    : '';
  html += `<header class="content-header mt-5xl"${headerShellAttrs}>\n`;
  html += '  <div class="wrapper">\n';
  html += '    <div class="content-hero">\n';
  html += `      <h1 class="${heroTitleClass}">${metadata.title}</h1>\n`;

  if (metadata.tags && metadata.tags.length) {
    const tagsShellAttrs = instrument
      ? ' data-editor-kind="shell" data-editor-node-id="shell-tags"'
      : '';
    html += `      <div class="tags body-small t-gray-300 mt-sm"${tagsShellAttrs}>\n`;
    html += `      ${metadata.tags.join(' <span class="divider">/</span> ')}\n`;
    html += '      </div>\n';
  }

  if (metadata.featured_image) {
    html += '      <figure class="featured-image mt-2xl">\n';
    html += `        <img src="${metadata.featured_image}" class="featured-image-img" alt="${metadata.title}" fetchpriority="high" />\n`;
    html += '      </figure>\n';
  }
  html += '    </div>\n';
  html += '  </div>\n';
  html += '</header>\n';

  html += '<div class="article-content">\n';
  if (previewShell && isStructuredWork) {
    html += renderEditorPreviewShellBlocks(metadata);
  }
  html += isStructuredWork
    ? renderStructuredWorkBody(metadata, mdx, renderOpts)
    : renderSiteMarkdownBody(mdx, renderOpts);
  html += '</div>\n';

  return html;
}

/**
 * Página editorial simples (slug em pages que não é home/about).
 * @param {Record<string, unknown>} metadata
 * @param {string} markdownBody
 * @param {{ rewriteMarkdownImageBase?: string }} [renderOpts]
 * @returns {string}
 */
export function renderSiteGenericPage(metadata, markdownBody, renderOpts = {}) {
  const title = escapeHtml(String(metadata.title || ''));
  return `<header class="content-header mt-5xl">
  <div class="wrapper">
    <div class="content-hero">
      <h1 class="t-gray-200">${title}</h1>
    </div>
  </div>
</header>
<div class="article-content">
${renderSiteMarkdownBody(markdownBody, renderOpts)}
</div>`;
}

/**
 * HTML principal do preview do editor (entre navbar e footer), alinhado ao build.
 * @param {{ collection: string, slug: string, metadata: Record<string, unknown>, markdownBody: string, rewriteMarkdownImageBase?: string, editorPreview?: boolean }} input
 * @returns {string}
 */
export function renderEditorPreviewMainHtml({
  collection,
  slug,
  metadata,
  markdownBody,
  rewriteMarkdownImageBase,
  editorPreview,
}) {
  const ro = {
    ...(rewriteMarkdownImageBase ? { rewriteMarkdownImageBase } : {}),
    ...(editorPreview
      ? { editorInstrumentation: true, editorPreviewShell: true }
      : {}),
  };
  if (collection === 'pages' && slug === 'home') {
    return renderSiteHomePage(metadata, markdownBody);
  }
  if (collection === 'pages' && slug === 'about') {
    return renderSiteAboutPage(metadata, markdownBody, ro);
  }
  if (collection === 'pages') {
    return renderSiteGenericPage(metadata, markdownBody, ro);
  }
  return renderSiteWorkPage(metadata, markdownBody, ro);
}

/**
 * Renderiza um documento completo
 * @param {Object} document
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderDocument(document, options = {}) {
  const { metadata, content, blocks } = document;

  // Se temos blocos pré-parseados, usa eles
  if (blocks && Array.isArray(blocks)) {
    return renderBlocks(blocks, options);
  }

  // Markdown editorial: mesmo HTML que o build publica
  if (content) {
    try {
      const html = renderSiteMarkdownBody(content, {
        rewriteMarkdownImageBase: options.rewriteMarkdownImageBase,
      });
      return `<div class="document-content">${html}</div>`;
    } catch (e) {
      console.warn('Failed to render markdown:', e);
    }
  }

  // Fallback para conteúdo texto
  return `<div class="document-content">${content || ''}</div>`;
}

/**
 * Renderiza a página de case study completa
 * @param {Object} caseStudy
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderCaseStudy(caseStudy, options = {}) {
  const { metadata, blocks } = caseStudy;
  
  const heroBlock = {
    type: 'hero',
    props: {
      title: metadata.title,
      subtitle: metadata.summary,
      image: metadata.coverImage,
    }
  };
  
  const allBlocks = [heroBlock, ...(blocks || [])];
  
  return renderBlocks(allBlocks, options);
}

/**
 * Renderiza a página about (mesmo markup que o build).
 * @param {Object} page — { metadata, content } ou campos no topo
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderAboutPage(page, options = {}) {
  const metadata = page.metadata || page;
  const content = page.content ?? '';
  return renderSiteAboutPage(metadata, content, {
    rewriteMarkdownImageBase: options.rewriteMarkdownImageBase,
  });
}
