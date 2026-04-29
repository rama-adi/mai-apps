import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@packages/ui/components/ui/command";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Folder, Sparkles } from "lucide-react";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, VERSION_BY_SLUG, type MaiDbSong } from "maidb-data";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { SongImage } from "../song-detail/shared";
import { SongCatalogProvider, useSongCatalog } from "../../lib/song-catalog";
import { OmnisearchContext, type OmnisearchOpenOptions } from "./useOmnisearch";
import {
  searchOmnisearchResults,
  type OmnisearchCategoryResult,
  type OmnisearchResult,
  type OmnisearchSongResult,
  type OmnisearchVersionResult,
} from "./omnisearch-search";

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

function ResultSeparator({ show }: { show: boolean }) {
  return show ? <CommandSeparator /> : null;
}

const DIFF_ORDER = ["basic", "advanced", "expert", "master", "remaster"];

function getTopDifficulties(song: MaiDbSong) {
  const best = new Map<string, { level: string; levelValue: number }>();
  for (const sheet of song.sheets) {
    if (sheet.type === "utage" || sheet.isSpecial) continue;
    const existing = best.get(sheet.difficulty);
    if (!existing || sheet.levelValue > existing.levelValue) {
      best.set(sheet.difficulty, { level: sheet.level, levelValue: sheet.levelValue });
    }
  }
  return DIFF_ORDER.filter((d) => best.has(d)).map((d) => ({
    difficulty: d,
    level: best.get(d)!.level,
    color: DIFFICULTY_COLORS[d] ?? "#888",
  }));
}

function AccentRow({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="relative flex w-full min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-0 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex w-full min-w-0 items-center gap-3 pl-3">{children}</div>
    </div>
  );
}

function SongResults({
  results,
  onSelect,
  heading = "Songs",
}: {
  results: OmnisearchSongResult[];
  onSelect: (result: OmnisearchResult) => void;
  heading?: string;
}) {
  if (results.length === 0) return null;

  return (
    <CommandGroup heading={heading}>
      {results.map((result) => {
        const catColor = CATEGORY_BY_SLUG[result.song.category]?.color ?? "#888";
        const versionAbbr = VERSION_BY_SLUG[result.song.version]?.abbr ?? result.song.version;
        const diffs = getTopDifficulties(result.song);
        return (
          <CommandItem
            key={result.id}
            value={result.id}
            onSelect={() => onSelect(result)}
            style={
              {
                ["--accent-tint" as string]: `color-mix(in oklch, ${catColor} 12%, transparent)`,
              } as CSSProperties
            }
            className="data-selected:bg-(--accent-tint)"
          >
            <AccentRow color={catColor}>
              <SongImage song={result.song} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-foreground">{result.title}</span>
                  {result.song.isNew ? (
                    <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-primary-foreground">
                      New
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-muted-foreground">{result.song.artist}</div>
                <div className="flex items-center gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {diffs.map((d) => (
                      <span
                        key={d.difficulty}
                        className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1 py-[1px] text-[10px] leading-tight font-bold text-white"
                        style={{ backgroundColor: d.color }}
                        title={d.difficulty}
                      >
                        {d.level}
                      </span>
                    ))}
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {versionAbbr}
                  </span>
                </div>
              </div>
            </AccentRow>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function extractKanji(abbr: string): string | null {
  const match = abbr.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

function VersionResults({
  results,
  onSelect,
}: {
  results: OmnisearchVersionResult[];
  onSelect: (result: OmnisearchResult) => void;
}) {
  if (results.length === 0) return null;

  return (
    <CommandGroup heading="Versions">
      {results.map((result) => {
        const kanji = extractKanji(result.description);
        return (
          <CommandItem key={result.id} value={result.id} onSelect={() => onSelect(result)}>
            <AccentRow color="var(--primary)">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {kanji ? (
                  <span className="text-2xl font-bold leading-none">{kanji}</span>
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{result.title}</div>
                <div className="truncate text-xs text-muted-foreground">{result.description}</div>
              </div>
            </AccentRow>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function CategoryResults({
  results,
  onSelect,
}: {
  results: OmnisearchCategoryResult[];
  onSelect: (result: OmnisearchResult) => void;
}) {
  if (results.length === 0) return null;

  return (
    <CommandGroup heading="Categories">
      {results.map((result) => (
        <CommandItem
          key={result.id}
          value={result.id}
          onSelect={() => onSelect(result)}
          style={
            {
              ["--accent-tint" as string]: `color-mix(in oklch, ${result.color} 12%, transparent)`,
            } as CSSProperties
          }
          className="data-selected:bg-(--accent-tint)"
        >
          <AccentRow color={result.color}>
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `color-mix(in oklch, ${result.color} 18%, transparent)`,
                color: result.color,
              }}
            >
              <Folder className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{result.title}</div>
              <div className="truncate text-xs text-muted-foreground">{result.description}</div>
            </div>
          </AccentRow>
        </CommandItem>
      ))}
    </CommandGroup>
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
