import Link from "next/link";
import { notFound } from "next/navigation";
import { TOOLS } from "../registry";
import Dcf from "../_tools/Dcf";
import Lbo from "../_tools/Lbo";
import Wacc from "../_tools/Wacc";
import Comps from "../_tools/Comps";
import Bond from "../_tools/Bond";
import Options from "../_tools/Options";
import Tvm from "../_tools/Tvm";
import Loan from "../_tools/Loan";
import Ratios from "../_tools/Ratios";
import Risk from "../_tools/Risk";
import { LearnLink } from "@/components/LearnLink";
import { lessonsForTool } from "@/lib/learn";
import { canonical } from "@/lib/seo";

const COMPONENTS: Record<string, () => React.ReactElement> = { dcf: Dcf, lbo: Lbo, wacc: Wacc, comps: Comps, bond: Bond, options: Options, tvm: Tvm, loan: Loan, ratios: Ratios, risk: Risk };

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const t = TOOLS.find((x) => x.slug === tool);
  return t ? { title: t.title, description: t.blurb, ...canonical(`/tools/${t.slug}`) } : { title: tool };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = TOOLS.find((t) => t.slug === tool);
  const C = COMPONENTS[tool];
  if (!meta || !C) notFound();
  return (
    <div className="stack">
      <div className="row small"><Link href="/tools">← All tools</Link></div>
      <div><h1>{meta.title}</h1><p className="lede">{meta.blurb}</p></div>
      <C />
      <LearnLink lessons={lessonsForTool(tool)} />
    </div>
  );
}
