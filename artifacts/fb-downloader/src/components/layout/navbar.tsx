import { Link, useLocation } from "wouter";
import { Facebook, History, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-5xl items-center px-4 md:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Facebook className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight hidden md:inline-block">
              FBSave
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Link
              href="/history"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground/80 hover:bg-accent/10",
                location === "/history" ? "text-primary bg-primary/10" : "text-foreground/60"
              )}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
            <Link
              href="/stats"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground/80 hover:bg-accent/10",
                location === "/stats" ? "text-primary bg-primary/10" : "text-foreground/60"
              )}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Stats
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
