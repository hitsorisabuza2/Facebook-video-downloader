// Cloudflare Pages Function — extracts Facebook video download links.
// Uses Facebook's public video embed page to extract hd_src / sd_src URLs.
// Works for public videos and reels. Private videos return a clear error.

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return jsonError("Missing or invalid URL", 400);
    }

    let url = rawUrl.trim();

    // Resolve fb.watch short URLs and share URLs by following redirects
    if (/fb\.watch|facebook\.com\/share/.test(url)) {
      try {
        const r = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
        });
        url = r.url;
      } catch {
        // ignore — try with original URL
      }
    }

    if (!url.includes("facebook.com")) {
      return jsonError("Please provide a valid Facebook video URL.", 400);
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return jsonError(
        "Could not extract a video ID from that URL. " +
          "Supported formats: facebook.com/watch?v=ID, facebook.com/.../videos/ID, fb.watch/...",
        400,
      );
    }

    // Facebook exposes hd_src / sd_src in the embed page's JSON blobs
    const embedUrl = `https://www.facebook.com/video/embed?video_id=${videoId}`;
    const embedRes = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!embedRes.ok) {
      return jsonError(
        `Facebook returned ${embedRes.status}. The video may be private or unavailable.`,
        400,
      );
    }

    const html = await embedRes.text();

    // Decode escaped Unicode/slashes that Facebook puts in JSON blobs
    const clean = (s) =>
      s
        .replace(/\\u0025/g, "%")
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/\\"/g, '"');

    const hdMatch = html.match(/"hd_src"\s*:\s*"([^"]+)"/);
    const sdMatch = html.match(/"sd_src"\s*:\s*"([^"]+)"/);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const thumbMatch =
      html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/) ||
      html.match(/"og:image"\s+content="([^"]+)"/);

    if (!hdMatch && !sdMatch) {
      return jsonError(
        "No download links found. The video is likely private, a live stream, or region-restricted.",
        400,
      );
    }

    return new Response(
      JSON.stringify({
        id: videoId,
        title: titleMatch ? clean(titleMatch[1]).trim() : "Facebook Video",
        hdUrl: hdMatch ? clean(hdMatch[1]) : null,
        sdUrl: sdMatch
          ? clean(sdMatch[1])
          : hdMatch
            ? clean(hdMatch[1])
            : null,
        thumbnail: thumbMatch ? clean(thumbMatch[1]) : null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    return jsonError("Internal server error: " + String(err), 500);
  }
}

function extractVideoId(url) {
  const patterns = [
    /facebook\.com\/.*?\/videos\/(\d+)/,
    /facebook\.com\/video\.php\?v=(\d+)/,
    /facebook\.com\/watch\/?\?(?:.*&)?v=(\d+)/,
    /facebook\.com\/reel\/(\d+)/,
    /facebook\.com\/share\/v\/([A-Za-z0-9_-]+)/,
    /facebook\.com\/.*?\/posts\/(\d+)/,
    /(\d{10,})/,               // fallback: any long numeric ID in the URL
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
