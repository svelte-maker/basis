import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ratingOf } from "@/lib/services/ratings";
import { Grade } from "@/components/Grade";
import { saveNote, toggleShortlist } from "../../actions/recruiters";

export const metadata = { title: "Shortlist" };
export const dynamic = "force-dynamic";

export default async function ShortlistPage() {
  const me = await requireRole(["RECRUITER", "ADMIN"], "/recruiters/shortlist");
  const items = await db.shortlist.findMany({ where: { recruiterId: me.id }, include: { candidate: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="stack">
      <div className="row small"><Link href="/recruiters">← Search</Link></div>
      <div className="head"><div><h1>Your shortlist</h1><p className="lede">Notes are private to you.</p></div>{items.length > 0 && <a className="btn ghost" href="/recruiters/shortlist/export">Download CSV</a>}</div>
      {items.length === 0 && <p className="muted">Nobody shortlisted yet. <Link href="/recruiters">Search candidates</Link>.</p>}
      <div className="grid-auto">
        {items.map((s) => { const r = ratingOf(s.candidate); return (
          <div key={s.candidateId} className="panel card">
            <div className="row between"><Link href={`/u/${s.candidate.handle}`}><strong>{s.candidate.name}</strong></Link><span><span className="num">{r.rating}</span> <Grade grade={r.grade} /></span></div>
            <span className="small muted">{[s.candidate.headline, s.candidate.location].filter(Boolean).join(" · ")}</span>
            <span className="small"><Link href={`/verify/${s.candidate.credentialId}`}>Credential {s.candidate.credentialId}</Link></span>
            <form action={saveNote.bind(null, s.candidateId)} className="stack-sm">
              <textarea name="note" rows={3} defaultValue={s.note} placeholder="Notes, interview stage…" aria-label={`Notes on ${s.candidate.name}`} />
              <div className="row"><button className="btn small">Save note</button></div>
            </form>
            <form action={toggleShortlist.bind(null, s.candidateId)}><button className="btn quiet small">Remove</button></form>
          </div>); })}
      </div>
    </div>
  );
}
