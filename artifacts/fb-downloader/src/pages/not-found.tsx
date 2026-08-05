import { Link } from "wouter";
import { DownloadCloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-primary">
        <DownloadCloud className="h-24 w-24 opacity-20" />
      </div>
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <p className="text-xl text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
