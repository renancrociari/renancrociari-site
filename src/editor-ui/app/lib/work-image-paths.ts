import { rewriteRelativeImagePaths as rewriteWithCore } from '@portfolio-os/core/content-utils';

export function rewriteRelativeImagePaths(content: string, dirName: string) {
  if (!dirName) return content;
  return rewriteWithCore(content, `/work/${dirName}/`);
}
