# Deploying to Cloudflare Pages

## Architecture

- **Frontend**: React + Vite, built to `dist/public/`, served by Cloudflare Pages
- **Backend**: `functions/api/download.js` becomes a Cloudflare Worker automatically

No separate backend service needed. The Cloudflare Worker handles the TikTok API proxy.

> **Note on history/stats in production**: The dev version uses an Express + PostgreSQL backend for history and stats. On Cloudflare Pages, history and stats can be wired to:
> - Cloudflare D1 (SQLite at the edge) — add `functions/api/history.js` and `functions/api/stats.js`
> - Or keep them localStorage-based (client-side only, no server needed)

## Step-by-step: Connect GitHub → Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages** → **Create a project**
2. Select **Connect to Git** → authorize GitHub → pick `TikTokvideodownloader`
3. Set build configuration:
   - **Build command**: `pnpm --filter @workspace/tiktok-downloader run build`
   - **Build output directory**: `artifacts/tiktok-downloader/dist/public`
   - **Root directory**: `/` (leave blank or set to repo root)
4. Click **Save and Deploy**

Every push to `main` auto-deploys within ~1 minute.

## Environment variables (Cloudflare Pages)

No environment variables are required for the basic downloader.

## Custom domain

In Cloudflare Pages → your project → **Custom domains** → add your domain.
DNS is managed automatically if the domain is already on Cloudflare.

## How the Worker backend works

`functions/api/download.js` is picked up by Cloudflare Pages automatically.
It maps to the route `/api/download` and proxies to tikwm.com.

No Python, no yt-dlp, no separate server needed. tikwm.com handles the TikTok
watermark-removal and returns direct MP4/MP3 download links.

If you later need a true yt-dlp Python backend, deploy it to Render and update
the fetch URL in the Worker.
