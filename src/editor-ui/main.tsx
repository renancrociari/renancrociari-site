import React from 'react';
import { createRoot } from 'react-dom/client';
import EditorPage from './app/editor/main/editor-page';
import { resolveDevApiRoot } from '../portfolio-os-integration/lib/dev-api-root.js';
import './styles/global.css';

function App() {
  return (
    <div className="pointer-editor-shell flex h-full min-h-0 w-full gap-[16px] p-[10px]">
      <EditorPage />
    </div>
  );
}

async function bootstrap() {
  const rootElement = document.getElementById('editor-root');
  if (!rootElement) {
    throw new Error('editor-root not found');
  }

  if (typeof window !== 'undefined') {
    const root = await resolveDevApiRoot();
    (window as typeof window & { __RC_DEV_API_ROOT__?: string }).__RC_DEV_API_ROOT__ = root;
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap().catch((error) => {
  console.error(error);
});
