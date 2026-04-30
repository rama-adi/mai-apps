import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@packages/ui/components/ui/command";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SongCatalogProvider, useSongCatalog } from "../../lib/song-catalog";
import { OmnisearchContext, type OmnisearchOpenOptions } from "./useOmnisearch";
import { searchOmnisearchResults, type OmnisearchResult } from "./omnisearch-search";
import {
  CategoryResults,
  ResultSeparator,
  SongResults,
  VersionResults,
} from "./omnisearch-results";

function OmnisearchDialog({
  isOpen,
  setIsOpen,
  query,
  setQuery,
  close,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  close: () => void;
}) {
  const navigate = useNavigate();
  const { songs, isLoading } = useSongCatalog();
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchOmnisearchResults(songs, query), [songs, query]);
  const resultCount = results.songs.length + results.versions.length + results.categories.length;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query]);

  const selectResult = (result: OmnisearchResult) => {
    close();
    if (result.type === "song") {
      void navigate({
        to: "/songs/$slug",
        params: { slug: result.song.slug },
      });
      return;
    }

    if (result.type === "version") {
      void navigate({
        to: "/version/$slug",
        params: { slug: result.slug },
      });
      return;
    }

    void navigate({
      to: "/songs",
      search: { category: result.slug },
    });
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Search MaiDB"
      description="Search songs, versions, and categories."
      className="top-1/2! w-[calc(100vw-2rem)] max-w-2xl -translate-y-1/2! sm:max-w-3xl lg:max-w-4xl"
    >
      <Command shouldFilter={false} className="rounded-4xl">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search songs, versions, categories..."
        />
        <CommandList ref={listRef} className="h-[60vh] max-h-[60vh] p-1">
          <CommandEmpty className="py-10 text-muted-foreground">
            {isLoading ? "Loading song catalog..." : "No results found."}
          </CommandEmpty>
          {resultCount > 0 ? (
            <>
              <SongResults
                results={results.songs}
                onSelect={selectResult}
                heading={query.trim() ? "Songs" : "Latest songs"}
              />
              <ResultSeparator show={results.songs.length > 0 && results.versions.length > 0} />
              <VersionResults results={results.versions} onSelect={selectResult} />
              <ResultSeparator
                show={
                  results.categories.length > 0 &&
                  (results.songs.length > 0 || results.versions.length > 0)
                }
              />
              <CategoryResults results={results.categories} onSelect={selectResult} />
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function OmnisearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const open = useCallback((options?: OmnisearchOpenOptions) => {
    setQuery(options?.query ?? "");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SongCatalogProvider>
      <OmnisearchContext value={{ isOpen, open, close }}>
        <OmnisearchDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          query={query}
          setQuery={setQuery}
          close={close}
        />
        <div className={cn("contents")}>{children}</div>
      </OmnisearchContext>
    </SongCatalogProvider>
  );
}
