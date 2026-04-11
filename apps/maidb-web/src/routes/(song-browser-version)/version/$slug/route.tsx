import { createFileRoute, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { VERSION_BY_SLUG, type MaiDbSong, type Metadata } from "maidb-data";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { SongCard, SongCardSkeleton } from "../../../../components/SongCard";
import { SongBrowser } from "../../../../components/song-browser/SongBrowser";
import { SongBrowserResults } from "../../../../components/song-browser/SongBrowserResults";
import { getVersionPageData } from "../../../-server/version";

type WeekGroup = {
  key: string;
  label: string;
  songs: MaiDbSong[];
};

export const Route = createFileRoute("/(song-browser-version)/version/$slug")({
  head: ({ loaderData, params }) => {
    const data = loaderData as
      | { songs: MaiDbSong[]; version: Metadata["versions"][number] | null }
      | undefined;
    const version = data?.version;
    const displayName = version?.version ?? VERSION_BY_SLUG[params.slug]?.version ?? params.slug;

    return {
      meta: [
        { title: `${displayName} Timeline - MaiDB` },
        {
          name: "description",
          content: `Browse ${displayName} songs grouped by release week.`,
        },
      ],
    };
  },
  loader: async ({ params }) => getVersionPageData({ data: { slug: params.slug } }),
  component: VersionPage,
});

function VersionPage() {
  const { songs: loaderSongs, version } = Route.useLoaderData() as {
    songs: MaiDbSong[];
    version: Metadata["versions"][number] | null;
  };
  const { slug } = Route.useParams();
  const navigate = useNavigate({ from: "/version/$slug" });
  const router = useRouter();
  const displayName = version?.version ?? VERSION_BY_SLUG[slug]?.version ?? slug;
  const displayAbbr = version?.abbr ?? VERSION_BY_SLUG[slug]?.abbr ?? slug;

  const openSongModal = (song: MaiDbSong) => {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : `/version/${slug}`;
    void navigate({
      to: "/version/$slug/modal/$songSlug",
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
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6" data-song-browser-surface="">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              Version Timeline
            </p>
            <h1 className="m-0 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              All songs from {displayAbbr}, grouped by their weekly release date.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void navigate({
                to: "/songs",
                search: { version: slug },
              })
            }
            className="inline-flex items-center gap-2 self-start rounded-lg border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Open standard browser
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <SongBrowser initialSongs={loaderSongs} paginationMode="all">
        <SongBrowserResults>
          {({ isLoading, songs, totalCount }) => {
            const weeks = songs ? groupSongsByWeek(songs) : [];

            return (
              <section className="mt-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase tracking-wide text-foreground">
                    Weekly Drops
                  </h2>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {isLoading ? "Loading..." : `${totalCount ?? 0} songs`}
                  </span>
                </div>

                {isLoading &&
                  Array.from({ length: 2 }).map((_, sectionIndex) => (
                    <section key={sectionIndex} className="space-y-3">
                      <div className="h-5 w-56 animate-pulse rounded bg-muted" />
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((__, cardIndex) => (
                          <SongCardSkeleton key={cardIndex} />
                        ))}
                      </div>
                    </section>
                  ))}

                {!isLoading &&
                  weeks.map((week) => (
                    <section key={week.key} className="rounded-2xl border bg-card/60 p-5 sm:p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="m-0 text-base font-black uppercase tracking-wide text-foreground">
                            {week.label}
                          </h3>
                          <p className="m-0 text-xs text-muted-foreground">
                            {week.songs.length} song{week.songs.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {week.songs.map((song) => (
                          <SongCard key={song.songId} song={song} onSelect={openSongModal} />
                        ))}
                      </div>
                    </section>
                  ))}
              </section>
            );
          }}
        </SongBrowserResults>
      </SongBrowser>
      <Outlet />
    </main>
  );
}

function groupSongsByWeek(songs: MaiDbSong[]): WeekGroup[] {
  const groups = new Map<string, MaiDbSong[]>();

  for (const song of songs) {
    const label = getWeekLabel(song.releaseDate);
    const existing = groups.get(label) ?? [];
    existing.push(song);
    groups.set(label, existing);
  }

  return [...groups.entries()].map(([label, groupedSongs]) => ({
    key: label,
    label,
    songs: groupedSongs,
  }));
}

function getWeekLabel(input: string): string {
  const date = new Date(`${input}T00:00:00Z`);
  const day = date.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return `${formatWeekDate(start)} - ${formatWeekDate(end)}`;
}

function formatWeekDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
