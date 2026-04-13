import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { memo, type MouseEvent, useState } from "react";
import { CATEGORY_BY_SLUG, DIFFICULTY_COLORS, VERSION_BY_SLUG, type MaiDbSong } from "maidb-data";

const THUMBNAIL_BASE = "https://maisongdb-blob.onebyteworks.my.id/thumb";

const DIFF_ORDER = ["basic", "advanced", "expert", "master", "remaster"];

// Utage color from constants (宴会場)
const UTAGE_COLOR = "#dc39b8";
const UTAGE_KANJI = "宴";

interface ChartFilters {
  difficulty?: string;
  type?: string;
  region?: string;
  minLevel?: number;
  maxLevel?: number;
  minInternalLevel?: number;
  maxInternalLevel?: number;
}

function isBrowsableSheet(sheet: MaiDbSong["sheets"][number]): boolean {
  return sheet.type !== "utage" && !sheet.isSpecial;
}

/** Strip 【】 brackets for compact chip display */
function stripBrackets(s: string): string {
  return s.replace(/^【/, "").replace(/】$/, "");
}

function getUtageDisplayChips(song: MaiDbSong, useChartConstant: boolean) {
  const utageSheets = song.sheets.filter((s) => s.type === "utage");
  if (utageSheets.length === 0) return [];

  // Group by difficulty to deduplicate (prefer sheet with levelValue > 0)
  const byDifficulty = new Map<
    string,
    { sheet: MaiDbSong["sheets"][number]; isUnavailable: boolean }
  >();

  for (const sheet of utageSheets) {
    const existing = byDifficulty.get(sheet.difficulty);
    // Prefer the sheet with a real level over * (levelValue 0)
    if (!existing || (existing.sheet.levelValue === 0 && sheet.levelValue > 0)) {
      byDifficulty.set(sheet.difficulty, {
        sheet,
        isUnavailable: sheet.level === "*" && sheet.levelValue === 0,
      });
    }
  }

  return [...byDifficulty.values()].map(({ sheet, isUnavailable }) => {
    const hasSpecialDifficulty = !["basic", "advanced", "expert", "master", "remaster"].includes(
      sheet.difficulty,
    );

    let displayText: string;
    if (isUnavailable) {
      // Sheet with * level — no longer available
      displayText = hasSpecialDifficulty ? stripBrackets(sheet.difficulty) : UTAGE_KANJI;
    } else if (hasSpecialDifficulty && sheet.difficulty) {
      displayText = stripBrackets(sheet.difficulty);
    } else if (sheet.levelValue > 0) {
      displayText =
        useChartConstant && sheet.internalLevelValue > 0
          ? sheet.internalLevelValue.toFixed(1)
          : sheet.level;
    } else {
      displayText = UTAGE_KANJI;
    }

    return {
      text: displayText,
      color: UTAGE_COLOR,
      difficulty: sheet.difficulty,
      isUnavailable,
    };
  });
}

function matchesChartFilters(sheet: MaiDbSong["sheets"][number], filters: ChartFilters): boolean {
  if (!isBrowsableSheet(sheet)) return false;
  if (filters.difficulty && sheet.difficulty !== filters.difficulty) return false;
  if (filters.type && sheet.type !== filters.type) return false;
  if (filters.region) {
    const region = filters.region as keyof typeof sheet.regions;
    if (!sheet.regions[region]) return false;
  }
  if (filters.minLevel != null && sheet.levelValue < filters.minLevel) return false;
  if (filters.maxLevel != null && sheet.levelValue > filters.maxLevel) return false;
  if (filters.minInternalLevel != null) {
    if (sheet.internalLevelValue <= 0 || sheet.internalLevelValue < filters.minInternalLevel) {
      return false;
    }
  }
  if (filters.maxInternalLevel != null) {
    if (sheet.internalLevelValue <= 0 || sheet.internalLevelValue > filters.maxInternalLevel) {
      return false;
    }
  }

  return true;
}

function hasActiveChartFilters(filters: ChartFilters): boolean {
  return (
    filters.difficulty != null ||
    filters.type != null ||
    filters.region != null ||
    filters.minLevel != null ||
    filters.maxLevel != null ||
    filters.minInternalLevel != null ||
    filters.maxInternalLevel != null
  );
}

function getChartDistance(sheet: MaiDbSong["sheets"][number], filters: ChartFilters): number {
  const candidates = [
    {
      active: filters.minLevel != null || filters.maxLevel != null,
      min: filters.minLevel,
      max: filters.maxLevel,
      value: sheet.levelValue,
    },
    {
      active: filters.minInternalLevel != null || filters.maxInternalLevel != null,
      min: filters.minInternalLevel,
      max: filters.maxInternalLevel,
      value: sheet.internalLevelValue,
      skip: sheet.internalLevelValue <= 0,
    },
  ];

  let distance = 0;
  for (const candidate of candidates) {
    if (!candidate.active) continue;
    if (candidate.skip) return Number.POSITIVE_INFINITY;

    const targetMin = candidate.min ?? -Number.POSITIVE_INFINITY;
    const targetMax = candidate.max ?? Number.POSITIVE_INFINITY;
    const targetCenter =
      candidate.min != null && candidate.max != null
        ? (candidate.min + candidate.max) / 2
        : (candidate.min ?? candidate.max ?? 0);

    if (candidate.value >= targetMin && candidate.value <= targetMax) {
      distance += Math.abs(candidate.value - targetCenter);
    } else if (candidate.value < targetMin) {
      distance += targetMin - candidate.value + 100;
    } else {
      distance += candidate.value - targetMax + 100;
    }
  }

  return distance;
}

