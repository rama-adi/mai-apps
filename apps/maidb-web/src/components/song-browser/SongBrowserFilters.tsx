import { Toggle } from "@packages/ui/components/ui/toggle";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSongBrowser } from "./SongBrowser";

const selectClass =
  "h-8 w-full rounded-md border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export function SongBrowserFilters() {
  const { activeFilterCount, filterOptions, search, setFilter, totalCount, isLoading } =
    useSongBrowser();
  const [isOpen, setIsOpen] = useState(false);

  if (!filterOptions) return null;

  const useChartConstant = search.useChartConstant ?? false;

  const clearFilters = () => {
    setFilter("category", undefined);
    setFilter("version", undefined);
    setFilter("difficulty", undefined);
    setFilter("type", undefined);
    setFilter("region", undefined);
    setFilter("minBpm", undefined);
    setFilter("maxBpm", undefined);
    setFilter("minLevel", undefined);
    setFilter("maxLevel", undefined);
    setFilter("minInternalLevel", undefined);
    setFilter("maxInternalLevel", undefined);
    setFilter("useChartConstant", undefined);
    setFilter("isNew", undefined);
  };

  const toggleChartConstant = (pressed: boolean) => {
    setFilter("useChartConstant", pressed || undefined);
    if (pressed) {
      setFilter("minLevel", undefined);
      setFilter("maxLevel", undefined);
    } else {
      setFilter("minInternalLevel", undefined);
      setFilter("maxInternalLevel", undefined);
    }
  };

  const integerLevels = filterOptions.internalLevelRange.values
    .map((v) => Math.floor(v))
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {isLoading
            ? "Loading..."
            : totalCount != null
              ? `${totalCount} song${totalCount !== 1 ? "s" : ""}`
              : ""}
        </span>
      </div>

      {isOpen && (
        <div className="mt-2 space-y-3 rounded-lg border bg-card p-3">
          {/* Dropdowns row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Category">
              <select
                value={search.category ?? ""}
                onChange={(event) => setFilter("category", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.categories.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Version">
              <select
                value={search.version ?? ""}
                onChange={(event) => setFilter("version", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.versions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Difficulty">
              <select
                value={search.difficulty ?? ""}
                onChange={(event) => setFilter("difficulty", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.difficulties.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Type">
              <select
                value={search.type ?? ""}
                onChange={(event) => setFilter("type", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.types.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          {/* Level + BPM row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField
              label={
                <span className="flex items-center gap-2">
                  {useChartConstant ? "Chart Constant" : "Level"}
                  <Toggle
                    size="sm"
                    variant="outline"
                    pressed={useChartConstant}
                    onPressedChange={toggleChartConstant}
                    className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider"
                  >
                    Constant
                  </Toggle>
                </span>
              }
            >
              {useChartConstant ? (
                <MinMaxSelect
                  values={filterOptions.internalLevelRange.values}
                  minValue={search.minInternalLevel}
                  maxValue={search.maxInternalLevel}
                  onMinChange={(v) => setFilter("minInternalLevel", v)}
                  onMaxChange={(v) => setFilter("maxInternalLevel", v)}
                  formatValue={(v) => v.toFixed(1)}
                />
              ) : (
                <MinMaxSelect
                  values={integerLevels}
                  minValue={search.minLevel}
                  maxValue={search.maxLevel}
                  onMinChange={(v) => setFilter("minLevel", v)}
                  onMaxChange={(v) => setFilter("maxLevel", v)}
                  formatValue={(v) => String(v)}
                />
              )}
            </FilterField>

            <FilterField label="BPM">
              <MinMaxInput
                min={filterOptions.bpmRange.min}
                max={filterOptions.bpmRange.max}
                minValue={search.minBpm}
                maxValue={search.maxBpm}
                onMinChange={(v) => setFilter("minBpm", v)}
                onMaxChange={(v) => setFilter("maxBpm", v)}
              />
            </FilterField>

            <FilterField label="Region">
              <select
                value={search.region ?? ""}
                onChange={(event) => setFilter("region", event.target.value || undefined)}
                className={selectClass}
              >
                <option value="">All</option>
                {filterOptions.regions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          {/* Status row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField label="Status">
              <select
                value={search.isNew == null ? "" : search.isNew ? "new" : "not-new"}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilter("isNew", value === "" ? undefined : value === "new");
                }}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="new">New only</option>
                <option value="not-new">Not new</option>
              </select>
            </FilterField>
          </div>
        </div>
      )}
    </>
  );
}

// -- Min/Max Select Dropdowns -------------------------------------------------

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
    <div className="flex items-center gap-1.5">
      <select
        value={minValue != null ? String(minValue) : ""}
        onChange={(event) => {
          const v = event.target.value;
          onMinChange(v ? Number(v) : undefined);
        }}
        className={selectClass}
      >
        <option value="">Min</option>
        {values.map((v) => (
          <option key={v} value={String(v)}>
            {formatValue(v)}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">–</span>
      <select
        value={maxValue != null ? String(maxValue) : ""}
        onChange={(event) => {
          const v = event.target.value;
          onMaxChange(v ? Number(v) : undefined);
        }}
        className={selectClass}
      >
        <option value="">Max</option>
        {values.map((v) => (
          <option key={v} value={String(v)}>
            {formatValue(v)}
          </option>
        ))}
      </select>
    </div>
  );
}

// -- Min/Max Numeric Input ----------------------------------------------------

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
  const inputClass =
    "h-8 w-full rounded-md border bg-background px-2.5 text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        placeholder={`Min (${min})`}
        min={min}
        max={max}
        value={minValue ?? ""}
        onChange={(event) => {
          const v = event.target.value;
          onMinChange(v ? Number(v) : undefined);
        }}
        className={inputClass}
      />
      <span className="text-xs text-muted-foreground">–</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder={`Max (${max})`}
        min={min}
        max={max}
        value={maxValue ?? ""}
        onChange={(event) => {
          const v = event.target.value;
          onMaxChange(v ? Number(v) : undefined);
        }}
        className={inputClass}
      />
    </div>
  );
}

// -- FilterField helper -------------------------------------------------------

function FilterField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
