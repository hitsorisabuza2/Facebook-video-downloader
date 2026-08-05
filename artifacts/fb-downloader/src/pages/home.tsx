import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { saveDownload } from "@/lib/storage";
import { NativeBanner, ResponsiveBanner } from "@/components/ads/ads";

interface VideoInfo {
  id: string;
  title: string;
  hdUrl: string | null;
  sdUrl: string | null;
  thumbnail: string | null;
}

// Extract the first Facebook URL from pasted text
function extractFbUrl(text: string): string {
  const match = text.match(
    /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/\S+/,
  );
  if (match) return match[0].replace(/[.,;!?)\]}>'"]+$/, "");
  return text.trim();
}

async function fetchVideoInfo(rawUrl: string): Promise<VideoInfo> {
  const url = extractFbUrl(rawUrl);

  if (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.com")) {
    throw new Error("Please provide a valid Facebook video URL.");
  }

  const res = await fetch("/api/fb-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || "Failed to process Facebook URL. Please try again.");
  }

  return json as VideoInfo;
}

function proxyDownloadUrl(fileUrl: string, filename: string): string {
  return `/api/proxy?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const downloadMutation = useMutation({ mutationFn: fetchVideoInfo });

  const handleUrlChange = (raw: string) => {
    const cleaned = extractFbUrl(raw);
    setUrl(cleaned !== raw.trim() ? cleaned : raw);
  };

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = extractFbUrl(url);
    if (!cleaned) return;
    downloadMutation.mutate(cleaned);
  };

  const triggerDownload = (
    downloadUrl: string,
    filename: string,
    format: "hd" | "sd",
  ) => {
    const video = downloadMutation.data!;
    saveDownload(
      { id: video.id, url, title: video.title, thumbnail: video.thumbnail ?? "" },
      format,
    );
    const a = document.createElement("a");
    a.href = proxyDownloadUrl(downloadUrl, filename);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground"
        >
          Download Facebook{" "}
          <br className="md:hidden" />
          <span className="text-primary">Videos Free</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Paste a Facebook video link and download it in HD or SD instantly.
        </motion.p>
      </div>

      {/* Responsive leaderboard: 728×90 desktop / 468×60 mobile */}
      <ResponsiveBanner className="py-2" />

      {/* Search form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto"
      >
        <form onSubmit={handleDownload} className="relative flex items-center shadow-sm rounded-xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Download className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste Facebook video URL here..."
            className="pl-12 pr-36 h-16 text-lg rounded-xl border-2 border-border focus-visible:border-primary focus-visible:ring-primary/20 bg-background shadow-inner transition-colors"
            disabled={downloadMutation.isPending}
          />
          <Button
            type="submit"
            className="absolute right-2 top-2 bottom-2 h-auto px-6 rounded-lg text-md font-semibold"
            disabled={!url || downloadMutation.isPending}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Get Video"
            )}
          </Button>
        </form>

        <AnimatePresence>
          {downloadMutation.isError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {(downloadMutation.error as Error)?.message ||
                  "Failed to fetch video. Check the URL and try again."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Video result card */}
      <AnimatePresence>
        {downloadMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card className="overflow-hidden border-2 shadow-lg">
              <CardContent className="p-0 sm:flex">
                {/* Thumbnail / video preview */}
                <div className="relative sm:w-2/5 aspect-video sm:aspect-auto bg-black flex items-center justify-center">
                  {downloadMutation.data.hdUrl || downloadMutation.data.sdUrl ? (
                    <video
                      key={downloadMutation.data.hdUrl ?? downloadMutation.data.sdUrl ?? ""}
                      src={downloadMutation.data.hdUrl ?? downloadMutation.data.sdUrl ?? ""}
                      poster={downloadMutation.data.thumbnail ?? undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      style={{ maxHeight: "320px" }}
                    />
                  ) : downloadMutation.data.thumbnail ? (
                    <img
                      src={downloadMutation.data.thumbnail}
                      alt={downloadMutation.data.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">No preview available</div>
                  )}
                </div>

                {/* Info + download buttons */}
                <div className="p-6 sm:p-8 sm:w-3/5 flex flex-col justify-between">
                  <h2 className="text-xl font-bold line-clamp-4 mb-6 leading-tight">
                    {downloadMutation.data.title}
                  </h2>

                  <div className="space-y-3 pt-4 border-t">
                    {downloadMutation.data.hdUrl && (
                      <Button
                        className="w-full justify-between group h-12"
                        onClick={() =>
                          triggerDownload(
                            downloadMutation.data!.hdUrl!,
                            `fbsave-${downloadMutation.data!.id}-hd.mp4`,
                            "hd",
                          )
                        }
                      >
                        <span className="font-semibold text-base">Download HD</span>
                        <Badge variant="secondary" className="group-hover:bg-background transition-colors">
                          MP4
                        </Badge>
                      </Button>
                    )}
                    {downloadMutation.data.sdUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:border-primary hover:text-primary transition-colors h-11"
                        onClick={() =>
                          triggerDownload(
                            downloadMutation.data!.sdUrl!,
                            `fbsave-${downloadMutation.data!.id}-sd.mp4`,
                            "sd",
                          )
                        }
                      >
                        <span>Download SD</span>
                        <Badge variant="secondary" className="text-[10px]">MP4</Badge>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to get a Facebook video link */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border rounded-2xl p-6 md:p-8 bg-muted/30 space-y-5"
      >
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1">
            How to get a Facebook video link
          </h2>
          <p className="text-sm text-muted-foreground">
            Follow these steps on the Facebook app or website.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-center">
          {[
            { step: 1, text: 'Open the video on Facebook' },
            { step: 2, text: 'Tap the "⋯" (More) menu on the video' },
            { step: 3, text: 'Select "Copy link" — then paste it above' },
          ].map(({ step, text }) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                {step}
              </div>
              <p className="text-sm font-medium leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Native banner */}
      <NativeBanner className="pt-4" />
    </div>
  );
}
