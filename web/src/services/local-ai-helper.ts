// Installed AI tool detection (Codex CLI, Gemini CLI, Claude Code).
// All detection policy lives here in the frontend:
//
// 1. Inside the Uno desktop app, primitives (fileExists/dirList/which/version)
//    are answered by the C# host over the WebView2 bridge — no extra process.
// 2. In a plain browser the sandbox cannot touch the machine, so detection
//    falls back to the Local AI Helper's GET /ai-tools endpoint.

import { bridgeCall, bridgeRun, isNativeBridgeAvailable } from './native-bridge';

// Antigravity is intentionally excluded: per the AI Runtime spec it is an
// external IDE, not a runtime the app invokes directly, so it is never a
// selectable Installed AI runtime.
export type InstalledAiToolId = 'codex-cli' | 'gemini-cli' | 'claude-code';

export type InstalledAiToolStatus =
  | 'not_installed'
  | 'checking'
  | 'installed'
  | 'login_required'
  | 'ready'
  | 'error'
  | 'disabled';

export type InstalledAiAvailability =
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'helper_unavailable'
  | 'error';

export interface InstalledAiTool {
  id: InstalledAiToolId;
  name: string;
  installed: boolean;
  authenticated: boolean;
  enabled: boolean;
  selectableAsRuntime: boolean;
  status: InstalledAiToolStatus;
  version?: string;
  errorMessage?: string;
}

interface AiToolsResponse {
  tools: InstalledAiTool[];
}

export const SUPPORTED_TOOL_IDS: InstalledAiToolId[] = ['codex-cli', 'gemini-cli', 'claude-code'];

const HELPER_URL_STORAGE_KEY = 'localAiHelperUrl';
const DEFAULT_HELPER_URL = 'http://127.0.0.1:8765';
const HELPER_TIMEOUT_MS = 5000;
// Running a prompt through a local CLI can take much longer than detection.
const HELPER_RUN_TIMEOUT_MS = 180_000;

// How each tool is invoked non-interactively. These are FLAGS ONLY — the prompt
// itself is written to the tool's stdin, so multi-word/JSON content never needs
// shell escaping (critical for .cmd shims). `--skip-trust` lets Gemini run
// headless in any working directory. Keep in sync with the helper's RUN_ARGS in
// local-ai-helper/server.mjs.
const RUN_ARGS: Record<InstalledAiToolId, string[]> = {
  'codex-cli': ['exec'],
  'gemini-cli': ['--skip-trust'],
  'claude-code': ['-p'],
};

export function getLocalAiHelperUrl(): string {
  return localStorage.getItem(HELPER_URL_STORAGE_KEY) || DEFAULT_HELPER_URL;
}

/** Thrown when no detection transport is reachable. */
export class HelperUnavailableError extends Error {
  constructor(message = 'The local AI service is not running.') {
    super(message);
    this.name = 'HelperUnavailableError';
  }
}

// ── Detection policy ────────────────────────────────────────────────────────
// `command` is resolved via PATH; `fallbackPaths` cover tools that do not
// register on PATH (env vars are expanded by the native host). Tools with no
// `credentialFiles` are treated as not requiring sign-in.

interface ToolDefinition {
  id: InstalledAiToolId;
  name: string;
  command: string;
  fallbackPaths: string[];
  /** Extra dynamically-discovered locations (e.g. versioned folders). */
  dynamicFallbacks?: () => Promise<string[]>;
  credentialFiles: string[];
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    command: 'codex',
    fallbackPaths: [],
    credentialFiles: ['%USERPROFILE%\\.codex\\auth.json'],
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    command: 'gemini',
    fallbackPaths: [],
    credentialFiles: ['%USERPROFILE%\\.gemini\\oauth_creds.json'],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    fallbackPaths: ['%USERPROFILE%\\.local\\bin\\claude.exe'],
    // The VS Code extension bundles the binary under a versioned folder.
    dynamicFallbacks: async () => {
      const names = await bridgeCall<string[]>('dirList', '%USERPROFILE%\\.vscode\\extensions').catch(() => []);
      return names
        .filter((name) => name.startsWith('anthropic.claude-code-'))
        .sort()
        .reverse()
        .map((name) => `%USERPROFILE%\\.vscode\\extensions\\${name}\\resources\\native-binary\\claude.exe`);
    },
    credentialFiles: ['%USERPROFILE%\\.claude\\.credentials.json', '%USERPROFILE%\\.claude.json'],
  },
];

