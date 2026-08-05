// Cloudflare Pages Function — proxies Facebook video downloads.
// Because a.download is ignored for cross-origin URLs, we stream the file
// through our own domain so the browser treats it as same-origin and saves it.

const ALLOWED_HOSTS = [
  "fbcdn.net",        // Facebook's primary video CDN
  "fbsbx.com",        // Facebook sandboxed content
  "facebook.com",     // Direct Facebook URLs
  "cdninstagram.com", // Shared CDN used by Facebook/Instagram
  "video.xx.fbcdn.net",
];

export async function onRequestGet(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const videoUrl = reqUrl.searchParams.get("url");
  const filename = reqUrl.searchParams.get("filename") || "video.mp4";

  if (!videoUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let urlObj;
  try {
    urlObj = new URL(videoUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Allowlist — only proxy known Facebook CDN hosts
  if (!ALLOWED_HOSTS.some((d) => urlObj.hostname.includes(d))) {
    return new Response(JSON.stringify({ error: "URL not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = await fetch(videoUrl, {
    headers: {
      Referer: "https://www.facebook.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const contentType =
    upstream.headers.get("Content-Type") || "video/mp4";

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "private, max-age=3600",
  });

  const cl = upstream.headers.get("Content-Length");
  if (cl) headers.set("Content-Length", cl);

  return new Response(upstream.body, { status: 200, headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
