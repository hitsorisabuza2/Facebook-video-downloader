// localStorage-based history for the Cloudflare Pages deployment.
// No backend required — all data lives in the browser.

const STORAGE_KEY = "fbsave_history";
const MAX_ITEMS = 200;

export type DownloadFormat = "hd" | "sd";

export interface HistoryItem {
  id: string;           // unique entry id (videoId + timestamp)
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  format: DownloadFormat;
  downloadedAt: string; // ISO 8601
}

export interface StatsData {
  totalDownloads: number;
  totalHd: number;
  totalSd: number;
}

function readAll(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

function writeAll(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Save a download entry. Called when the user clicks HD / SD. */
export function saveDownload(
  video: { id: string; url: string; title: string; thumbnail: string },
  format: DownloadFormat,
): void {
  const existing = readAll();
  const entry: HistoryItem = {
    id: `${video.id}_${Date.now()}`,
    videoId: video.id,
    url: video.url,
    title: video.title,
    thumbnail: video.thumbnail,
    format,
    downloadedAt: new Date().toISOString(),
  };
  const updated = [entry, ...existing].slice(0, MAX_ITEMS);
  writeAll(updated);
}

/** Return history newest-first. */
export function getHistory(): HistoryItem[] {
  return readAll();
}

/** Remove a single entry by its id. */
export function deleteHistoryItem(id: string): void {
  const updated = readAll().filter((item) => item.id !== id);
  writeAll(updated);
}

/** Compute stats from stored history. */
export function getStats(): StatsData {
  const items = readAll();
  let totalHd = 0;
  let totalSd = 0;

  for (const item of items) {
    if (item.format === "hd") totalHd++;
    else if (item.format === "sd") totalSd++;
  }

  return {
    totalDownloads: items.length,
    totalHd,
    totalSd,
  };
}
