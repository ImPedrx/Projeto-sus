import { SiteHeader } from "@/components/site-header";
import { PreviewPlayerProvider } from "@/components/preview-player";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreviewPlayerProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <div className="mono mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[11px] text-muted">
            <span>SusProd — beats e projetos exclusivos</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </PreviewPlayerProvider>
  );
}
