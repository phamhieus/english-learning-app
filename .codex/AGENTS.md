# AGENTS.md
## Working Style
- The user primarily works with C#, ASP.NET, WPF, Angular, and ReactJS.
- Prefer practical, readable, maintainable code over clever abstractions.
- Follow existing project patterns before introducing new architecture, packages, or conventions.
- Keep explanations concise. Do not explain basic programming concepts unless explicitly requested.
- When asked to implement something, make the code change first, then explain only the non-obvious parts.
- If requirements are ambiguous and a reasonable assumption is risky, ask a short clarification question before editing.

## Accuracy Rules

- Do not fabricate APIs, framework behavior, compatibility claims, or package capabilities.
- If unsure, say so and verify from local project files or official/current sources when needed.
- Before recommending new NuGet/npm libraries or tools, verify that they are maintained and compatible with this project.
- Do not recommend deprecated APIs or approaches without clearly marking them as deprecated and explaining the safer alternative.

## Debugging Rules

- Start from evidence: exact error messages, failing commands, relevant code, and reproduction steps.
- Do not guess root causes when the repo or logs can be inspected.
- Prefer focused fixes with focused verification over broad rewrites.

## Project Overview

This workspace contains an English learning app with two main parts:

- `web/`: React + TypeScript + Vite frontend.
- `uno/`: Uno Platform shell app. The Uno project serves the built web app from `uno/AppUno/WebContent`.

There is also a root-level `AppUno/` directory with no app source in the current checkout. Treat `.vs/`, `bin/`, `obj/`, `dist/`, and other generated output as disposable unless the user explicitly asks about them.

## Common Commands

Run frontend commands from `web/`:

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run build:uno
```

Run Uno commands from `uno/`:

```powershell
dotnet build
```

`npm run build:uno` compiles the web app and writes the output to `uno/AppUno/WebContent`.

## Code Map

- `web/src/App.tsx`: main app routing/composition entry.
- `web/src/screens/`: page-level views.
- `web/src/components/`: shared React components and contexts.
- `web/src/services/`: app services such as AI, storage, and local data.
- `web/src/features/speaking/`: speaking practice feature modules, hooks, services, utils, and types.
- `uno/AppUno/MainPage.xaml`: Uno host page.
- `uno/AppUno/AppUno.csproj`: Uno project file; includes `WebContent/**/*` as copied content.

## Working Guidelines

- Prefer existing React component, hook, service, and feature folder patterns before adding new structure.
- Keep web changes under `web/src/` unless build configuration, public assets, or generated Uno output is specifically needed.
- Do not hand-edit files in `uno/AppUno/WebContent` for normal frontend changes. Update `web/` and run `npm run build:uno` when the Uno shell needs refreshed assets.
- Avoid committing local IDE state, especially `.vs/` files.
- Use `rg`/`rg --files` for searching when available.

## Verification

For frontend changes, run at least:

```powershell
npm run lint
npm run build
```

For changes that affect packaged web content, also run from `web/`:

```powershell
npm run build:uno
```

For changes that affect the Uno wrapper itself, run from `uno/`:

```powershell
dotnet build
```

If a command cannot be run because dependencies or SDKs are missing, note that clearly in the final response.
