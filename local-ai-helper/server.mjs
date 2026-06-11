// Local AI Helper — companion service for the EngCoach web app.
// Detects AI CLI tools installed on this computer and reports their status
// at GET /ai-tools, matching the contract in the AI Runtime spec.
//
// Run with:  node local-ai-helper/server.mjs
// No dependencies — Node 18+ only.

import { createServer } from 'node:http';
import { execFile, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PORT = Number(process.env.LOCAL_AI_HELPER_PORT) || 8765;
const VERSION_TIMEOUT_MS = 10_000;
const RUN_TIMEOUT_MS = 180_000;

// How each tool is invoked non-interactively. FLAGS ONLY — the prompt is written
// to the tool's stdin so multi-word/JSON content never needs shell escaping
// (critical for .cmd shims). `--skip-trust` lets Gemini run headless in any
// directory. Keep in sync with RUN_ARGS in web/src/services/local-ai-helper.ts.
const RUN_ARGS = {
  'codex-cli': ['exec'],
  'gemini-cli': ['--skip-trust'],
  'claude-code': ['-p'],
};

const HOME = homedir();

// Per-tool detection config.
// `command` is resolved via PATH; `fallbackPaths` cover known install
// locations for tools that do not register themselves on PATH.
// `credentialFiles` are heuristics for "signed in" — if none are listed the
// tool is treated as not requiring authentication.
const TOOLS = [
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    command: 'codex',
    fallbackPaths: [],
    credentialFiles: [join(HOME, '.codex', 'auth.json')],
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    command: 'gemini',
    fallbackPaths: [],
    credentialFiles: [join(HOME, '.gemini', 'oauth_creds.json')],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    fallbackPaths: () => [
      join(HOME, '.local', 'bin', 'claude.exe'),
      join(HOME, '.local', 'bin', 'claude'),
      // VS Code extension bundles the binary under a versioned folder.
      ...findVsCodeClaudeBinaries(),
    ],
    credentialFiles: [
      join(HOME, '.claude', '.credentials.json'),
      join(HOME, '.claude.json'),
    ],
  },
];

function findVsCodeClaudeBinaries() {
  const extensionsDir = join(HOME, '.vscode', 'extensions');
  try {
    return readdirSync(extensionsDir)
      .filter((name) => name.startsWith('anthropic.claude-code-'))
      .sort()
      .reverse() // newest version first
      .map((name) => join(extensionsDir, name, 'resources', 'native-binary', 'claude.exe'));
  } catch {
    return [];
  }
}

function run(file, args) {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      { timeout: VERSION_TIMEOUT_MS, windowsHide: true, shell: false },
      (error, stdout) => resolve(error ? null : String(stdout).trim()),
    );
  });
}

/** Resolve a command via PATH (where/which), then fall back to known paths. */
async function resolveBinary(tool) {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const found = await run(locator, [tool.command]);
  if (found) {
    const lines = found.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    // On Windows `where` lists the extensionless shell shim first (not spawnable
    // by execFile); prefer a real executable extension when present.
    if (process.platform === 'win32') {
      return lines.find((l) => /\.(exe|cmd|bat)$/i.test(l)) ?? lines[0];
    }
    return lines[0];
  }
  const fallbacks = typeof tool.fallbackPaths === 'function' ? tool.fallbackPaths() : tool.fallbackPaths;
  return fallbacks.find((p) => existsSync(p)) ?? null;
}

async function detectTool(tool) {
  const base = {
    id: tool.id,
    name: tool.name,
    enabled: true,
    selectableAsRuntime: true,
  };

  const binary = await resolveBinary(tool);
  if (!binary) {
    return { ...base, installed: false, authenticated: false, status: 'not_installed' };
  }

  // .cmd shims need a shell on Windows; execFile with shell:false can't run them.
  const isCmdShim = /\.(cmd|bat)$/i.test(binary);
  const versionOut = isCmdShim
    ? await new Promise((resolve) => {
        execFile(binary, ['--version'], { timeout: VERSION_TIMEOUT_MS, windowsHide: true, shell: true }, (error, stdout) =>
          resolve(error ? null : String(stdout).trim()),
        );
      })
    : await run(binary, ['--version']);

  const versionMatch = versionOut?.match(/\d+(\.\d+)+/);
  const version = versionMatch ? versionMatch[0] : undefined;

  const requiresAuth = tool.credentialFiles.length > 0;
  const authenticated = !requiresAuth || tool.credentialFiles.some((p) => existsSync(p));

  return {
    ...base,
    installed: true,
    authenticated,
    status: authenticated ? 'ready' : 'login_required',
    ...(version ? { version } : {}),
  };
}

/** Run an installed tool, feeding the prompt over stdin; resolve trimmed stdout. */
async function runTool(toolId, prompt) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool || !RUN_ARGS[toolId]) {
    throw new Error(`Unsupported installed AI tool: ${toolId}`);
  }
  const binary = await resolveBinary(tool);
  if (!binary) {
    throw new Error(`${tool.name} could not be located on this computer.`);
  }

  const args = RUN_ARGS[toolId];
  // .cmd/.bat shims only run through the shell on Windows. Args are flags only,
  // so shell quoting is not a concern here.
  const isCmdShim = /\.(cmd|bat)$/i.test(binary);

  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, shell: isCmdShim });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${tool.name} timed out.`));
    }, RUN_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `${tool.name} exited with code ${code}.`));
    });

    child.stdin.on('error', () => { /* ignore EPIPE if the tool closed stdin early */ });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16 * 1024 * 1024) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  // The web app runs on another origin (vite dev server / Uno WebView).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/ai-tools') {
    try {
      const tools = await Promise.all(TOOLS.map(detectTool));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tools }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(error) }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/run') {
    try {
      const { toolId, prompt } = await readJsonBody(req);
      if (typeof toolId !== 'string' || typeof prompt !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Expected { toolId: string, prompt: string }.' }));
        return;
      }
      const output = await runTool(toolId, prompt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ output }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Available: GET /ai-tools, POST /run' }));
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    // Another instance (e.g. started manually) already serves this port.
    console.log(`Local AI Helper already running on port ${PORT} — skipping.`);
    process.exit(0);
  }
  throw error;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local AI Helper listening on http://127.0.0.1:${PORT}/ai-tools`);
});
