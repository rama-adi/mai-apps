/** @jsxImportSource ./satori-jsx */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

interface MetaOgMarkupProps {
  label: string;
  title: string;
  color: string;
  logoDataUrl: string;
}

export function MetaOgImage({ label, title, color, logoDataUrl }: MetaOgMarkupProps) {
  const titleFontSize =
    title.length > 18 ? 72 : title.length > 12 ? 92 : title.length > 8 ? 112 : 140;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "1200px",
        height: "630px",
        fontFamily: "M PLUS Rounded 1c",
        backgroundColor: "#16132b",
        background: `linear-gradient(135deg, #16132b 0%, #1e1b3a 50%, ${color}33 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: "-140px",
          right: "-140px",
          width: "700px",
          height: "700px",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}33 0%, transparent 65%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "-120px",
          left: "-120px",
          width: "500px",
          height: "500px",
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color}22 0%, transparent 65%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: "24px",
          border: `12px solid ${color}`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "-5px",
          right: "40px",
          backgroundColor: color,
          color: "white",
          padding: "10px 28px 10px 18px",
          borderRadius: "12px 12px 0 0",
          fontSize: "26px",
          fontWeight: 700,
          alignItems: "center",
          gap: "12px",
        }}
      >
        <img src={logoDataUrl} width={40} height={40} />
        maiSong-db
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "80px 96px",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "4px",
            color: color,
            marginBottom: "16px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: `${titleFontSize}px`,
            fontWeight: 900,
            lineHeight: 1.1,
            textShadow: "0 4px 18px rgba(0,0,0,0.55)",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

export type SatoriFont = { name: string; data: ArrayBuffer; weight: number; style: string };

export async function generateMetaOgImage(
  label: string,
  title: string,
  color: string,
  fonts: SatoriFont[],
  logoDataUrl: string,
): Promise<Buffer> {
  const markup = MetaOgImage({ label, title, color, logoDataUrl });

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: fonts as any,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const rawPng = resvg.render().asPng();
  return await sharp(rawPng).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
}
