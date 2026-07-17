import { useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useToast } from './useToast';

/**
 * Registers the PWA service worker and surfaces its lifecycle through the app
 * toast system. Renders nothing. Must live inside <ToastProvider>.
 *
 * With `registerType: 'prompt'`, a freshly deployed build waits until the user
 * confirms before taking over — we show a persistent "update available" toast
 * with a Reload action instead of refreshing silently.
 *
 * No-op in dev and in non-secure contexts (e.g. the Uno file:// WebView), where
 * the service worker never registers.
 */
export function PwaReloadPrompt() {
  const { addToast } = useToast();
  const registered = useRef(false);
  const updateSW = useRef<(reloadPage?: boolean) => Promise<void>>(undefined);

  useEffect(() => {
    // Guard against StrictMode double-invocation registering twice.
    if (registered.current) return;
    registered.current = true;

    updateSW.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        addToast('Đã có bản cập nhật mới của Ovvie', 'info', {
          duration: null,
          action: {
            label: 'Tải lại',
            onClick: () => updateSW.current?.(true),
          },
        });
      },
      onOfflineReady() {
        addToast('Ứng dụng đã sẵn sàng dùng offline', 'success');
      },
    });
  }, [addToast]);

  return null;
}
