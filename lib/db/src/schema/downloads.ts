import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const downloadsTable = pgTable("downloads", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  thumbnail: text("thumbnail").notNull(),
  format: text("format").notNull(), // "hd" | "sd" | "audio"
  downloadedAt: timestamp("downloaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDownloadSchema = createInsertSchema(downloadsTable).omit({ id: true, downloadedAt: true });
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloadsTable.$inferSelect;
