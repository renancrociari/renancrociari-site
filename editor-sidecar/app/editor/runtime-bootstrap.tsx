'use client';

import { useEffect } from 'react';
import { PORTFOLIO_OS_API_ROOT_STORAGE_KEY } from '../../../src/portfolio-os-integration/lib/dev-api-root.js';

export function EditorRuntimeBootstrap() {
  useEffect(() => {
    const origin = window.location.origin;
    (window as typeof window & { __RC_DEV_API_ROOT__?: string }).__RC_DEV_API_ROOT__ = origin;
    window.sessionStorage.setItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY, origin);
  }, []);

  return null;
}
