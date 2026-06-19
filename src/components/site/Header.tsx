import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="hover:opacity-90"><Logo /></Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/regulamento"
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Regulamento
          </Link>
          <a
            href="#aposta"
            className="ml-1 hidden rounded-lg gradient-bet px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 sm:inline-flex"
          >
            Apostar agora
          </a>
        </nav>
      </div>
    </header>
  );
}
