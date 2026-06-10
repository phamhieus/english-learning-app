// WebView2 native bridge — available when the app runs inside the Uno
// desktop wrapper. Lets frontend code ask the C# host for facts a browser
// sandbox cannot reach (file existence, PATH lookups, CLI versions).
// All policy/logic stays in TypeScript; the host only answers primitives.

interface WebView2Bridge {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

declare global {
  interface Window {
    chrome?: { webview?: WebView2Bridge };
  }
}

interface BridgeResponse {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
}

const BRIDGE_TIMEOUT_MS = 15_000;

let requestSeq = 0;
let listenerAttached = false;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();

export function isNativeBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.chrome?.webview;
}

function ensureListener(bridge: WebView2Bridge) {
  if (listenerAttached) return;
  listenerAttached = true;
  bridge.addEventListener('message', (event) => {
    const data = (typeof event.data === 'string' ? JSON.parse(event.data) : event.data) as BridgeResponse;
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    if (data.ok) entry.resolve(data.result);
    else entry.reject(new Error(data.error || 'Native bridge call failed'));
  });
}

/** One request/response round-trip to the C# host. */
export function bridgeCall<T>(op: 'fileExists' | 'dirList' | 'which' | 'version', arg: string): Promise<T> {
  const bridge = window.chrome?.webview;
  if (!bridge) return Promise.reject(new Error('Native bridge is not available'));
  ensureListener(bridge);

  const id = ++requestSeq;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Native bridge call timed out: ${op}`));
    }, BRIDGE_TIMEOUT_MS);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value as T);
      },
      reject: (reason) => {
        clearTimeout(timer);
        reject(reason);
      },
    });
    bridge.postMessage({ id, op, arg });
  });
}
