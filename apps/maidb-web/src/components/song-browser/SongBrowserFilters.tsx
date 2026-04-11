import { ChevronDown, ChevronUp, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@packages/ui/components/ui/sheet";
import { useSongBrowser } from "./SongBrowser";
import type { SongBrowserSearchParams } from "./song-browser.types";

const selectClass =
  "h-8 w-full rounded-md border border-border/60 bg-background px-2.5 text-sm text-foreground transition-colors outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

const inputClass =
  "h-8 w-full rounded-md border border-border/60 bg-background px-2.5 text-sm tabular-nums text-foreground transition-colors outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

type ActiveFilterChip = {
  key: string;
  label: string;
  onClear: () => void;
  tone?: "accent" | "default";
};

export function SongBrowserFilters() {
  const {
    activeFilterCount,
    clearAllFilters,
    filterOptions,
    localFilters,
    search,
    setFilter,
    setFilters,
    totalCount,
    isLoading,
  } = useSongBrowser();

  // Helper to clear range filters in a single batch update
  const clearRangeFilter = useCallback(
    (
      minKey: "minBpm" | "minLevel" | "minInternalLevel",
      maxKey: "maxBpm" | "maxLevel" | "maxInternalLevel",
    ) => {
      setFilters({ [minKey]: undefined, [maxKey]: undefined } as Partial<SongBrowserSearchParams>);
    },
    [setFilters],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!filterOptions) return null;

  const useChartConstant = search.useChartConstant ?? false;

  // Use localFilters for form values so UI updates immediately
  const formCategory = localFilters.category;
  const formVersion = localFilters.version;
  const formDifficulty = localFilters.difficulty;
  const formType = localFilters.type;
  const formRegion = localFilters.region;
  const formMinBpm = localFilters.minBpm;
  const formMaxBpm = localFilters.maxBpm;
  const formMinLevel = localFilters.minLevel;
  const formMaxLevel = localFilters.maxLevel;
  const formMinInternalLevel = localFilters.minInternalLevel;
  const formMaxInternalLevel = localFilters.maxInternalLevel;
  const formIsNew = localFilters.isNew;

  // Track previous type for mode switch handling
  const prevTypeRef = useRef(formType);
  useEffect(() => {
    prevTypeRef.current = formType;
  }, [formType]);

  const toggleChartConstant = (on: boolean) => {
    setFilters({
      useChartConstant: on || undefined,
      minLevel: undefined,
      maxLevel: undefined,
      minInternalLevel: undefined,
      maxInternalLevel: undefined,
    });
  };

  const integerLevels = filterOptions.internalLevelRange.values
    .map((value) => Math.floor(value))
    .filter((value, index, values) => values.indexOf(value) === index);

  const activeFilters: ActiveFilterChip[] = [
    search.category
      ? {
          key: "category",
          label: `Category: ${getOptionLabel(filterOptions.categories, search.category)}`,
          onClear: () => setFilter("category", undefined),
        }
      : null,
    search.version
      ? {
          key: "version",
          label: `Version: ${getOptionLabel(filterOptions.versions, search.version)}`,
          onClear: () => setFilter("version", undefined),
        }
      : null,
    search.difficulty
      ? {
          key: "difficulty",
          label: `Difficulty: ${getOptionLabel(filterOptions.difficulties, search.difficulty)}`,
          onClear: () => setFilter("difficulty", undefined),
        }
      : null,
    search.type && search.type !== "utage"
      ? {
          key: "type",
          label: `Type: ${getOptionLabel(filterOptions.types, search.type)}`,
          onClear: () => setFilter("type", undefined),
        }
      : null,
    search.region
      ? {
          key: "region",
          label: `Region: ${getOptionLabel(filterOptions.regions, search.region)}`,
          onClear: () => setFilter("region", undefined),
        }
      : null,
    search.minBpm != null || search.maxBpm != null
      ? {
          key: "bpm",
          label: `BPM: ${formatRange(
            search.minBpm,
            search.maxBpm,
            filterOptions.bpmRange.min,
            filterOptions.bpmRange.max,
          )}`,
          onClear: () => clearRangeFilter("minBpm", "maxBpm"),
        }
      : null,
    search.minLevel != null || search.maxLevel != null
      ? {
          key: "level",
          label: `Level: ${formatRange(search.minLevel, search.maxLevel)}`,
          onClear: () => clearRangeFilter("minLevel", "maxLevel"),
        }
      : null,
    search.minInternalLevel != null || search.maxInternalLevel != null
      ? {
          key: "internalLevel",
          label: `Constant: ${formatRange(
            search.minInternalLevel,
            search.maxInternalLevel,
            undefined,
            undefined,
            (value) => value.toFixed(1),
          )}`,
          onClear: () => clearRangeFilter("minInternalLevel", "maxInternalLevel"),
        }
      : null,
    search.isNew != null
      ? {
          key: "isNew",
          label: search.isNew ? "New only" : "Existing only",
          onClear: () => setFilter("isNew", undefined),
        }
      : null,
    useChartConstant
      ? {
          key: "useChartConstant",
          label: "Chart constants",
          onClear: () => toggleChartConstant(false),
          tone: "accent",
        }
      : null,
  ].filter((value): value is ActiveFilterChip => value != null);

  const resultLabel = isLoading
    ? "Loading..."
    : totalCount != null
      ? `${totalCount} song${totalCount !== 1 ? "s" : ""}`
      : "";

  const filterContent = (
    <>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FilterField label="Category">
          <select
            value={formCategory}
            onChange={(event) => setFilter("category", event.target.value || undefined)}
            className={selectClass}
          >
            <option value="">All</option>
            {filterOptions.categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Version">
          <select
            value={formVersion}
            onChange={(event) => setFilter("version", event.target.value || undefined)}
            className={selectClass}
          >
            <option value="">All</option>
            {filterOptions.versions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Difficulty">
          <select
            value={formDifficulty}
            onChange={(event) => setFilter("difficulty", event.target.value || undefined)}
            className={selectClass}
          >
            <option value="">All</option>
            {filterOptions.difficulties
              .filter((option) => {
                const isUtageDifficulty =
                  option.value.startsWith("【") && option.value.endsWith("】");
                return formType === "utage" ? isUtageDifficulty : !isUtageDifficulty;
              })
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </FilterField>

        {/* Chart Type - hidden in utage mode since utage sheets don't have std/dx types */}
        {formType !== "utage" && (
          <FilterField label="Type">
            <select
              value={formType}
              onChange={(event) => setFilter("type", event.target.value || undefined)}
              className={selectClass}
            >
              <option value="">All</option>
              {filterOptions.types.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        )}

        <FilterField label="Region">
          <select
            value={formRegion}
            onChange={(event) => setFilter("region", event.target.value || undefined)}
            className={selectClass}
          >
            <option value="">All</option>
            {filterOptions.regions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-border/40" />

      {/* Mobile-only: Utage Toggle */}
      <div className="flex sm:hidden items-center justify-between px-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Show Utage Songs
        </span>
        <button
          type="button"
          onClick={() => {
            const turningOnUtage = formType !== "utage";

            if (turningOnUtage) {
              // Switching TO utage: set type and clear difficulty
              setFilters({
                type: "utage",
                difficulty: undefined,
              });
            } else {
              // Switching FROM utage: clear type and difficulty
              setFilters({
                type: undefined,
                difficulty: undefined,
              });
            }
          }}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            formType === "utage" ? "bg-primary" : "bg-muted",
          ].join(" ")}
          aria-pressed={formType === "utage"}
        >
          <span
            className={[
              "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
              formType === "utage" ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Level / Chart Constant */}
        <div>
          <div className="mb-1.5 flex h-6 items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {useChartConstant ? "Chart Constant" : "Level"}
            </span>
            <button
              type="button"
              onClick={() => toggleChartConstant(!useChartConstant)}
              className="relative inline-flex h-6 w-20 items-center rounded-md border-2 border-border bg-muted p-0.5 transition-colors duration-200"
            >
              <span
                className={[
                  "z-10 flex h-full w-1/2 items-center justify-center text-[10px] font-bold transition-colors",
                  !useChartConstant ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                Level
              </span>
              <span
                className={[
                  "z-10 flex h-full w-1/2 items-center justify-center text-[10px] font-bold transition-colors",
                  useChartConstant ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                Const
              </span>
              <span
                className={[
                  "absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-sm bg-background shadow-sm transition-transform duration-200",
                  useChartConstant ? "translate-x-[calc(100%+2px)]" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
          {useChartConstant ? (
            <MinMaxSelect
              values={filterOptions.internalLevelRange.values}
              minValue={formMinInternalLevel}
              maxValue={formMaxInternalLevel}
              onMinChange={(value) => setFilter("minInternalLevel", value)}
              onMaxChange={(value) => setFilter("maxInternalLevel", value)}
              formatValue={(value) => value.toFixed(1)}
            />
          ) : (
            <MinMaxSelect
              values={integerLevels}
              minValue={formMinLevel}
              maxValue={formMaxLevel}
              onMinChange={(value) => setFilter("minLevel", value)}
              onMaxChange={(value) => setFilter("maxLevel", value)}
              formatValue={(value) => String(value)}
            />
          )}
        </div>

        {/* BPM */}
        <div>
          <div className="mb-1.5 flex h-6 items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              BPM
            </span>
          </div>
          <MinMaxInput
            min={filterOptions.bpmRange.min}
            max={filterOptions.bpmRange.max}
            minValue={formMinBpm}
            maxValue={formMaxBpm}
            onMinChange={(value) => setFilter("minBpm", value)}
            onMaxChange={(value) => setFilter("maxBpm", value)}
          />
        </div>

        {/* Status */}
        <div>
          <div className="mb-1.5 flex h-6 items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
          </div>
          <div className="flex gap-1">
            <SegmentButton
              isActive={formIsNew == null}
              onClick={() => setFilter("isNew", undefined)}
            >
              All
            </SegmentButton>
            <SegmentButton
              isActive={formIsNew === true}
              onClick={() => setFilter("isNew", true)}
              icon={<Sparkles className="h-3 w-3" />}
            >
              New
            </SegmentButton>
            <SegmentButton isActive={formIsNew === false} onClick={() => setFilter("isNew", false)}>
              Existing
            </SegmentButton>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section className="mt-2">
      {/* Toolbar row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Desktop: Inline expand/collapse */}
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={[
            "hidden sm:inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            isOpen
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/70 bg-card text-foreground hover:border-primary/30 hover:text-primary",
          ].join(" ")}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 opacity-50" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          )}
        </button>

        {/* Normal/Utage Toggle */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2 py-1 pr-3">
          <span className="text-[11px] font-medium text-muted-foreground">Utage</span>
          <button
            type="button"
            onClick={() => {
              const turningOnUtage = formType !== "utage";

              if (turningOnUtage) {
                // Switching TO utage: set type and clear difficulty
                setFilters({
                  type: "utage",
                  difficulty: undefined,
                });
              } else {
                // Switching FROM utage: clear type and difficulty
                setFilters({
                  type: undefined,
                  difficulty: undefined,
                });
              }
            }}
            className={[
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              formType === "utage" ? "bg-primary" : "bg-muted",
            ].join(" ")}
            aria-pressed={formType === "utage"}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                formType === "utage" ? "translate-x-[18px]" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </div>

        {/* Mobile: Sheet trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={[
                "inline-flex sm:hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                activeFilterCount > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/70 bg-card text-foreground hover:border-primary/30 hover:text-primary",
              ].join(" ")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="px-4 pb-8 pt-2">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
            <SheetHeader className="px-0 pb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="max-h-[60dvh] overflow-y-auto pr-1">{filterContent}</div>
          </SheetContent>
        </Sheet>

        {/* Active filter chips inline */}
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={filter.onClear}
            className={[
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
              filter.tone === "accent"
                ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border/60 bg-card text-foreground hover:border-red-300 hover:text-red-500",
            ].join(" ")}
          >
            {filter.label}
            <X className="h-3 w-3 opacity-50" />
          </button>
        ))}

        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-500"
          >
            Clear all
          </button>
        )}

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{resultLabel}</span>
      </div>

      {/* Desktop: Expanded inline filter panel with smooth animation */}
      <div
        className={[
          "hidden sm:grid mt-2 rounded-xl border border-border/60 bg-card/80 overflow-hidden",
          "transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 border-transparent bg-transparent motion-reduce:grid-rows-[1fr] motion-reduce:opacity-100 motion-reduce:border-border/60 motion-reduce:bg-card/80",
        ].join(" ")}
      >
        <div className="min-h-0 p-3">{filterContent}</div>
      </div>
    </section>
  );
}

function MinMaxSelect({
  values,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  formatValue,
}: {
  values: number[];
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  formatValue: (value: number) => string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <select
        value={minValue != null ? String(minValue) : ""}
        onChange={(event) => {
          const value = event.target.value;
          onMinChange(value ? Number(value) : undefined);
        }}
        className={selectClass}
      >
        <option value="">Min</option>
        {values.map((value) => (
          <option key={value} value={String(value)}>
            {formatValue(value)}
          </option>
        ))}
      </select>
      <span className="text-[10px] font-semibold text-muted-foreground/60">—</span>
      <select
        value={maxValue != null ? String(maxValue) : ""}
        onChange={(event) => {
          const value = event.target.value;
          onMaxChange(value ? Number(value) : undefined);
        }}
        className={selectClass}
      >
        <option value="">Max</option>
        {values
          .filter((value) => minValue == null || value >= minValue)
          .map((value) => (
            <option key={value} value={String(value)}>
              {formatValue(value)}
            </option>
          ))}
      </select>
    </div>
  );
}

function MinMaxInput({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}) {
  // Local state for responsive typing - updates immediately
  const [localMin, setLocalMin] = useState(minValue ?? "");
  const [localMax, setLocalMax] = useState(maxValue ?? "");

  // Sync local state when external values change (e.g., from URL or clear all)
  useEffect(() => {
    setLocalMin(minValue ?? "");
  }, [minValue]);

  useEffect(() => {
    setLocalMax(maxValue ?? "");
  }, [maxValue]);

  // Debounce the actual filter updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      const parsedMin = localMin === "" ? undefined : Number(localMin);
      const parsedMax = localMax === "" ? undefined : Number(localMax);

      if (parsedMin !== minValue) {
        onMinChange(parsedMin);
      }
      if (parsedMax !== maxValue) {
        onMaxChange(parsedMax);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [localMin, localMax, minValue, maxValue, onMinChange, onMaxChange]);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        placeholder={`${min}`}
        min={min}
        max={max}
        value={localMin}
        onChange={(event) => setLocalMin(event.target.value)}
        className={inputClass}
      />
      <span className="text-[10px] font-semibold text-muted-foreground/60">—</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder={`${max}`}
        min={min}
        max={max}
        value={localMax}
        onChange={(event) => setLocalMax(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function FilterField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function SegmentButton({
  children,
  icon,
  isActive,
  onClick,
}: {
  children: ReactNode;
  icon?: ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
        isActive
          ? "border-primary/25 bg-primary text-primary-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function getOptionLabel(options: Array<{ label: string; value: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatRange(
  minValue: number | undefined,
  maxValue: number | undefined,
  fallbackMin?: number,
  fallbackMax?: number,
  formatValue: (value: number) => string = (value) => String(value),
) {
  const start = minValue ?? fallbackMin;
  const end = maxValue ?? fallbackMax;

  if (start != null && end != null) {
    return `${formatValue(start)}–${formatValue(end)}`;
  }

  if (start != null) {
    return `${formatValue(start)}+`;
  }

  if (end != null) {
    return `up to ${formatValue(end)}`;
  }

  return "Any";
}
