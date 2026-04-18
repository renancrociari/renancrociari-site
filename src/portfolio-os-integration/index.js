/**
 * Portfolio-OS Integration for renancrociari-site
 * 
 * Entry point da integração. Exporta todos os módulos necessários
 * para consumo pelo site e pelo editor.
 */

// Config
export { siteConfig, getReservedSlugs, isReservedSlug, getSiteConfig } from './config/site-config.js';
export {
  MANAGED_ROUTE_MANIFEST,
  SITE_BASE_URL,
  resolveSiteRoute,
  resolveSiteRouteFromPath,
  listManagedLegacySourcePages,
} from './config/routing-manifest.mjs';

// Content Schema
export { 
  PageSchema, 
  WorkSchema, 
  PageTemplates, 
  SupportedBlocks,
  validateMetadata,
  applyDefaults,
  generateSlug,
} from './content-schema.js';

// Blocos portfolio-os (catálogo authorable)
export {
  getAuthorableBlocksForWorkBody,
  getBlockCatalogEntriesForEditor,
} from './blocks/authorable-blocks-catalog.js';

// Adapters
export { 
  createFilesystemAdapter, 
  createLocalAdapterBundle,
  pagesAdapter, 
  workAdapter,
} from './adapters/filesystem-adapter.js';

// Renderer
export {
  renderBlocks,
  renderDocument,
  renderCaseStudy,
  renderAboutPage,
  renderSiteMarkdownBody,
  renderSiteHomePage,
  renderSiteAboutPage,
  renderSiteWorkPage,
  renderSiteGenericPage,
  renderEditorPreviewMainHtml,
  parseFeaturedProjects,
} from './renderer/shared-renderer.mjs';
