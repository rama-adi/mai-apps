import { env } from "cloudflare:workers";
import type { OpenSeoData, OpenSeoEntry } from "maidb-data";

type LazyJsonModule<T> = T & { default?: T };

function unwrapLazyJsonModule<T>(mod: LazyJsonModule<T>): T {
  return (typeof mod === "object" && mod != null && "default" in mod ? mod.default : mod) as T;
}

const loadVersionsJson = async (): Promise<OpenSeoData> =>
  unwrapLazyJsonModule(
    (await import("maidb-data/data/openseo/versions.json")) as LazyJsonModule<OpenSeoData>,
  );

const loadCategoriesJson = async (): Promise<OpenSeoData> =>
  unwrapLazyJsonModule(
    (await import("maidb-data/data/openseo/categories.json")) as LazyJsonModule<OpenSeoData>,
  );

const VERSIONS_OBJECT_KEY = "data/openseo/versions.json";
const CATEGORIES_OBJECT_KEY = "data/openseo/categories.json";

const VERSIONS_CACHE_KEY = "data/openseo/versions.json";
const CATEGORIES_CACHE_KEY = "data/openseo/categories.json";

const JSON_CACHE_TTL_SECONDS = 60 * 60;

type JsonSource = "kv" | "r2" | "local";

type CachedJsonResult<T> = {
  data: T;
  source: JsonSource;
};

async function loadCachedJsonText<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
): Promise<CachedJsonResult<T>> {
  const cachedText = await env.MAIAPP_SONGS_CACHE?.get(cacheKey, "text");
  if (cachedText != null) {
    return { data: JSON.parse(cachedText) as T, source: "kv" };
  }

  const r2Object = await env.SONG_DATA_BUCKET?.get(objectKey);
  if (r2Object != null) {
    const text = await r2Object.text();
    if (env.MAIAPP_SONGS_CACHE) {
      await env.MAIAPP_SONGS_CACHE.put(cacheKey, text, {
        expirationTtl: JSON_CACHE_TTL_SECONDS,
      });
    }
    return { data: JSON.parse(text) as T, source: "r2" };
  }

  return { data: await loadLocal(), source: "local" };
}

function createCachedJsonResource<T>(
  cacheKey: string,
  objectKey: string,
  loadLocal: () => Promise<T>,
) {
  let cachedResultPromise: Promise<CachedJsonResult<T>> | null = null;

  return async () => {
    if (!cachedResultPromise) {
      cachedResultPromise = loadCachedJsonText(cacheKey, objectKey, loadLocal).catch((error) => {
        cachedResultPromise = null;
        throw error;
      });
    }

    return cachedResultPromise;
  };
}

const loadVersionsResource = createCachedJsonResource(
  VERSIONS_CACHE_KEY,
  VERSIONS_OBJECT_KEY,
  loadVersionsJson,
);

const loadCategoriesResource = createCachedJsonResource(
  CATEGORIES_CACHE_KEY,
  CATEGORIES_OBJECT_KEY,
  loadCategoriesJson,
);

type OpenSeoIndex = {
  bySlug: Map<string, OpenSeoEntry>;
  entries: OpenSeoEntry[];
};

function buildIndex(entries: OpenSeoEntry[]): OpenSeoIndex {
  const bySlug = new Map<string, OpenSeoEntry>();
  for (const entry of entries) {
    bySlug.set(entry.slug, entry);
  }
  return { bySlug, entries };
}

let versionIndexPromise: Promise<OpenSeoIndex> | null = null;
let categoryIndexPromise: Promise<OpenSeoIndex> | null = null;

async function getVersionIndex(): Promise<OpenSeoIndex> {
  if (!versionIndexPromise) {
    versionIndexPromise = loadVersionsResource()
      .then((result) => buildIndex(result.data))
      .catch((error) => {
        versionIndexPromise = null;
        throw error;
      });
  }
  return versionIndexPromise;
}

async function getCategoryIndex(): Promise<OpenSeoIndex> {
  if (!categoryIndexPromise) {
    categoryIndexPromise = loadCategoriesResource()
      .then((result) => buildIndex(result.data))
      .catch((error) => {
        categoryIndexPromise = null;
        throw error;
      });
  }
  return categoryIndexPromise;
}

export async function getOpenSeoVersionBySlug(slug: string): Promise<OpenSeoEntry | null> {
  const index = await getVersionIndex();
  return index.bySlug.get(slug) ?? null;
}

export async function getOpenSeoCategoryBySlug(slug: string): Promise<OpenSeoEntry | null> {
  const index = await getCategoryIndex();
  return index.bySlug.get(slug) ?? null;
}

export async function getAllOpenSeoVersions(): Promise<OpenSeoEntry[]> {
  const index = await getVersionIndex();
  return index.entries;
}

export async function getAllOpenSeoCategories(): Promise<OpenSeoEntry[]> {
  const index = await getCategoryIndex();
  return index.entries;
}
