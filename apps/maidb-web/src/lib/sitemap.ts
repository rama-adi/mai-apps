export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export type UrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
};

export type SitemapRef = {
  loc: string;
  lastmod?: string;
};

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderUrl(entry: UrlEntry): string {
  const parts = [`    <loc>${xmlEscape(entry.loc)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) parts.push(`    <priority>${entry.priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

function renderSitemap(ref: SitemapRef): string {
  const parts = [`    <loc>${xmlEscape(ref.loc)}</loc>`];
  if (ref.lastmod) parts.push(`    <lastmod>${ref.lastmod}</lastmod>`);
  return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
}

export function buildUrlset(entries: UrlEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderUrl).join("\n")}
</urlset>
`;
}

export function buildSitemapIndex(sitemaps: SitemapRef[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(renderSitemap).join("\n")}
</sitemapindex>
`;
}

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

export function xmlResponse(body: string): Response {
  return new Response(body, { headers: XML_HEADERS });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
