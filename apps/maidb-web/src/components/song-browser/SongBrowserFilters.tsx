import { ChevronDown, ChevronUp, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { useSongBrowser } from "./SongBrowser";

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

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

  const toggleChartConstant = () => {
    const next = !useChartConstant;
    setFilter("useChartConstant", next || undefined);
    if (next) {
      setFilter("minLevel", undefined);
      setFilter("maxLevel", undefined);
    } else {
      setFilter("minInternalLevel", undefined);
      setFilter("maxInternalLevel", undefined);
    }
  };

  // Deduplicated integer levels from internal level values for the regular level stepper
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
        <div className="mt-2 grid gap-x-4 gap-y-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <FilterField
            label={
              <span className="flex items-center gap-2">
                {useChartConstant ? "Internal Level" : "Level Range"}
                <button
                  type="button"
                  onClick={toggleChartConstant}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none transition-colors ${
                    useChartConstant
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chart Constant
                </button>
              </span>
            }
          >
            {useChartConstant ? (
              <StepperRange
                values={filterOptions.internalLevelRange.values}
                minValue={search.minInternalLevel}
                maxValue={search.maxInternalLevel}
                onMinChange={(v) => setFilter("minInternalLevel", v)}
                onMaxChange={(v) => setFilter("maxInternalLevel", v)}
                formatValue={(v) => v.toFixed(1)}
              />
            ) : (
              <StepperRange
                values={integerLevels}
                minValue={search.minLevel}
                maxValue={search.maxLevel}
                onMinChange={(v) => setFilter("minLevel", v)}
                onMaxChange={(v) => setFilter("maxLevel", v)}
                formatValue={(v) => String(v)}
              />
            )}
          </FilterField>

          <FilterField label="BPM Range">
            <StepperRange
              values={filterOptions.bpmRange.values}
              minValue={search.minBpm}
              maxValue={search.maxBpm}
              onMinChange={(v) => setFilter("minBpm", v)}
              onMaxChange={(v) => setFilter("maxBpm", v)}
              formatValue={(v) => String(v)}
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
      )}
    </>
  );
}

// -- Stepper Range Component --------------------------------------------------

function StepperRange({
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
  const stepMin = useCallback(
    (direction: 1 | -1) => {
      if (minValue == null) {
        onMinChange(direction === 1 ? values[0] : values[values.length - 1]);
        return;
      }
      const currentIdx = values.indexOf(minValue);
      const nextIdx = currentIdx + direction;
      if (nextIdx < 0 || nextIdx >= values.length) {
        onMinChange(undefined);
        return;
      }
      onMinChange(values[nextIdx]);
    },
    [minValue, values, onMinChange],
  );

  const stepMax = useCallback(
    (direction: 1 | -1) => {
      if (maxValue == null) {
        onMaxChange(direction === 1 ? values[0] : values[values.length - 1]);
        return;
      }
      const currentIdx = values.indexOf(maxValue);
      const nextIdx = currentIdx + direction;
      if (nextIdx < 0 || nextIdx >= values.length) {
        onMaxChange(undefined);
        return;
      }
      onMaxChange(values[nextIdx]);
    },
    [maxValue, values, onMaxChange],
  );

  return (
    <div className="flex gap-2">
      <StepperInput
        value={minValue}
        onStep={stepMin}
        onClear={() => onMinChange(undefined)}
        formatValue={formatValue}
        placeholder="Min"
      />
      <StepperInput
        value={maxValue}
        onStep={stepMax}
        onClear={() => onMaxChange(undefined)}
        formatValue={formatValue}
        placeholder="Max"
      />
    </div>
  );
}

function StepperInput({
  value,
  onStep,
  onClear,
  formatValue,
  placeholder,
}: {
  value: number | undefined;
  onStep: (direction: 1 | -1) => void;
  onClear: () => void;
  formatValue: (value: number) => string;
  placeholder: string;
}) {
  return (
    <div className="flex h-9 w-full items-center rounded-md border bg-background">
      <button
        type="button"
        onClick={() => onStep(-1)}
        className="flex h-full items-center px-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Minus className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={value != null ? onClear : undefined}
        className="min-w-0 flex-1 text-center text-sm tabular-nums text-foreground"
        title={value != null ? "Click to clear" : undefined}
      >
        {value != null ? (
          formatValue(value)
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onStep(1)}
        className="flex h-full items-center px-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
      </button>
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
