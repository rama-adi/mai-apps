import { createFileRoute, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import {
  CATEGORY_BY_SLUG,
  VERSIONS,
  VERSION_BY_SLUG,
  type MaiDbSong,
  type Metadata,
  type OpenSeoEntry,
} from "maidb-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SongCard, SongCardSkeleton } from "../../../../components/SongCard";
import { SongBrowser } from "../../../../components/song-browser/SongBrowser";
import { SongBrowserResults } from "../../../../components/song-browser/SongBrowserResults";
import { getCategoryPageData } from "../../../-server/category";

type VersionGroup = {
  key: string;
  label: string;
  songs: MaiDbSong[];
};

export const Route = createFileRoute("/(song-browser-category)/category/$slug")({
  head: ({ loaderData, params }) => {
    const data = loaderData as
      | {
          songs: MaiDbSong[];
          category: Metadata["categories"][number] | null;
          openSeo: OpenSeoEntry | null;
        }
      | undefined;
    const category = data?.category;
    const displayName =
      category?.category ?? CATEGORY_BY_SLUG[params.slug]?.category ?? params.slug;

    return {
      meta: [
        { title: `${displayName} - MaiDB` },
        {
          name: "description",
          content: `Songs in the ${displayName} category.`,
        },
      ],
    };
  },
  loader: async ({ params }) => getCategoryPageData({ data: { slug: params.slug } }),
  component: CategoryPage,
});

function CategoryPage() {
  const {
    songs: loaderSongs,
    category,
    openSeo,
  } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    category: Metadata["categories"][number] | null;
    openSeo: OpenSeoEntry | null;
  };
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/category/$slug" });
  const router = useRouter();
  const displayName = category?.category ?? CATEGORY_BY_SLUG[slug]?.category ?? slug;
  const accent = category?.color ?? CATEGORY_BY_SLUG[slug]?.color ?? "#3583fe";

  const openSongModal = (song: MaiDbSong) => {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : `/category/${slug}`;
    void navigate({
      to: "/category/$slug/modal/$songSlug",
      params: { slug, songSlug: song.slug },
      search: { from },
      resetScroll: false,
      viewTransition: true,
      mask: {
        to: "/songs/$slug",
        params: { slug: song.slug },
        unmaskOnReload: true,
      },
    });
  };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklch, ${accent} 12%, transparent), transparent)`,
        }}
      />
      <main
        className="relative z-0 mx-auto w-full max-w-3xl px-4 pb-16 pt-6"
        data-song-browser-surface=""
      >
        <button
          type="button"
          onClick={() => router.history.back()}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <header className="mb-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{ color: accent }}
          >
            Category
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {displayName}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/songs",
                  search: { category: slug },
                })
              }
              className="group inline-flex cursor-pointer items-center gap-1 font-semibold underline decoration-dotted underline-offset-4 transition-colors hover:decoration-solid"
              style={{ color: accent }}
            >
              Filter based on this
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </p>
        </header>

        {openSeo?.content?.trim() ? (
          <article className="mb-12 text-justify text-base leading-relaxed text-foreground/90 hyphens-auto">
            <p className="m-0">
              {openSeo.content
                .replace(/\s+$/, "")
                .split("\n")
                .map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
            </p>
          </article>
        ) : null}

        <SongBrowser
          initialSongs={loaderSongs}
          paginationMode="all"
          search={slug === "utage" ? { type: "utage" } : undefined}
          resolveHydratedSongs={(all) => all.filter((song) => song.category === slug)}
        >
          <SongBrowserResults>
            {({ isLoading, songs, totalCount }) => {
              const groups = songs ? groupSongsByVersion(songs) : [];

              return (
                <section>
                  <div className="mb-6 flex items-baseline justify-between gap-3">
                    <h2 className="m-0 text-xl font-black tracking-tight text-foreground">Songs</h2>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {isLoading ? "Loading..." : `${totalCount ?? 0} total`}
                    </span>
                  </div>

                  {isLoading && (
                    <div className="space-y-8">
                      {Array.from({ length: 2 }).map((_, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-3">
                          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                          <div className="grid gap-3 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((__, cardIndex) => (
                              <SongCardSkeleton key={cardIndex} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && (
                    <div className="space-y-10">
                      {groups.map((group) => (
                        <div key={group.key}>
                          <h3
                            className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                            style={{
                              borderLeft: `2px solid ${accent}`,
                              paddingLeft: "0.625rem",
                            }}
                          >
                            {group.label}
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {group.songs.map((song) => (
                              <SongCard key={song.songId} song={song} onSelect={openSongModal} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }}
          </SongBrowserResults>
        </SongBrowser>

        <Outlet />
      </main>
    </>
  );
}

const UNKNOWN_VERSION_LABEL = "Unknown version";

const VERSION_ORDER_INDEX: Record<string, number> = Object.fromEntries(
  VERSIONS.map((v, i) => [v.slug, i]),
);

function groupSongsByVersion(songs: MaiDbSong[]): VersionGroup[] {
  const groups = new Map<string, MaiDbSong[]>();

  for (const song of songs) {
    const key = song.version || UNKNOWN_VERSION_LABEL;
    const existing = groups.get(key);
    if (existing) {
      existing.push(song);
    } else {
      groups.set(key, [song]);
    }
  }

  const keys = Array.from(groups.keys()).sort((a, b) => {
    const ai = VERSION_ORDER_INDEX[a] ?? -1;
    const bi = VERSION_ORDER_INDEX[b] ?? -1;
    return bi - ai;
  });

  return keys.map((key) => ({
    key,
    label: VERSION_BY_SLUG[key]?.version ?? key,
    songs: groups.get(key) ?? [],
  }));
}
