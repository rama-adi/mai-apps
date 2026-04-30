import { CommandGroup, CommandItem, CommandSeparator } from "@packages/ui/components/ui/command";
import { Folder, Sparkles } from "lucide-react";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, VERSION_BY_SLUG, type MaiDbSong } from "maidb-data";
import type { CSSProperties, ReactNode } from "react";
import { SongImage } from "../song-detail/shared";
import type {
  OmnisearchCategoryResult,
  OmnisearchResult,
  OmnisearchSongResult,
  OmnisearchVersionResult,
} from "./omnisearch-search";

const DIFF_ORDER = ["basic", "advanced", "expert", "master", "remaster"];
const UTAGE_COLOR = "#dc39b8";

function isAvailableSheet(sheet: MaiDbSong["sheets"][number]) {
  return sheet.level !== "*" && sheet.levelValue > 0;
}

function isUtageSong(song: MaiDbSong) {
  return song.category === "utage" || song.songId.startsWith("_utage_.");
}

function getTopDifficulties(song: MaiDbSong) {
  const best = new Map<string, { level: string; levelValue: number }>();
  for (const sheet of song.sheets) {
    if (sheet.type === "utage" || sheet.isSpecial) continue;
    if (!isAvailableSheet(sheet)) continue;
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

function getUtageLevels(song: MaiDbSong) {
  const byDifficulty = new Map<string, { level: string; levelValue: number }>();
  for (const sheet of song.sheets) {
    if (sheet.type !== "utage") continue;
    if (!isAvailableSheet(sheet)) continue;
    const existing = byDifficulty.get(sheet.difficulty);
    if (!existing || sheet.levelValue > existing.levelValue) {
      byDifficulty.set(sheet.difficulty, { level: sheet.level, levelValue: sheet.levelValue });
    }
  }
  return [...byDifficulty.values()]
    .sort((a, b) => a.levelValue - b.levelValue)
    .map((s, i) => ({ key: `${s.level}-${i}`, level: s.level }));
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

export function ResultSeparator({ show }: { show: boolean }) {
  return show ? <CommandSeparator /> : null;
}

export function SongResults({
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
        const utage = isUtageSong(result.song);
        const catColor = utage
          ? UTAGE_COLOR
          : (CATEGORY_BY_SLUG[result.song.category]?.color ?? "#888");
        const versionAbbr = VERSION_BY_SLUG[result.song.version]?.abbr ?? result.song.version;
        const diffs = utage ? [] : getTopDifficulties(result.song);
        const utageLevels = utage ? getUtageLevels(result.song) : [];
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
                  {utage ? (
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white"
                      style={{ backgroundColor: UTAGE_COLOR }}
                      title="Utage chart"
                    >
                      宴 Utage
                    </span>
                  ) : null}
                  {result.song.isNew ? (
                    <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-primary-foreground">
                      New
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-muted-foreground">{result.song.artist}</div>
                <div className="flex items-center gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {utage
                      ? utageLevels.map((u) => (
                          <span
                            key={u.key}
                            className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1 py-[1px] text-[10px] leading-tight font-bold text-white"
                            style={{ backgroundColor: UTAGE_COLOR }}
                            title="Utage"
                          >
                            {u.level}
                          </span>
                        ))
                      : diffs.map((d) => (
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

export function VersionResults({
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

export function CategoryResults({
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
