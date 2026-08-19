import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="display text-lg tracking-tight">
          SUSPROD<span className="text-muted">_</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/projetos"
            className="mono border border-border px-4 py-2 text-xs transition-colors hover:border-foreground"
          >
            Projetos
          </Link>
          <Link
            href="/admin/login"
            className="mono bg-foreground px-4 py-2 text-xs text-background transition-opacity hover:opacity-80"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
