import { Search } from "lucide-react";
import { useSongs } from "../../lib/use-songs";
import { useSongBrowser } from "./SongBrowser";

export function SongBrowserSearchBar() {
  const { isLoading: isHydrating } = useSongs();
  const { searchInput, setSearchInput } = useSongBrowser();

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Search song title or alias..."
        className="h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {isHydrating && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          Loading...
        </span>
      )}
    </div>
  );
}
