import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASES, casePoints, getCase, publicCase } from "@/lib/cases";
import { caseState, isDone, parseProgress, revealOf, type PartReveal } from "@/lib/services/cases";
import { CaseWorkspace } from "./CaseWorkspace";
import { CaseHeader, ExhibitView } from "../Exhibit";
import { TeamPanel } from "../../teams/TeamPanel";
import { LearnLink } from "@/components/LearnLink";
import { lessonsForCase } from "@/lib/learn";
import "../../models/models.css";
import "../cases.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCase((await params).slug);
  return { title: c?.title ?? "Case study" };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) notFound();
  const user = await getCurrentUser();
  const state = user ? await caseState(user.id, slug) : null;
  const progress = state ? parseProgress(state.parts) : {};
  const reveals: Record<string, PartReveal> = {};
  for (const p of c.parts) if (isDone(progress[p.key])) reveals[p.key] = revealOf(p);
  const finished = await db.caseState.count({ where: { slug, everCompleted: true } });
  const idx = CASES.findIndex((x) => x.slug === slug);
  const nextC = CASES[(idx + 1) % CASES.length];

  return (
    <div className="stack">
      <div className="row small"><Link href="/cases">← All case studies</Link></div>
      <CaseHeader c={c} finished={finished} />
      <LearnLink lessons={lessonsForCase(slug)} />

      <div className="exhibits">{c.exhibits.map((e) => <ExhibitView key={e.key} c={c} e={e} />)}</div>

      <CaseWorkspace
        slug={slug}
        c={publicCase(c)}
        total={casePoints(c)}
        loggedIn={!!user}
        initialProgress={progress}
        initialReveals={reveals}
        everCompleted={!!state?.everCompleted}
      />

      <TeamPanel kind="case" slug={slug} userId={user?.id ?? null} />

      <div className="row between small">
        <span className="muted">Normal rounding is accepted. Every part is graded against the reported figures, never against your earlier answers.</span>
        {nextC.slug !== slug && <Link href={`/cases/${nextC.slug}`}>Next: {nextC.title} →</Link>}
      </div>
    </div>
  );
}
