import { useEffect, useState } from 'react';
import { detectBrowserCapabilities } from '../services/browserCapabilityService';
import { describeProcessingMode } from '../models/browserCapabilities';
import type { BrowserCapabilities } from '../models/browserCapabilities';

interface UseBrowserCapabilities {
  capabilities: BrowserCapabilities | null;
  loading: boolean;
  mode: ReturnType<typeof describeProcessingMode> | null;
}

/** Detects browser capabilities once (e.g. when opening Add Video). */
export function useBrowserCapabilities(): UseBrowserCapabilities {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    detectBrowserCapabilities()
      .then((caps) => {
        if (!cancelled) setCapabilities(caps);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    capabilities,
    loading,
    mode: capabilities ? describeProcessingMode(capabilities) : null,
  };
}
