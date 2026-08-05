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

    // Try multiple thumbnail extraction patterns
    const thumbMatch =
      // JSON blob: "thumbnailUrl":"..."
      html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/) ||
      // JSON blob: "preview_image_url":"..."
      html.match(/"preview_image_url"\s*:\s*"([^"]+)"/) ||
      // JSON blob: "image":{"uri":"..."}
      html.match(/"image"\s*:\s*\{"uri"\s*:\s*"([^"]+)"/) ||
      // <meta property="og:image" content="...">
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
      // <meta content="..." property="og:image">
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i) ||
      // <meta name="og:image" content="...">
      html.match(/<meta[^>]+name="og:image"[^>]+content="([^"]+)"/i);

    if (!hdMatch && !sdMatch) {
      return jsonError(
        "No download links found. The video is likely private, a live stream, or region-restricted.",
        400,
      );
    }

    // If no thumbnail found from embed HTML, try Graph API picture endpoint
    let thumbnailUrl = thumbMatch ? clean(thumbMatch[1]) : null;
    if (!thumbnailUrl) {
      thumbnailUrl = await fetchGraphThumbnail(videoId);
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
        thumbnail: thumbnailUrl,
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

/**
 * Try Facebook's public Graph API picture endpoint.
 * For public videos this returns a redirect to the thumbnail image.
 * Returns the final image URL, or null on failure.
 */
async function fetchGraphThumbnail(videoId) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${videoId}/picture?redirect=0`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data?.url) return json.data.url;
  } catch {
    // ignore
  }

  // Fallback: follow redirect directly
  try {
    const res = await fetch(
      `https://graph.facebook.com/${videoId}/picture`,
      {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      },
    );
    if (res.ok && res.url && !res.url.includes("graph.facebook.com")) {
      return res.url;
    }
  } catch {
    // ignore
  }

  return null;
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
