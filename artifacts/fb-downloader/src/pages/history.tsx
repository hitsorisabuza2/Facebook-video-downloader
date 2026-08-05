import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Copy, Check, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getHistory, deleteHistoryItem } from "@/lib/storage";
import type { HistoryItem } from "@/lib/storage";
import { NativeBanner } from "@/components/ads/ads";

function HistoryCard({
  item,
  index,
  onDelete,
}: {
  item: HistoryItem;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04 }}
      layout
    >
      <Card className="overflow-hidden h-full group hover:shadow-md transition-all border-border hover:border-primary/50">
        <CardContent className="p-0 flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-muted">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                }}
              />
            ) : null}
            <div
              className="w-full h-full flex-col items-center justify-center text-muted-foreground gap-1"
              style={{ display: item.thumbnail ? "none" : "flex" }}
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#1877F2] opacity-60" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.028 4.388 11.02 10.125 11.928v-8.44H7.078v-3.488h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.488h-2.796v8.44C19.612 23.093 24 18.1 24 12.073z"/>
              </svg>
              <span className="text-[10px]">No preview</span>
            </div>

            {/* Hover overlay — title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
              <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
            </div>

            {/* Date badge */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium">
              {formatDate(item.downloadedAt)}
            </div>

            {/* Format badge */}
            <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-semibold uppercase">
              {item.format}
            </div>
          </div>

          {/* URL row — always visible */}
          <div className="px-2.5 py-2 flex items-center gap-1.5 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
              {item.url}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 rounded-md"
              onClick={handleCopy}
              title="Copy link"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              title="Delete from history"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>(() => getHistory());

  const handleDelete = useCallback((id: string) => {
    deleteHistoryItem(id);
    setHistory(getHistory());
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Download History</h1>
        <p className="text-muted-foreground">Your most recently downloaded videos.</p>
      </div>

      {history.length === 0 ? (
        <div className="py-32 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/30">
          <HistoryIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No history yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Videos you download will appear here. Go grab a link and try it out!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => (
              <HistoryCard
                key={item.id}
                item={item}
                index={index}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <NativeBanner className="pt-4" />
    </div>
  );
}
