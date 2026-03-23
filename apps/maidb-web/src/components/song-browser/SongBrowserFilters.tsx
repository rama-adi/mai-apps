import { REGION_LABELS } from "maidb-data";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSongBrowser } from "./SongBrowser";

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export function SongBrowserFilters() {
  const { activeFilterCount, filterOptions, search, setFilter, totalCount, isLoading } =
    useSongBrowser();
  const [isOpen, setIsOpen] = useState(false);

  if (!filterOptions) return null;

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
    setFilter("isNew", undefined);
  };

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
              {filterOptions.categories.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              {filterOptions.versions.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              {filterOptions.difficulties.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
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
              {filterOptions.types.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Level Range">
            <div className="flex gap-2">
              <input
                type="number"
                value={search.minLevel ?? ""}
                onChange={(event) =>
                  setFilter("minLevel", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="Min"
                step="0.1"
                className={inputClass}
              />
              <input
                type="number"
                value={search.maxLevel ?? ""}
                onChange={(event) =>
                  setFilter("maxLevel", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="Max"
                step="0.1"
                className={inputClass}
              />
            </div>
          </FilterField>

          <FilterField label="BPM Range">
            <div className="flex gap-2">
              <input
                type="number"
                value={search.minBpm ?? ""}
                onChange={(event) =>
                  setFilter("minBpm", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="Min"
                className={inputClass}
              />
              <input
                type="number"
                value={search.maxBpm ?? ""}
                onChange={(event) =>
                  setFilter("maxBpm", event.target.value ? Number(event.target.value) : undefined)
                }
                placeholder="Max"
                className={inputClass}
              />
            </div>
          </FilterField>

          <FilterField label="Region">
            <select
              value={search.region ?? ""}
              onChange={(event) => setFilter("region", event.target.value || undefined)}
              className={selectClass}
            >
              <option value="">All</option>
              {(Object.entries(REGION_LABELS) as [string, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              value={search.isNew == null ? "" : search.isNew ? "true" : "false"}
              onChange={(event) => {
                const value = event.target.value;
                setFilter("isNew", value === "" ? undefined : value === "true");
              }}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="true">New only</option>
              <option value="false">Not new</option>
            </select>
          </FilterField>
        </div>
      )}
    </>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
