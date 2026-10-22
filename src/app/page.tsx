import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES, TRACKS } from "@/lib/problems";
import { phaseOf } from "@/lib/contestScoring";
import { LocalTime } from "@/components/LocalTime";
import { GRADES } from "@/lib/rating/grades";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const [members, solves, next] = await Promise.all([
    db.user.count({ where: { role: "MEMBER" } }),
    db.practiceState.count({ where: { everSolved: true } }),
    db.contest.findFirst({ where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" } }),
  ]);
  return (
    <div className="stack" style={{ gap: 40 }}>
      <section className="hero">
        <span className="eyebrow">The rating for finance skill</span>
        <h1>Prove what you can do in finance, not just what you studied.</h1>
        <p className="lede" style={{ fontSize: 17 }}>Solve valuation, accounting, credit and markets problems. Compete in timed contests. Earn a verified rating from B to AAA that you can put on your resume, and that recruiters can check in one click.</p>
        <div className="row">
          {user ? <Link className="btn" href="/problems" style={{ color: "var(--accent-ink)" }}>Go to problems</Link> : <Link className="btn" href="/signup" style={{ color: "var(--accent-ink)" }}>Start for free</Link>}
          <Link className="btn ghost" href="/signup?role=recruiter">I&apos;m hiring</Link>
        </div>
        <div className="row small muted"><span className="num">{members}</span> members · <span className="num">{solves}</span> problems solved · <span className="num">{TEMPLATES.length}</span> problem types across {TRACKS.length} tracks</div>
      </section>

      {next && (
        <Link href={`/contests/${next.slug}`} className="panel card" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="eyebrow">{phaseOf(next) === "live" ? "Live now" : "Next contest"}</span>
          <h2>{next.title}</h2>
          <span className="muted small"><LocalTime iso={next.startsAt.toISOString()} /> · {Math.round((next.endsAt.getTime() - next.startsAt.getTime()) / 60000)} minutes</span>
        </Link>
      )}

      <section className="stack-sm">
        <h2>How it works</h2>
        <div className="feature-list">
          <div className="panel card"><span className="step-n">Practise</span><h3>Problems with your own numbers</h3><p className="muted small">Each problem generates unique inputs for every member, from NPV and WACC to LBO returns and Black-Scholes. Answers can&apos;t be shared, so solving one means something.</p></div>
          <div className="panel card"><span className="step-n">Compete</span><h3>Rated contests</h3><p className="muted small">Timed rounds rated with Glicko-2, the system used in chess and competitive programming. Beat stronger people and your rating climbs faster.</p></div>
          <div className="panel card"><span className="step-n">Share</span><h3>Show your work</h3><p className="muted small">Post models, case write-ups and research. Your grade shows next to your name, so good work from strong analysts gets noticed.</p></div>
          <div className="panel card"><span className="step-n">Get hired</span><h3>A credential recruiters trust</h3><p className="muted small">Your profile has a verification link and credential ID. Recruiters filter by grade and track to find people who can actually do the work.</p></div>
        </div>
      </section>

      <section className="stack-sm">
        <h2>Grades read like credit ratings</h2>
        <div className="scale" style={{ fontSize: 14 }}>{[...GRADES].reverse().map((g) => <span key={g.grade}><strong>{g.grade}</strong> {isFinite(g.min) ? `${g.min}+` : "below 1000"} · {g.label}</span>)}</div>
        <p className="small muted">New members show NR (not rated) until their first rated contest. <Link href="/how-it-works">Read exactly how ratings are calculated</Link>.</p>
      </section>

      <section className="stack-sm">
        <h2>Learn the theory, then use it</h2>
        <p className="muted" style={{ maxWidth: "70ch" }}>In-depth lessons on valuation, modelling and Excel, IPOs and FPOs, accounting, M&amp;A, LBOs, bonds, derivatives, risk and credit. Each shows how the job is really done and ends in graded problems and real company cases. <Link href="/learn">Start learning</Link>.</p>
      </section>

      <section className="stack-sm">
        <h2>Free tools for the job</h2>
        <p className="muted">DCF, LBO, WACC, bond, options, loan, ratio, comps and portfolio risk calculators. <Link href="/tools">Open the tools</Link>.</p>
      </section>
    </div>
  );
}
