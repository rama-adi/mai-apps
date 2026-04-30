import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  searchSongsByKeyword,
  VERSION_BY_SLUG,
  VERSIONS,
  type MaiDbSong,
} from "maidb-data";

export type OmnisearchSongResult = {
  type: "song";
  id: string;
  title: string;
  description: string;
  song: MaiDbSong;
};

export type OmnisearchVersionResult = {
  type: "version";
  id: string;
  title: string;
  description: string;
  slug: string;
};

export type OmnisearchCategoryResult = {
  type: "category";
  id: string;
  title: string;
  description: string;
  slug: string;
  color: string;
};

export type OmnisearchResult =
  | OmnisearchSongResult
  | OmnisearchVersionResult
  | OmnisearchCategoryResult;

export type OmnisearchResults = {
  songs: OmnisearchSongResult[];
  versions: OmnisearchVersionResult[];
  categories: OmnisearchCategoryResult[];
};

function cleanSlugName(slug: string): string {
  return slug
    .replace(/^dx-/, "")
    .split("-")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龯]+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

function rankText(query: string, candidates: string[]): number {
  const normalizedQuery = normalize(query);
  const compactQuery = compact(query);
  if (!normalizedQuery) return 1;

  let best = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    const compactCandidate = compact(candidate);
    if (!normalizedCandidate) continue;

    if (normalizedCandidate === normalizedQuery || compactCandidate === compactQuery) {
      best = Math.max(best, 100);
    } else if (
      normalizedCandidate.startsWith(normalizedQuery) ||
      compactCandidate.startsWith(compactQuery)
    ) {
      best = Math.max(best, 80);
    } else if (
      normalizedCandidate.includes(normalizedQuery) ||
      compactCandidate.includes(compactQuery)
    ) {
      best = Math.max(best, 60);
    } else {
      const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
      const matchedParts = queryParts.filter((part) => normalizedCandidate.includes(part)).length;
      if (matchedParts > 0) {
        best = Math.max(best, 30 + (matchedParts / queryParts.length) * 20);
      }
    }
  }

  return best;
}

function hasAvailableSheet(song: MaiDbSong): boolean {
  return song.sheets.some((s) => s.level !== "*" && s.levelValue > 0);
}

export function searchOmnisearchResults(
  songs: MaiDbSong[] | null,
  query: string,
): OmnisearchResults {
  const trimmedQuery = query.trim();
  const availableSongs = songs ? songs.filter(hasAvailableSheet) : null;
  const songMatches = trimmedQuery
    ? availableSongs
      ? searchSongsByKeyword(availableSongs, trimmedQuery)
      : []
    : availableSongs
      ? [...availableSongs]
          .sort((a, b) => {
            if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
            return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
          })
          .slice(0, 8)
      : [];

  const songResults = songMatches.slice(0, 8).map<OmnisearchSongResult>((song) => {
    const versionName = VERSION_BY_SLUG[song.version]?.version ?? cleanSlugName(song.version);
    const categoryName = CATEGORY_BY_SLUG[song.category]?.category ?? cleanSlugName(song.category);
    return {
      type: "song",
      id: `song:${song.slug}`,
      title: song.title,
      description: `${song.artist} · ${versionName} · ${categoryName}`,
      song,
    };
  });

  const versions = VERSIONS.map((version) => {
    const fallbackName = cleanSlugName(version.slug);
    return {
      item: version,
      score: rankText(trimmedQuery, [version.version, version.abbr, version.slug, fallbackName]),
      fallbackName,
    };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.releaseDate.localeCompare(a.item.releaseDate))
    .slice(0, 6)
    .map<OmnisearchVersionResult>(({ item, fallbackName }) => ({
      type: "version",
      id: `version:${item.slug}`,
      title: item.version || fallbackName,
      description: item.abbr,
      slug: item.slug,
    }));

  const categories = CATEGORIES.map((category) => {
    const fallbackName = cleanSlugName(category.slug);
    return {
      item: category,
      score: rankText(trimmedQuery, [category.category, category.slug, fallbackName]),
      fallbackName,
    };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.category.localeCompare(b.item.category))
    .slice(0, 6)
    .map<OmnisearchCategoryResult>(({ item, fallbackName }) => ({
      type: "category",
      id: `category:${item.slug}`,
      title: item.category || fallbackName,
      description: "Song category",
      slug: item.slug,
      color: item.color,
    }));

  return {
    songs: songResults,
    versions,
    categories,
  };
}
