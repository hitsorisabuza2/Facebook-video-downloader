import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Download, MonitorPlay, Smartphone } from "lucide-react";
import { getStats } from "@/lib/storage";

export default function Stats() {
  const stats = useMemo(() => getStats(), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Statistics</h1>
        <p className="text-muted-foreground">Overview of your download activity.</p>
      </div>

      {stats.totalDownloads === 0 ? (
        <div className="py-32 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/30">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No data yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Your stats will appear here once you start downloading videos.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-primary text-primary-foreground border-primary overflow-hidden relative">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                <Download className="h-32 w-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-primary-foreground/90">Total Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-extrabold">{stats.totalDownloads}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="p-6 pb-2">
                <MonitorPlay className="h-5 w-5 text-muted-foreground mb-2" />
                <CardDescription>HD Video</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-4xl font-bold text-foreground">{stats.totalHd}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="p-6 pb-2">
                <Smartphone className="h-5 w-5 text-muted-foreground mb-2" />
                <CardDescription>SD Video</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-4xl font-bold text-foreground">{stats.totalSd}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
