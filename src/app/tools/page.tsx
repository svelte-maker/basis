import Link from "next/link";
import { TOOLS } from "./registry";

export const metadata = { title: "Tools" };

export default function ToolsPage() {
  return (
    <div className="stack">
      <div><h1>Finance tools</h1><p className="lede">Working calculators built on the same tested formulas that grade the problems. Free, and nothing you type leaves your browser.</p></div>
      <div className="grid-auto">
        {TOOLS.map((t) => (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="panel card" style={{ color: "inherit", textDecoration: "none" }}>
            <h3>{t.title}</h3><p className="small muted">{t.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
