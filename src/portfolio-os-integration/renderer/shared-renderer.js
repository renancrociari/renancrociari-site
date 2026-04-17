/**
 * Shared Renderer
 * 
 * Renderer compartilhado entre o site público e o preview do editor.
 * Converte conteúdo MDX/canônico em HTML usando os mesmos componentes e CSS.
 */

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [isPreview] - Se é preview do editor
 * @property {string} [baseUrl] - URL base para resolução de links
 */

/**
 * Renderiza blocos de conteúdo editorial
 * @param {Array<{type: string, props: Record<string, any>}>} blocks
 * @param {RenderOptions} options
 * @returns {string}
 */
export function renderBlocks(blocks, options = {}) {
  if (!Array.isArray(blocks)) return '';
  
  return blocks.map(block => renderBlock(block, options)).join('\n');
}

/**
 * Renderiza um único bloco
 * @param {{type: string, props: Record<string, any>}} block
 * @param {RenderOptions} options
 * @returns {string}
 */
function renderBlock(block, options) {
  const { type, props = {} } = block;
  
  switch (type) {
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
    default:
      // Fallback para blocos desconhecidos
      console.warn(`Unknown block type: ${type}`);
      return `<!-- Block: ${type} -->`;
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

function renderGallery({ images }, options) {
  if (!Array.isArray(images)) return '';
  
  const imagesHtml = images.map(img => `
    <div class="gallery-item">
      <img src="${resolvePath(img.src, options)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" />
    </div>
  `).join('');
  
  return `
    <div class="content-gallery">
      ${imagesHtml}
    </div>
  `;
}

function renderVideo({ src, title, provider }) {
  if (provider === 'youtube') {
    return `
      <div class="content-video">
        <iframe 
          src="https://www.youtube.com/embed/${src}" 
          title="${escapeHtml(title || 'Video')}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    `;
  }
  
  return `
    <div class="content-video">
      <video controls>
        <source src="${src}" type="video/mp4">
      </video>
    </div>
  `;
}

function renderQuote({ text, author, source }) {
  const citeHtml = author ? `<cite>${escapeHtml(author)}${source ? `, ${escapeHtml(source)}` : ''}</cite>` : '';
  return `
    <blockquote class="content-quote">
      <p>${escapeHtml(text)}</p>
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

function renderResults({ title, items }) {
  if (!Array.isArray(items)) return '';
  
  const itemsHtml = items.map(item => `
    <div class="result-item">
      <span class="result-number">${escapeHtml(item.value)}</span>
      <span class="result-label">${escapeHtml(item.label)}</span>
    </div>
  `).join('');
  
  return `
    <div class="results-block">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <div class="results-grid">
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
