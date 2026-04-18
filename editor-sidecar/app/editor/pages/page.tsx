import EditorPage from '../../../../src/editor-ui/app/editor/main/editor-page';
import { createEditorAdapterBundle } from '../../../../src/editor-ui/app/lib/editor-adapters';
import { EditorRuntimeBootstrap } from '../runtime-bootstrap';

export const dynamic = 'force-dynamic';

const pagesBundle = createEditorAdapterBundle('development', 'pages');

export default function EditorPagesRoute() {
  return (
    <>
      <EditorRuntimeBootstrap />
      <div className="pointer-editor-shell flex h-screen min-h-screen w-full gap-[16px] p-[10px]">
        <EditorPage adapterBundle={pagesBundle} />
      </div>
    </>
  );
}
