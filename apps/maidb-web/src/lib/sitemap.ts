export type SitemapRef = { loc: string };

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildUrlset(locs: string[]): string {
  const urls = locs.map((loc) => `<url><loc>${xmlEscape(loc)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function buildSitemapIndex(sitemaps: SitemapRef[]): string {
  const items = sitemaps.map((s) => `<sitemap><loc>${xmlEscape(s.loc)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

export type AtomEntry = {
  id: string;
  title: string;
  link: string;
  updated: string;
};

export type AtomFeed = {
  id: string;
  title: string;
  selfLink: string;
  updated: string;
  entries: AtomEntry[];
};

export function buildAtomFeed(feed: AtomFeed): string {
  const entries = feed.entries
    .map(
      (entry) =>
        `<entry><id>${xmlEscape(entry.id)}</id><title>${xmlEscape(entry.title)}</title><link rel="alternate" href="${xmlEscape(entry.link)}"/><updated>${xmlEscape(entry.updated)}</updated></entry>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${xmlEscape(feed.id)}</id><title>${xmlEscape(feed.title)}</title><link rel="self" href="${xmlEscape(feed.selfLink)}"/><updated>${xmlEscape(feed.updated)}</updated>${entries}</feed>`;
}

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

export function xmlResponse(body: string): Response {
  return new Response(body, { headers: XML_HEADERS });
}
