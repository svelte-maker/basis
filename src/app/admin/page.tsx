import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { phaseOf } from "@/lib/contestScoring";
import { TEMPLATES, TRACKS } from "@/lib/problems";
import { deleteContest } from "../actions/admin";
import { ContestForm } from "./ContestForm";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");
  const [members, recruiters, subs, posts, contests] = await Promise.all([
    db.user.count({ where: { role: "MEMBER" } }), db.user.count({ where: { role: "RECRUITER" } }),
    db.submission.count(), db.post.count(),
    db.contest.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { _count: { select: { entries: true } } } }),
  ]);
  return (
    <div className="stack">
      <h1>Admin</h1>
      <div className="kpis">
        {[["Members", members], ["Recruiters", recruiters], ["Submissions", subs], ["Posts", posts], ["Problem templates", TEMPLATES.length]].map(([l, v]) => <div key={l} className="kpi"><span className="v">{v}</span><span className="l">{l}</span></div>)}
      </div>
      <ContestForm templates={TEMPLATES.map(({ slug, title, track, difficulty }) => ({ slug, title, track, difficulty }))} tracks={TRACKS} />
      <section className="stack-sm"><h2>Contests</h2>
        <div className="panel table-box"><table className="data"><thead><tr><th>Title</th><th>Status</th><th>Starts (UTC)</th><th className="r">Registered</th><th></th></tr></thead><tbody>
          {contests.map((c) => { const ph = phaseOf(c); return (
            <tr key={c.id}><td><Link href={`/contests/${c.slug}`}>{c.title}</Link></td><td>{ph}{c.finalizedAt ? ", rated" : ""}</td><td className="num small">{c.startsAt.toISOString().slice(0, 16).replace("T", " ")}</td><td className="r num">{c._count.entries}</td>
              <td className="r">{ph === "upcoming" && <form action={deleteContest.bind(null, c.id)}><button className="btn quiet small">Delete</button></form>}</td></tr>); })}
        </tbody></table></div>
      </section>
    </div>
  );
}
