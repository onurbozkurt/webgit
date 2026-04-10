# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack on port 8091
npm run build        # Production build
npm start            # Production server on port 8091
npm run lint         # ESLint
```

Docker: `docker-compose up` runs on port 3333 with `REPOS_BASE_PATH=/repos`.

## Architecture

WebGit is a browser-based Git client (like GitHub Desktop) built with Next.js 16 App Router. It manages local git repos through a web UI using `simple-git` on the server side.

### Data flow

**Client components** call `repoApi` methods (`src/lib/api-client.ts`) which hit **Next.js API routes** (`src/app/api/repos/...`) that call **git helper functions** (`src/lib/git.ts` wrapping `simple-git`). State lives in a React Context + useReducer store (`src/lib/store.tsx`).

### Key boundaries

- **`simple-git` is server-only** — configured as `serverExternalPackages` in `next.config.ts`. All git operations must go through API routes, never imported in client components.
- **Repository storage** — repos are stored under `REPOS_BASE_PATH` (env var, default `./repos`). Repo metadata is persisted in `.registry.json` within that directory (`src/lib/repo-registry.ts`).
- **Repos are identified by UUID** — generated at clone/add time, used in all API route params as `[id]`.

### API routes

All under `src/app/api/repos/`. The `[id]` segment is the repo UUID. Routes cover: status, diff, stage, unstage, commit, log, branches (CRUD + checkout), push, pull, fetch, discard, gitignore.

### Component structure

`RepoWorkspace` is the main layout, composed of `TopToolbar` (push/pull/fetch, branch switcher), `LeftSidebar` (tabbed: changes file list + commit panel, or commit history), and a main content area (`DiffViewer` using diff2html).

### Styling

Inline styles reference CSS custom properties defined in `src/app/globals.css`. Light/dark theme switches automatically via `prefers-color-scheme`. Tailwind is used for utility classes alongside the CSS variables.

### Path alias

`@/*` maps to `src/*` (tsconfig).
