import {
  portfolioBlockDescriptors,
  getBlockDescriptor as getBlockDescriptorFromPkg,
  getBlockDescriptorsForSurface,
} from '@portfolio-os/blocks';
import type {
  BlockSurface,
  PortfolioBlockDescriptor,
} from '@/app/components/mdx/registry.types';

export function getAllRuntimeBlocks(): PortfolioBlockDescriptor[] {
  return portfolioBlockDescriptors.slice();
}

export function getAuthorableBlocks(surface: BlockSurface) {
  return getBlockDescriptorsForSurface(surface).filter((d) => d.authorable);
}

export function getBlockDefinition(name: string) {
  return getBlockDescriptorFromPkg(name);
}