async function resolveBinary(def: ToolDefinition): Promise<string | null> {
  const onPath = await bridgeCall<string | null>('which', def.command).catch(() => null);
  if (onPath) return onPath;

  const candidates = [...def.fallbackPaths, ...(def.dynamicFallbacks ? await def.dynamicFallbacks() : [])];
  for (const path of candidates) {
    if (await bridgeCall<boolean>('fileExists', path).catch(() => false)) return path;
  }
  return null;
}

async function detectTool(def: ToolDefinition): Promise<InstalledAiTool> {
  const base = { id: def.id, name: def.name, enabled: true, selectableAsRuntime: true };

  const binary = await resolveBinary(def);
  if (!binary) {
    return { ...base, installed: false, authenticated: false, status: 'not_installed' };
  }

  const versionOutput = await bridgeCall<string | null>('version', binary).catch(() => null);
  const version = versionOutput?.match(/\d+(\.\d+)+/)?.[0];

  let authenticated = true;
  if (def.credentialFiles.length > 0) {
    const checks = await Promise.all(
      def.credentialFiles.map((path) => bridgeCall<boolean>('fileExists', path).catch(() => false)),
    );
    authenticated = checks.some(Boolean);
  }

  return {
    ...base,
    installed: true,
    authenticated,
    status: authenticated ? 'ready' : 'login_required',
    ...(version ? { version } : {}),
  };
}

// ── Transports ──────────────────────────────────────────────────────────────

async function fetchViaHttpHelper(): Promise<InstalledAiTool[]> {
  let response: Response;
  try {
    response = await fetch(`${getLocalAiHelperUrl()}/ai-tools`, {
      signal: AbortSignal.timeout(HELPER_TIMEOUT_MS),
    });
  } catch {
    throw new HelperUnavailableError();
  }
  if (!response.ok) {
    throw new HelperUnavailableError(`Local AI Helper responded with ${response.status}.`);
  }

  const data = (await response.json()) as AiToolsResponse;
  const tools = Array.isArray(data.tools) ? data.tools : [];
  return tools.filter((tool) => SUPPORTED_TOOL_IDS.includes(tool.id));
}

/**
 * Detect installed AI tools on this computer.
 * Throws HelperUnavailableError when no transport can answer.
 */
export async function fetchInstalledAiTools(): Promise<InstalledAiTool[]> {
  if (isNativeBridgeAvailable()) {
    try {
      return await Promise.all(TOOL_DEFINITIONS.map(detectTool));
    } catch {
      throw new HelperUnavailableError('The native bridge did not respond.');
    }
  }
  return fetchViaHttpHelper();
}

/** A tool can be selected as runtime only when ready, enabled and selectable. */
export function isToolReady(tool: InstalledAiTool): boolean {
  return tool.status === 'ready' && tool.enabled && tool.selectableAsRuntime;
}

export function getReadyTools(tools: InstalledAiTool[]): InstalledAiTool[] {
  return tools.filter(isToolReady);
}

// ── Execution ─────────────────────────────────────────────────────────────
// Drive an installed CLI tool with a single prompt and return its stdout.
// Same two transports as detection: the native bridge inside the Uno app,
// the HTTP helper in a plain browser.

interface RunResponse {
  output?: string;
  error?: string;
}

function isSupportedToolId(toolId: string): toolId is InstalledAiToolId {
  return (SUPPORTED_TOOL_IDS as string[]).includes(toolId);
}

async function runViaHttpHelper(toolId: InstalledAiToolId, prompt: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${getLocalAiHelperUrl()}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, prompt }),
      signal: AbortSignal.timeout(HELPER_RUN_TIMEOUT_MS),
    });
  } catch {
    throw new HelperUnavailableError();
  }
  const data = (await response.json().catch(() => ({}))) as RunResponse;
  if (!response.ok) {
    throw new Error(data.error || `Local AI Helper responded with ${response.status}.`);
  }
  return data.output ?? '';
}

/**
 * Run `prompt` through the given installed tool and return its raw text output.
 * Throws if the tool id is unsupported, no transport is reachable, or the CLI
 * itself fails.
 */
export async function runInstalledAiPrompt(toolId: string, prompt: string): Promise<string> {
  if (!isSupportedToolId(toolId)) {
    throw new Error(`Unsupported installed AI tool: ${toolId}`);
  }

  if (isNativeBridgeAvailable()) {
    const def = TOOL_DEFINITIONS.find((d) => d.id === toolId);
    if (!def) throw new Error(`Unsupported installed AI tool: ${toolId}`);
    const binary = await resolveBinary(def);
    if (!binary) throw new HelperUnavailableError(`${def.name} could not be located on this computer.`);
    return bridgeRun({ file: binary, args: RUN_ARGS[toolId], stdin: prompt });
  }

  return runViaHttpHelper(toolId, prompt);
}
