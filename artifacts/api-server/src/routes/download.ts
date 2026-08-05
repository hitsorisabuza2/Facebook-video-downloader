import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, downloadsTable } from "@workspace/db";
import {
  DownloadVideoBody,
  DownloadVideoResponse,
  GetHistoryResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// POST /download — fetch TikTok video info and return download links
router.post("/download", async (req, res): Promise<void> => {
  const parsed = DownloadVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rawUrl = parsed.data.url;

  // Extract first TikTok URL from pasted text (handles TikTok Lite share text, etc.)
  const urlMatch = rawUrl.match(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/\S+/);
  const url = urlMatch ? urlMatch[0].replace(/[.,;!?)\]}>'"]+$/, "") : rawUrl.trim();

  if (!url.includes("tiktok.com")) {
    res.status(400).json({ error: "Please provide a valid TikTok URL" });
    return;
  }

  // Call tikwm.com API
  const formData = new URLSearchParams();
  formData.append("url", url);
  formData.append("hd", "1");

  const tikwmRes = await fetch("https://www.tikwm.com/api/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!tikwmRes.ok) {
    req.log.error({ status: tikwmRes.status }, "tikwm.com request failed");
    res.status(500).json({ error: "Failed to fetch video info" });
    return;
  }

  const tikwmData = (await tikwmRes.json()) as {
    code: number;
    msg?: string;
    data?: {
      id: string;
      title?: string;
      cover?: string;
      origin_cover?: string;
      duration?: number;
      digg_count?: number;
      play_count?: number;
      author?: { nickname?: string; unique_id?: string; avatar?: string };
    };
  };

  if (!tikwmData.data || tikwmData.code !== 0) {
    res
      .status(400)
      .json({ error: tikwmData.msg || "Failed to process TikTok URL" });
    return;
  }

  const d = tikwmData.data;
  const videoId = d.id || "";

  const videoInfo = {
    id: videoId,
    title: d.title || "TikTok Video",
    author: d.author?.nickname || d.author?.unique_id || "Unknown",
    authorAvatar: d.author?.avatar ?? null,
    thumbnail: d.cover || d.origin_cover || "",
    hdUrl: `https://www.tikwm.com/video/media/hdplay/${videoId}.mp4`,
    sdUrl: `https://www.tikwm.com/video/media/play/${videoId}.mp4`,
    audioUrl: `https://www.tikwm.com/video/music/${videoId}.mp3`,
    duration: d.duration || 0,
    likes: d.digg_count || 0,
    plays: d.play_count || 0,
  };

  // Persist to history (fire and forget — don't block response)
  db.insert(downloadsTable)
    .values({
      url,
      videoId,
      title: videoInfo.title,
      author: videoInfo.author,
      thumbnail: videoInfo.thumbnail,
      format: "hd",
    })
    .then(() => {
      req.log.info({ videoId }, "Download recorded");
    })
    .catch((err: unknown) => {
      req.log.warn({ err }, "Failed to record download history");
    });

  res.json(DownloadVideoResponse.parse(videoInfo));
});

// GET /history — last 50 downloads
router.get("/history", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(downloadsTable)
    .orderBy(desc(downloadsTable.downloadedAt))
    .limit(50);

  const items = rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    author: row.author,
    thumbnail: row.thumbnail,
    downloadedAt: row.downloadedAt.toISOString(),
  }));

  res.json(GetHistoryResponse.parse(items));
});

// GET /stats — download totals
router.get("/stats", async (_req, res): Promise<void> => {
  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(downloadsTable);

  const totalHdResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(downloadsTable)
    .where(eq(downloadsTable.format, "hd"));

  const totalSdResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(downloadsTable)
    .where(eq(downloadsTable.format, "sd"));

  const totalAudioResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(downloadsTable)
    .where(eq(downloadsTable.format, "audio"));

  const topAuthorsResult = await db
    .select({
      author: downloadsTable.author,
      count: sql<number>`count(*)::int`,
    })
    .from(downloadsTable)
    .groupBy(downloadsTable.author)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const stats = {
    totalDownloads: totalResult[0]?.count ?? 0,
    totalHd: totalHdResult[0]?.count ?? 0,
    totalSd: totalSdResult[0]?.count ?? 0,
    totalAudio: totalAudioResult[0]?.count ?? 0,
    topAuthors: topAuthorsResult.map((r) => ({
      author: r.author,
      count: r.count,
    })),
  };

  res.json(GetStatsResponse.parse(stats));
});

export default router;
