import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The light palette from globals.css; social cards are always shown on a light ground.
const C = { bg: "#F3F5F4", surface: "#FFFFFF", ink: "#13212B", muted: "#5B6B73", line: "#D9E0DE", accent: "#0E6B5C", soft: "#E1F0EC" };

export type OgCard = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Large figure on the right, e.g. a rating. */
  stat?: { value: string; label: string };
};

function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

/** A 1200×630 social card in the Basis visual language. */
export function ogImage({ eyebrow, title, subtitle, stat }: OgCard): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", background: C.surface, border: `2px solid ${C.line}`, borderRadius: 20, padding: "52px 60px", borderTop: `10px solid ${C.accent}` }}>
          <div style={{ display: "flex", fontSize: 28, color: C.accent, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>{clip(eyebrow, 60)}</div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
              <div style={{ display: "flex", fontSize: title.length > 48 ? 58 : 72, fontWeight: 700, color: C.ink, lineHeight: 1.08 }}>{clip(title, 90)}</div>
              {subtitle && <div style={{ display: "flex", fontSize: 30, color: C.muted, lineHeight: 1.35 }}>{clip(subtitle, 150)}</div>}
            </div>
            {stat && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: C.soft, borderRadius: 16, padding: "28px 40px" }}>
                <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ display: "flex", fontSize: 26, color: C.ink, marginTop: 10 }}>{stat.label}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, fontSize: 34, fontWeight: 700, color: C.ink }}>
            Basis <span style={{ fontSize: 24, fontWeight: 400, color: C.muted }}>finance, rated</span>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
