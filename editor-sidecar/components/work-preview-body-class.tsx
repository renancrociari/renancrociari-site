'use client';

import { useEffect } from 'react';

/** Aplica `body.<bodyClass>` do site para que as regras CSS dos cases (ex. `body.farfetch`) funcionem no iframe. */
export function WorkPreviewBodyClass({
  bodyClass,
  children,
}: {
  bodyClass: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!bodyClass) return;
    document.body.classList.add(bodyClass);
    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [bodyClass]);

  return <>{children}</>;
}
