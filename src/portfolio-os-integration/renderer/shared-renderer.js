/**
 * Shared Renderer
 * 
 * Renderer compartilhado entre o site público e o preview do editor.
 * Converte conteúdo MDX/canônico em HTML usando os mesmos componentes e CSS.
 * 
 * Compatibilidade com Portfolio-OS Blocks:
 * @see BLOCK_CATALOG.md para catálogo completo
 */

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [isPreview] - Se é preview do editor
 * @property {string} [baseUrl] - URL base para resolução de links
 * @property {'comment'|'warning'|'error'|'degraded'} [fallbackMode='comment'] - Modo de fallback
 */

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
  
  // Caso contrário, renderiza o content como texto
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
 * Renderiza a página about
 * @param {Object} page
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderAboutPage(page, options = {}) {
  const { metadata, content } = page;
  
  return `
    <header class="content-header mt-5xl">
      <div class="wrapper">
        <div class="content-hero">
          <h1 class="t-gray-200">${escapeHtml(metadata.title || 'About')}</h1>
        </div>
      </div>
    </header>
    <div class="article-content">
      <div class="text-block">
        ${content || ''}
      </div>
    </div>
  `;
}
