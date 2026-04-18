import EditorPage from '../../../src/editor-ui/app/editor/main/editor-page';
import { EditorRuntimeBootstrap } from './runtime-bootstrap';

export const dynamic = 'force-dynamic';

export default function EditorRoute() {
  return (
    <>
      <EditorRuntimeBootstrap />
      <div className="pointer-editor-shell flex h-screen min-h-screen w-full gap-[16px] p-[10px]">
        <EditorPage />
      </div>
    </>
  );
}
