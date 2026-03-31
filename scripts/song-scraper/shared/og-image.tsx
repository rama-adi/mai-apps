/** @jsxImportSource ./satori-jsx */
import { readFileSync } from "fs";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { CATEGORIES, DIFFICULTY_COLORS, REGION_LABELS } from "maidb-data";

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.category, c.color]),
);

// -- Helpers ------------------------------------------------------------------

export function toDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

// -- OG Markup ----------------------------------------------------------------

interface OgMarkupProps {
  song: any;
  sheets: any[];
  thumbDataUrl: string;
  chartBadges: Record<string, string>;
}

export function OgImage({ song, sheets, thumbDataUrl, chartBadges }: OgMarkupProps) {
  const catColor = CATEGORY_COLORS[song.category] ?? "#888888";
  const hasUtage = sheets.some((s: any) => s.difficulty === "utage" || s.isSpecial);

  const typeSet = new Set<string>();
  for (const s of sheets) {
    if (s.difficulty !== "utage" && !s.isSpecial) typeSet.add(s.type);
  }
  const types = Array.from(typeSet);

  const diffMap = new Map<string, { level: number; type: string }>();
  for (const s of sheets) {
    const key = s.difficulty;
    if (key === "utage" || s.isSpecial || !DIFFICULTY_COLORS[key]) continue;
    const val = s.internalLevelValue ?? s.levelValue;
    const existing = diffMap.get(key);
    if (!existing || val > existing.level) {
      diffMap.set(key, { level: val, type: s.type });
    }
  }
  const diffOrder = ["basic", "advanced", "expert", "master", "remaster"];
  const diffs = diffOrder
    .filter((d) => diffMap.has(d))
    .map((d) => ({ name: d, ...diffMap.get(d)! }));

  const regionAvail: Record<string, boolean> = { jp: false, intl: false, usa: false, cn: false };
  for (const s of sheets) {
    for (const r of Object.keys(regionAvail)) {
      if (s.regions[r]) regionAvail[r] = true;
    }
  }

  const titleFontSize = song.title.length > 30 ? 40 : song.title.length > 18 ? 52 : 64;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "1200px",
        height: "630px",
        fontFamily: "M PLUS Rounded 1c",
        backgroundColor: "#16132b",
        background: `linear-gradient(135deg, #16132b 0%, #1e1b3a 50%, ${catColor}22 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Decorative: top-right category glow */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${catColor}25 0%, transparent 65%)`,
        }}
      />

      {/* Decorative: bottom-left glow */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "-80px",
          left: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${catColor}15 0%, transparent 65%)`,
        }}
      />

      {/* Full rounded border */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: "24px",
          border: `10px solid ${catColor}`,
        }}
      />

      {/* Watermark badge bottom-right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "-5px",
          right: "40px",
          backgroundColor: catColor,
          color: "white",
          padding: "8px 24px",
          borderRadius: "12px 12px 0 0",
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        maiSong-db
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "32px 40px 32px 44px",
          alignItems: "center",
        }}
      >
        {/* Left: thumbnail */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            marginRight: "36px",
          }}
        >
          <div
            style={{
              display: "flex",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: `0 8px 40px ${catColor}44, 0 0 0 4px ${catColor}55`,
            }}
          >
            <img src={thumbDataUrl} width={400} height={400} />
          </div>
        </div>

        {/* Right: info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            color: "white",
            overflow: "hidden",
          }}
        >
          {/* Top row: category pill + chart type badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: catColor,
                color: "white",
                padding: "8px 22px",
                borderRadius: "9999px",
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {song.category}
            </div>
            {types.map((t) => (
              <img key={t} src={chartBadges[t] ?? chartBadges["std"]} height={44} />
            ))}
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: `${titleFontSize}px`,
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: "8px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {song.title}
          </div>

          {/* Artist */}
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "24px",
            }}
          >
            {song.artist}
          </div>

          {/* Difficulty chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {diffs.map((d) => (
              <div
                key={d.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "84px",
                  height: "68px",
                  borderRadius: "16px",
                  fontSize: "30px",
                  fontWeight: 900,
                  ...(d.name === "remaster"
                    ? {
                        backgroundColor: "white",
                        color: DIFFICULTY_COLORS[d.name],
                        border: `5px solid ${DIFFICULTY_COLORS[d.name]}`,
                        boxShadow: `0 4px 20px ${DIFFICULTY_COLORS[d.name]}44`,
                      }
                    : {
                        backgroundColor: DIFFICULTY_COLORS[d.name],
                        color: "white",
                        boxShadow: `0 4px 20px ${DIFFICULTY_COLORS[d.name]}44`,
                      }),
                }}
              >
                {d.level.toFixed(1)}
              </div>
            ))}
          </div>

          {/* Bottom: regions + utage */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
            {Object.entries(regionAvail).map(([key, avail]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: avail ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: avail ? "#4be071" : "rgba(255,255,255,0.08)",
                    color: avail ? "white" : "transparent",
                  }}
                >
                  ✓
                </div>
                {REGION_LABELS[key]}
              </div>
            ))}
            {hasUtage && (
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#ff4466",
                  color: "white",
                  padding: "6px 16px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginLeft: "4px",
                }}
              >
                宴会場
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Render pipeline ----------------------------------------------------------

export type SatoriFont = { name: string; data: ArrayBuffer; weight: number; style: string };

export async function generateOgImage(
  song: any,
  sheets: any[],
  thumbPath: string,
  fonts: SatoriFont[],
  chartBadges: Record<string, string>,
): Promise<Buffer> {
  const thumbBuffer = readFileSync(thumbPath);
  const thumbDataUrl = toDataUrl(thumbBuffer, "image/png");

  const markup = OgImage({ song, sheets, thumbDataUrl, chartBadges });

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: fonts as any,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const rawPng = resvg.render().asPng();
  return await sharp(rawPng).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}
