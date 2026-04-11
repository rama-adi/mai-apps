# MaiDB Web Song Data Architecture

Last updated: 2026-04-12

## Summary

`apps/maidb-web` uses a hybrid data model:

- SEO-critical pages render from route-local server loaders.
- The interactive `/songs` browser hydrates a client-side song catalog for filtering and keyword search.
- Cloudflare KV/R2 remains the delivery layer for published JSON artifacts.
- D1 is intentionally not the primary backing store for the current product shape.

This note exists so future work does not accidentally reintroduce the old coupling between every route and the full client song catalog.

## Why We Changed It

The old design mounted a global song provider at the root of the app. That meant:

- unrelated routes could still trigger full catalog client hydration
- song detail and modal pages depended on a global client cache as a fallback
- route behavior was harder to reason about in SSR/prerender mode
- the server loader layer mixed storage fallback, catalog scans, and route helpers in one place

This caused friction when trying to keep good SEO while also supporting a rich client-side browser.

## Architectural Decision

We chose to split responsibilities by route type instead of using one global song data path.

### 1. Route-local data is canonical for SEO pages

The following routes should render from their own loader data only:

- `/songs/$slug`
- `/version/$slug`
- song modal routes
- metadata-driven pages such as `/version`

These routes should not depend on a global client-side full catalog to function correctly.

### 2. The full client song catalog is only for the interactive browser

The browse route `/songs` is the only route that should own the full client-side catalog fetch.

That catalog exists for:

- multi-field client filtering
- keyword search
- fast browse interactions
- preserving a modular reusable song browser UI

It should not be treated as an app-wide dependency.

### 3. KV/R2 stays the source for published JSON artifacts

We kept the JSON artifact model because the current access pattern is still artifact-oriented:

- prerender/SSR wants stable published data
- the browser wants a client-searchable catalog payload
- most server lookups are simple catalog lookups, not relational queries

Moving to D1 now would add query/storage complexity without fixing the actual UX and route-boundary issues.

## What Was Refactored

### Client data ownership

Removed the old root-level provider:

- deleted `apps/maidb-web/src/lib/use-songs.tsx`
- removed provider usage from `apps/maidb-web/src/routes/__root.tsx`

Added a route-scoped catalog provider:

- `apps/maidb-web/src/lib/song-catalog.tsx`

Current intent:

- only `/songs` wraps with `SongCatalogProvider`
- `SongBrowser` can consume route-provided `initialSongs`
- `SongBrowser` optionally upgrades to the hydrated client catalog only when the route actually provides one

### Route behavior

Updated routes so they no longer rely on a global catalog fallback:

- `apps/maidb-web/src/routes/songs_.$slug.tsx`
- `apps/maidb-web/src/routes/(song-browser-home)/modal.$slug.tsx`
- `apps/maidb-web/src/routes/(song-browser-songs)/songs/modal.$slug.tsx`
- `apps/maidb-web/src/routes/(song-browser-version)/version/$slug/modal.$songSlug.tsx`

Updated `/songs` to own the client catalog explicitly:

- `apps/maidb-web/src/routes/(song-browser-songs)/songs/route.tsx`

Kept home/version surfaces modular by using `SongBrowser` with route-local `initialSongs` only:

- `apps/maidb-web/src/routes/(song-browser-home)/route.tsx`
- `apps/maidb-web/src/routes/(song-browser-version)/version/$slug/route.tsx`

### Server loader layer

Refactored `apps/maidb-web/src/lib/song-data.server.ts` to make runtime behavior explicit:

- added module-level cached JSON resources
- added a cached catalog index for `bySlug`, `byVersion`, filter metadata, and slugs
- avoided repeated full-catalog scans for common lookups
- kept KV/R2 fallback behavior intact

This improves correctness and reduces repeated work inside warm worker instances.

## Current Mental Model

Use this rule of thumb:

- If the page is primarily for SEO or direct entry, load exactly what that route needs on the server.
- If the page is an interactive browser/search surface, it may own a client catalog payload.
- Do not mount the full song catalog at the application root.

## How To Build Custom Song UI

If you want to build a new song-based surface, choose the data model first and then compose the UI around it.

### Pattern A: route-local song UI

Use this for:

- detail pages
- version pages
- featured sections
- SEO-first landing surfaces
- any page where the route loader already knows exactly which songs are needed

Approach:

- load the songs in the route loader
- pass them into UI as plain props or `initialSongs`
- do not wrap the route in `SongCatalogProvider`
- do not depend on `/songlist`

This is the default for correctness and SEO.

### Pattern B: interactive browser UI

Use this for:

- full catalog browsing
- multi-filter search
- keyword search across the whole dataset
- any surface where client-side refinement is the core interaction

Approach:

- wrap the route subtree in `SongCatalogProvider`
- pass route-local fallback data into `SongBrowser` as `initialSongs`
- let `SongBrowser` upgrade to the hydrated catalog when available

This is currently only intended for `/songs`.

### Recommended composition

When building your own song UI, keep the split explicit:

- route loader decides what the canonical server data is
- route decides whether a client catalog is needed
- visual components render songs; they should not decide where songs come from

In practice:

- use `SongBrowser` when you want filter/search state management
- use `SongBrowserGridView` or your own renderer when you want a different visual treatment
- use `SongBrowserResults` when you want custom layout but still want browser state from context
- render `SongCard` or a custom card directly when you do not need browser behaviors

### What To Avoid

- do not reintroduce a root-level full song provider
- do not make detail pages depend on the client catalog
- do not import route data from inside low-level presentational components
- do not make a reusable UI component silently fetch global catalog data on its own

## Why Not D1 Right Now

D1 may make sense later, but not as the default architecture today.

Reasons:

- current product needs are mostly artifact delivery plus route lookup
- the browser intentionally does client-side filtering and keyword search
- SEO pages are better served by predictable route-local server data
- the main pain point was route coupling and loader ergonomics, not the absence of SQL

D1 becomes worth revisiting if the product shifts toward:

- server-driven browse/search results
- SQL-backed pagination
- faceted search/counts computed on the server
- full-text search requirements best handled centrally
- frequent incremental row-level updates instead of published dataset artifacts

## Constraints We Intentionally Accepted

- `/songs` still hydrates a full client song catalog today
- detail pages still use the canonical song catalog on the server side
- KV/R2 artifact loading remains part of the deployment model

These are acceptable for now because the root-level coupling was the bigger correctness problem.

## Likely Next Step

The next cleanup should be introducing a smaller browser-specific search payload instead of using the full canonical song catalog for `/songs`.

Target direction:

- canonical full dataset for server rendering and detail pages
- compact search dataset for `/songs`
- precomputed filter metadata artifact if useful

That would reduce browser payload without undoing the route ownership model introduced here.

## Files To Read First

If you need to revisit this architecture later, start with:

- [apps/maidb-web/src/lib/song-data.server.ts](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/lib/song-data.server.ts)
- [apps/maidb-web/src/lib/song-catalog.tsx](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/lib/song-catalog.tsx)
- [apps/maidb-web/src/routes/(song-browser-songs)/songs/route.tsx](</Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/(song-browser-songs)/songs/route.tsx>)
- [apps/maidb-web/src/routes/songs\_.$slug.tsx](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/songs_.$slug.tsx)
- [apps/maidb-web/src/routes/\_\_root.tsx](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/__root.tsx)
