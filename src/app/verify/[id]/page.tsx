import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/services/profile";
import { finalizeEndedContests } from "@/lib/services/contests";
import { Grade } from "@/components/Grade";
import { gradeLabel } from "@/lib/rating/grades";
import { canonical } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: "Verify a credential", ...canonical(`/verify/${(await params).id.toUpperCase()}`) };
}
export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  await finalizeEndedContests();
  const { id } = await params;
  const u = await db.user.findUnique({ where: { credentialId: id.toUpperCase() } });
  if (!u || u.role !== "MEMBER") notFound();
  const p = (await getProfile(u.handle))!;
  const checked = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div className="panel card cred" style={{ padding: 24, gap: 14 }}>
        <span className="eyebrow" style={{ color: "var(--good)" }}>✓ Verified by Basis · credential {u.credentialId}</span>
        <h1>{u.name}</h1>
        <div className="big-rating"><span className="num">{p.r.rating}</span><Grade grade={p.r.grade} large /><span className="muted">{gradeLabel(p.r.grade)}</span></div>
        <table className="data"><tbody>
          <tr><td>Rated contests</td><td className="r num">{u.ratedContests}</td></tr>
          {p.top && <tr><td>Standing</td><td className="r">Top {p.top}% of rated members</td></tr>}
          {p.best && <tr><td>Best contest finish</td><td className="r">{p.best.rank} of {p.best.contest._count.entries}, {p.best.contest.title}</td></tr>}
          <tr><td>Problems solved</td><td className="r num">{p.solvedCount}</td></tr>
          <tr><td>Strongest track</td><td className="r">{[...p.tracks].sort((a, b) => b.solved / b.total - a.solved / a.total)[0]?.track}</td></tr>
          <tr><td>Rating certainty</td><td className="r num">±{p.r.rd}</td></tr>
        </tbody></table>
        <p className="small muted">Checked live at {checked}. Ratings come from proctored, timed contests where every participant gets different numbers, plus a capped bonus for practice. <Link href="/how-it-works">How ratings work</Link>.</p>
        <Link href={`/u/${u.handle}`}>View full profile →</Link>
      </div>
    </div>
  );
}