function getDisplayedDifficulties(
  song: MaiDbSong,
  useChartConstant: boolean,
  filters: ChartFilters = {},
) {
  const best = new Map<
    string,
    { level: string; internalLevelValue: number; levelValue: number; distance: number }
  >();
  const useFilteredCharts = hasActiveChartFilters(filters);

  for (const sheet of song.sheets) {
    // Skip utage sheets unless explicitly filtering by utage type
    if (sheet.type === "utage" && filters.type !== "utage") continue;
    // Skip special/non-browsable sheets (except utage when filtering for it)
    if (!isBrowsableSheet(sheet) && !(sheet.type === "utage" && filters.type === "utage")) continue;
    if (useFilteredCharts && !matchesChartFilters(sheet, filters)) continue;

    const entry = {
      level: sheet.level,
      internalLevelValue: sheet.internalLevelValue,
      levelValue: sheet.levelValue,
      distance: useFilteredCharts ? getChartDistance(sheet, filters) : -sheet.levelValue,
    };
    const existing = best.get(sheet.difficulty);
    if (
      !existing ||
      entry.distance < existing.distance ||
      (entry.distance === existing.distance && entry.levelValue > existing.levelValue)
    ) {
      best.set(sheet.difficulty, entry);
    }
  }

  return DIFF_ORDER.filter((d) => best.has(d)).map((d) => {
    const entry = best.get(d)!;
    const displayValue =
      useChartConstant && entry.internalLevelValue > 0
        ? entry.internalLevelValue.toFixed(1)
        : entry.level;
    return {
      difficulty: d,
      level: displayValue,
      color: DIFFICULTY_COLORS[d] ?? "#888",
    };
  });
}

export const SongCard = memo(function SongCard({
  song,
  onSelect,
  currentSearch,
  useChartConstant = false,
  difficulty,
  type,
  region,
  minLevel,
  maxLevel,
  minInternalLevel,
  maxInternalLevel,
}: {
  song: MaiDbSong;
  onSelect?: (song: MaiDbSong, trigger?: HTMLElement | null) => void;
  currentSearch?: Record<string, unknown>;
  useChartConstant?: boolean;
  difficulty?: string;
  type?: string;
  region?: string;
  minLevel?: number;
  maxLevel?: number;
  minInternalLevel?: number;
  maxInternalLevel?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = song.internalImageId
    ? `${THUMBNAIL_BASE}/${song.internalImageId}.png`
    : null;
  const catColor = CATEGORY_BY_SLUG[song.category]?.color ?? "#888";
  const diffs = getDisplayedDifficulties(song, useChartConstant, {
    difficulty,
    type,
    region,
    minLevel,
    maxLevel,
    minInternalLevel,
    maxInternalLevel,
  });

  // Get utage chips when filtering by utage type
  const utageChips = type === "utage" ? getUtageDisplayChips(song, useChartConstant) : [];

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!song.slug) return;
    if (
      !onSelect ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onSelect(song, event.currentTarget);
  };

  return (
    <Link
      to="/songs/$slug"
      params={{ slug: song.slug }}
      search={currentSearch}
      resetScroll={false}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
      style={{ borderColor: `color-mix(in oklch, ${catColor} 25%, transparent)` }}
      onClick={handleClick}
    >
      {/* Category accent strip */}
      <div className="h-0.5" style={{ backgroundColor: catColor }} />

      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={song.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <Music className="h-6 w-6 text-muted-foreground" />
          )}
          {song.isNew && (
            <span className="absolute -right-0.5 -top-0.5 rounded-bl-md bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-primary-foreground">
              New
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="m-0 truncate text-sm font-bold leading-tight text-card-foreground">
              {song.title}
            </h3>
            <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{song.artist}</p>
          </div>

          {/* Difficulty chips + version */}
          <div className="mt-1.5 flex items-start gap-1">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {diffs.map((d) => (
                <span
                  key={d.difficulty}
                  className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1 py-[1px] text-[10px] font-bold leading-tight text-white"
                  style={{ backgroundColor: d.color }}
                  title={d.difficulty}
                >
                  {d.level}
                </span>
              ))}
              {/* Utage chips - one per unique difficulty */}
              {utageChips.map((chip) => (
                <span
                  key={chip.difficulty}
                  className={[
                    "inline-flex min-w-[1.75rem] items-center justify-center rounded px-1 py-[1px] text-[10px] font-bold leading-tight text-white",
                    chip.isUnavailable ? "opacity-40 line-through" : "",
                  ].join(" ")}
                  style={{ backgroundColor: chip.color }}
                  title={
                    chip.isUnavailable
                      ? `${chip.difficulty} (no longer available)`
                      : chip.difficulty
                  }
                >
                  {chip.text}
                </span>
              ))}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {VERSION_BY_SLUG[song.version]?.abbr ?? song.version}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export function SongCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="h-0.5 bg-muted" />
      <div className="flex gap-3 p-3">
        <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-md bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="h-[18px] w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-[14px] w-1/2 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[18px] w-7 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
