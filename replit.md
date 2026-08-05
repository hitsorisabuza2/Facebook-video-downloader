# Facebook Video Downloader

A clean web app for downloading Facebook videos in HD and SD — deployed on Cloudflare Pages.

## Run & Operate

- `pnpm --filter @workspace/fb-downloader run dev` — run the frontend (port 19463)
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Storage: localStorage (no backend DB)
- API: Cloudflare Pages Functions (`/functions/api/fb-download.js`, `/functions/api/proxy.js`)
- Build: Vite (static output → Cloudflare Pages)

## Where things live

- `artifacts/fb-downloader/` — the React/Vite frontend
- `artifacts/fb-downloader/src/pages/home.tsx` — main download page
- `artifacts/fb-downloader/src/pages/history.tsx` — download history
- `artifacts/fb-downloader/src/lib/storage.ts` — localStorage history/stats
- `artifacts/fb-downloader/src/components/ads/ads.tsx` — ad unit components
- `functions/api/fb-download.js` — Cloudflare Function: fetch FB video info
- `functions/api/proxy.js` — Cloudflare Function: stream video file for download

## Architecture decisions

- Facebook video info is fetched server-side (Cloudflare Function) because Facebook's embed page does not have CORS headers.
- Downloads are proxied through `/api/proxy` so `a.download` works cross-origin.
- History and stats live in localStorage — no database needed.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
