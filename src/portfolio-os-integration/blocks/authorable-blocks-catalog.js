/**
 * Catálogo de blocos authorable do @portfolio-os/blocks para o surface work-body.
 * O site renderiza MDX/markdown via shared-renderer; isto alinha a UI do editor ao contrato portfolio-os.
 */

import { portfolioBlockDescriptors } from '@portfolio-os/blocks';

const SITE_SURFACE = 'work-body';

/**
 * @returns {import('@portfolio-os/blocks').PortfolioBlockDescriptor[]}
 */
export function getAuthorableBlocksForWorkBody() {
  return portfolioBlockDescriptors.filter(
    (d) => d.authorable && d.surfaces.includes(SITE_SURFACE)
  );
}

/**
 * Lista compacta para UI: nome canónico, categoria, snippet.
 * @returns {Array<{ componentName: string, category: string, description: string, snippet: string }>}
 */
export function getBlockCatalogEntriesForEditor() {
  return getAuthorableBlocksForWorkBody().map((d) => ({
    componentName: d.componentName,
    category: d.category,
    description: d.description,
    snippet: d.snippet || '',
  }));
}
