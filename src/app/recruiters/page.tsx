import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { searchCandidates, GRADE_OPTIONS } from "@/lib/services/candidates";
import { finalizeEndedContests } from "@/lib/services/contests";
import { TRACKS } from "@/lib/problems";
import { Grade } from "@/components/Grade";
import { toggleShortlist } from "../actions/recruiters";

export const metadata = { title: "Find candidates" };
export const dynamic = "force-dynamic";

export default async function RecruitersPage({ searchParams }: { searchParams: Promise<{ minGrade?: string; track?: string; q?: string; open?: string; sort?: string }> }) {
  const me = await requireRole(["RECRUITER", "ADMIN"], "/recruiters");
  await finalizeEndedContests();
  const sp = await searchParams;
  const rows = await searchCandidates({ minGrade: sp.minGrade, track: sp.track, q: sp.q, openOnly: sp.open !== "all", sort: (sp.sort as "rating") ?? "rating" });
  const shortlisted = new Set((await db.shortlist.findMany({ where: { recruiterId: me.id } })).map((s) => s.candidateId));
  return (
    <div className="stack">
      <div className="head">
        <div><h1>Find candidates by proven skill</h1><p className="lede">Every rating comes from timed contests where each person gets different numbers, so it can&apos;t be copied. Filter by grade and track, then shortlist.</p></div>
        <Link className="btn ghost" href="/recruiters/shortlist">Shortlist ({shortlisted.size})</Link>
      </div>
      <div className="panel">
        <form className="panel-head" method="get" style={{ justifyContent: "flex-start" }}>
          <label className="field">Minimum grade<select name="minGrade" defaultValue={sp.minGrade ?? ""}><option value="">Any</option>{GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g} or better</option>)}</select></label>
          <label className="field">Track<select name="track" defaultValue={sp.track ?? ""}><option value="">Any</option>{TRACKS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="field">Keyword or location<input name="q" defaultValue={sp.q ?? ""} placeholder="e.g. Mumbai, credit" /></label>
          <label className="field">Sort<select name="sort" defaultValue={sp.sort ?? "rating"}><option value="rating">Rating</option><option value="solved">Problems solved</option><option value="recent">Newest members</option></select></label>
          <label className="field">Show<select name="open" defaultValue={sp.open ?? "open"}><option value="open">Open to opportunities</option><option value="all">Everyone</option></select></label>
          <button className="btn" style={{ alignSelf: "end" }}>Search</button>
        </form>
        <div className="table-box"><table className="data" style={{ minWidth: 760 }}><thead><tr><th>Candidate</th><th>Grade</th><th className="r">Rating</th><th>Strongest track</th><th className="r">{sp.track ? `Solved in ${sp.track}` : "Solved"}</th><th className="r">Contests</th><th></th></tr></thead><tbody>
          {rows.length === 0 && <tr><td colSpan={7} className="muted">No candidates match. Try a lower grade or another track.</td></tr>}
          {rows.slice(0, 100).map((x) => (
            <tr key={x.u.id}>
              <td><Link href={`/u/${x.u.handle}`}><strong>{x.u.name}</strong></Link><br /><span className="small muted">{[x.u.headline, x.u.location].filter(Boolean).join(" · ")}</span></td>
              <td><Grade grade={x.r.grade} />{x.r.provisional && <span className="small muted"> prov.</span>}</td>
              <td className="r num">{x.r.rating}</td>
              <td className="small">{x.topTrack ?? "—"}</td>
              <td className="r num">{sp.track ? x.trackSolved : x.solved}</td>
              <td className="r num">{x.contests}</td>
              <td className="r"><form action={toggleShortlist.bind(null, x.u.id)}><button className={`btn small ${shortlisted.has(x.u.id) ? "" : "ghost"}`}>{shortlisted.has(x.u.id) ? "Shortlisted ✓" : "Shortlist"}</button></form></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
      <p className="small muted">{rows.length} matching {rows.length === 1 ? "member" : "members"}{rows.length > 100 ? ", showing the top 100" : ""}.</p>
    </div>
  );
}
