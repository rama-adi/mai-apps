## SongBrowser Modal Routing

If a page renders `SongBrowser`, `SongBrowserGridView`, `SongBrowserResults`, or `SongCard`, add modal routing by following this recipe.

### How to do it

1. Put the page in a path-group route folder.
2. Make the page route file `route.tsx`.
3. Render `<Outlet />` at the end of that page.
4. Add a sibling modal route next to it.
5. Use the shared `SongBrowserModal` component in that modal route.
6. Open the modal by navigating to the page-local modal route.
7. Mask that modal route to the canonical `/songs/$slug` URL.
8. When the modal was opened in-app, close with `window.history.back()`.
9. Keep the standalone song wiki page separate from SongBrowser page nesting.

### For a new SongBrowser page

If you add a new page such as `/artist/$slug`, create:

- a path-group folder for that page context
- a `route.tsx` for the page
- a sibling modal route file for the song modal

Then:

- render the browser page in `route.tsx`
- append `<Outlet />`
- navigate to the page-local modal route for in-app opens
- mask it to `/songs/$slug`
- use the shared modal component in the modal route
- close back to the source page with browser history when possible

### Real example

The `/songs` browser page already follows this pattern:

- page route: [apps/maidb-web/src/routes/(song-browser-songs)/songs/route.tsx](</Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/(song-browser-songs)/songs/route.tsx>)
- page-local modal route: [apps/maidb-web/src/routes/(song-browser-songs)/songs/modal.$slug.tsx](</Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/(song-browser-songs)/songs/modal.$slug.tsx>)
- shared modal component: [apps/maidb-web/src/components/song-browser/SongBrowserModal.tsx](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/components/song-browser/SongBrowserModal.tsx)
- canonical standalone song page: [apps/maidb-web/src/routes/songs\_.$slug.tsx](/Users/ramaadi/WorkProjects/mai-apps/apps/maidb-web/src/routes/songs_.$slug.tsx)

Use that route pair as the reference implementation when adding another SongBrowser page.

### Don't

- Don’t use one global song modal route for every SongBrowser page.
- Don’t navigate directly to `/songs/$slug` for in-app modal opens.
- Don’t put the canonical standalone song page under the SongBrowser page tree.
- Don’t use screenshot, canvas, or cloned-background hacks for modal backgrounds.
