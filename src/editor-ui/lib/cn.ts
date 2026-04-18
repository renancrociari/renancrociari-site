import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isSvgImageSrc(src: string) {
  const pathOnly = src.split('?')[0]?.split('#')[0] ?? '';
  return pathOnly.toLowerCase().endsWith('.svg');
}
