'use client';

import React, { useEffect } from 'react';
import { startErrorReporting } from '@/app/lib/errors/startReporting';
import { ErrorDialogHost } from './ErrorDialog';
import { ToastHost } from './Toast';

/**
 * Mounts the two overlays the error system can raise from anywhere: the toast and the decision dialog. Mounted once in
 * the root layout. Banners and full-page errors are placed by the page that owns them, because they belong to a page's
 * layout, not above it. `PlatformAlert` stays for now and is replaced screen by screen as pages migrate.
 *
 * It also starts error reporting (a no-op until a Sentry DSN is configured).
 */
export default function ErrorHost() {
  useEffect(() => {
    startErrorReporting();
  }, []);
  return (
    <>
      <ToastHost />
      <ErrorDialogHost />
    </>
  );
}
