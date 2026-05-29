# Agent Instructions

You're working on an **English Learning App** — a browser-based app built with **React 19 + Vite + TypeScript + Tailwind CSS v4**, wrapped in **Uno Platform** for cross-platform desktop/mobile distribution.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 (functional components, hooks) |
| Build Tool | Vite 8 |
| Language | TypeScript 6 (strict mode) |
| Styling | Tailwind CSS v4 (utility-first, via `@tailwindcss/vite`) |
| Routing | React Router DOM v7 (HashRouter) |
| AI Providers | Google Gemini, OpenAI, DeepSeek (user-configurable) |
| Storage | localStorage only (no backend) |
| Mobile wrapper | Uno Platform (C#/.NET) — embeds the web build |
| Icons | Lucide React |
| Charts | Recharts |
| Text diff | `diff` library |

---

## Project Structure

```
web/                          # Main web app (React + Vite)
  src/
    components/               # Shared UI components and context providers
      Layout.tsx              # App shell with sidebar
      Sidebar.tsx             # Navigation sidebar
      DiffViewer.tsx          # Text diff visualization
      ThemeContext.tsx        # Dark/light theme provider
      SettingsContext.tsx     # Global settings provider (AI keys, preferences)
      ToastContext.tsx        # Toast notification provider
      classNames.ts           # Utility for class merging
    features/
      speaking/               # Speaking practice feature
        components/           # SpeakingResultView, TranscriptCompare, etc.
        types/                # speaking.types.ts
        utils/                # transcriptDiff.ts
    screens/                  # Route-level page components
      Dashboard.tsx
      SpeakingList.tsx / SpeakingRecording.tsx / SpeakingResult.tsx
      MockDialogue.tsx
      WritingList.tsx / WritingEditor.tsx / WritingResult.tsx
      HistoryView.tsx
      SettingsView.tsx
    services/
      ai.ts                   # Multi-provider AI calls (Gemini/OpenAI/DeepSeek)
      storage.ts              # localStorage read/write helpers
      speechRecognition.ts    # Web Speech API wrapper
      localData.ts            # Static/seed data helpers
    assets/
      topics.json             # Practice topic data
  index.html
  index.css                   # Global styles + Tailwind base imports
uno/                          # Uno Platform cross-platform wrapper
  AppUno/
    WebContent/               # ← web build output (do not edit manually)
```

---

## Key Architectural Decisions

**AI is multi-provider.** `web/src/services/ai.ts` wraps Gemini, OpenAI, and DeepSeek under a unified `callAI()` function. The active provider and model are stored in `AppSettings` (localStorage). When editing AI logic, always handle all three providers.

**No backend.** All data lives in localStorage. `web/src/services/storage.ts` owns the read/write helpers for `Practice` and `HistoryItem`. There is no API, no auth, no server.

**API keys are user-provided at runtime** (stored in localStorage via Settings). Never add API keys to `.env` files or commit them. The AI SDKs run in-browser with `dangerouslyAllowBrowser: true` — this is intentional.

**Uno Platform wraps the web build.** Running `npm run build:uno` in `web/` outputs to `uno/AppUno/WebContent/`. The Uno C# code embeds this as a WebView. Don't edit files in `WebContent/` directly.

**Routing uses HashRouter** because the app is served as a static file inside the Uno WebView. Never switch to BrowserRouter.

---

## Coding Standards

**TypeScript**: Use strict types everywhere. No `any`. Use `interface` for object shapes, `type` for unions/aliases.

**Components**: Functional components with hooks only. Keep screen components (in `screens/`) as smart/connected. Keep feature components (in `features/`) reusable and props-driven.

**Styling**: Tailwind utility classes only. Use `clsx`/`tailwind-merge` (via `classNames.ts`) for conditional classes. No inline styles, no custom CSS unless Tailwind cannot do it.

**State**: Use React Context (already set up for Theme, Settings, Toast). Prefer local state for UI-only state.

**Services**: Pure functions in `services/`. No React imports in service files.

**Naming**: `kebab-case` for files and folders. PascalCase for components. camelCase for functions and variables.

---

## Common Tasks

**Add a new screen**: Create in `web/src/screens/`, add a `<Route>` in `App.tsx`.

**Add a new feature module**: Create folder in `web/src/features/<name>/` with `components/`, `types/`, `utils/` subdirectories.

**Add AI functionality**: Add a new export to `web/src/services/ai.ts` using the `callAI()` helper. Handle all three providers.

**Build for Uno**: Run `npm run build:uno` from `web/` directory.

**Dev server**: Run `npm run dev` from `web/` directory. Opens at `http://localhost:5173`.

---

## Model Assignment Rules

- Architecture decisions and reviews: Use Opus
- Implementation tasks (new features, refactors): Use Sonnet
- Simple edits, formatting, renaming: Use Haiku
- Security-sensitive changes: Always escalate to Opus for review
