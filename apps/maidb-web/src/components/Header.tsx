import { Link } from "@tanstack/react-router";
import { Music, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground no-underline"
        >
          <Music className="h-5 w-5 text-primary" />
          MaiDB
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground no-underline [&.active]:text-foreground"
            activeProps={{ className: "active" }}
          >
            Songs
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search songs</span>
          </button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
