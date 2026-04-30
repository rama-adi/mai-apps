import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@packages/ui/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@packages/ui/components/ui/popover";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSongCatalog } from "../../lib/song-catalog";
import {
  CategoryResults,
  ResultSeparator,
  SongResults,
  VersionResults,
} from "./omnisearch-results";
import { searchOmnisearchResults, type OmnisearchResult } from "./omnisearch-search";

export type InlineOmniboxProps = {
  className?: string;
  listClassName?: string;
  placeholder?: string;
  /**
   * Show latest songs (and other defaults) when the query is empty.
   * When false, the popover only opens once the user types.
   */
  showLatestWhenEmpty?: boolean;
  /**
   * Clear the input after selecting a result. Defaults to false.
   */
  clearOnSelect?: boolean;
  /**
   * Called after a result is selected (and before navigation).
   */
  onSelect?: (result: OmnisearchResult) => void;
  /**
   * Controlled query (optional).
   */
  value?: string;
  onValueChange?: (value: string) => void;
  /**
   * Whether to autofocus the input on mount.
   */
  autoFocus?: boolean;
};

export function InlineOmnibox({
  className,
  listClassName,
  placeholder = "Search songs, versions, categories...",
  showLatestWhenEmpty = true,
  clearOnSelect = false,
  onSelect,
  value,
  onValueChange,
  autoFocus = false,
}: InlineOmniboxProps) {
  const navigate = useNavigate();
  const { songs, isLoading } = useSongCatalog();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const query = isControlled ? value : internalQuery;
  const setQuery = (next: string) => {
    if (!isControlled) setInternalQuery(next);
    onValueChange?.(next);
  };

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const wantsList = showLatestWhenEmpty || hasQuery;
  const isOpen = isFocused && wantsList;

  const results = useMemo(
    () => (wantsList ? searchOmnisearchResults(songs, query) : null),
    [wantsList, songs, query],
  );

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query]);

  const handleSelect = (result: OmnisearchResult) => {
    onSelect?.(result);
    if (clearOnSelect) setQuery("");
    setIsFocused(false);
    inputRef.current?.blur();

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

  const resultCount = results
    ? results.songs.length + results.versions.length + results.categories.length
    : 0;

  return (
    <Command
      shouldFilter={false}
      className={cn(
        "relative w-full overflow-visible rounded-none bg-transparent p-0",
        "[&_[data-slot=input-group]]:bg-background",
        className,
      )}
    >
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setIsFocused(false);
        }}
      >
        <PopoverAnchor asChild>
          <div>
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder={placeholder}
              autoFocus={autoFocus}
              onFocus={() => setIsFocused(true)}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && contentRef.current?.contains(next)) return;
                setIsFocused(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsFocused(false);
              }}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={contentRef}
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (inputRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
          className={cn("w-(--radix-popover-trigger-width) max-w-none gap-0 p-1", listClassName)}
        >
          <CommandList ref={listRef} className="max-h-96">
            <CommandEmpty className="py-10 text-muted-foreground">
              {isLoading ? "Loading song catalog..." : "No results found."}
            </CommandEmpty>
            {results && resultCount > 0 ? (
              <>
                <SongResults
                  results={results.songs}
                  onSelect={handleSelect}
                  heading={hasQuery ? "Songs" : "Latest songs"}
                />
                <ResultSeparator show={results.songs.length > 0 && results.versions.length > 0} />
                <VersionResults results={results.versions} onSelect={handleSelect} />
                <ResultSeparator
                  show={
                    results.categories.length > 0 &&
                    (results.songs.length > 0 || results.versions.length > 0)
                  }
                />
                <CategoryResults results={results.categories} onSelect={handleSelect} />
              </>
            ) : null}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
