import { Navbar } from "./navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 md:px-8 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
