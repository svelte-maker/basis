import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/services/profile";
import { getCurrentUser } from "@/lib/auth";
import { finalizeEndedContests } from "@/lib/services/contests";
import { Grade } from "@/components/Grade";
import { RatingChart } from "@/components/RatingChart";
import { CopyButton } from "@/components/CopyButton";
import { GRADES } from "@/lib/rating/grades";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  return { title: (await params).handle };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  await finalizeEndedContests();
  const { handle } = await params;
  const p = await getProfile(handle);
  if (!p) notFound();
  const viewer = await getCurrentUser();
  const own = viewer?.id === p.user.id;
  const { user, r } = p;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const verifyUrl = `${origin}/verify/${user.credentialId}`;
  const resumeLine = r.grade === "NR"
    ? `Basis Finance Rating: in progress (${p.solvedCount} problems solved)\nProfile: ${origin}/u/${user.handle}`
    : `Basis Finance Rating: ${r.rating} (${r.grade})${p.top ? `, top ${p.top}% of rated members` : ""}\nVerify: ${verifyUrl}  ·  Credential ID ${user.credentialId}`;

  if (user.role !== "MEMBER") {
    return <div className="stack"><h1>{user.name}</h1><p className="lede">{user.role === "RECRUITER" ? `Recruiter${user.company ? ` at ${user.company}` : ""}` : "Basis team"}</p></div>;
  }

  return (
    <div className="stack">
      <div className="head">
        <div>
          <span className="eyebrow">@{user.handle}{user.openToWork ? " · open to opportunities" : ""}</span>
          <h1 style={{ marginTop: 4 }}>{user.name}</h1>
          <p className="lede">{[user.headline, user.location].filter(Boolean).join(" · ") || "Finance on Basis"}</p>
        </div>
        {own && <Link className="btn ghost" href="/settings">Edit profile</Link>}
      </div>
      <div className="split">
        <div className="panel card">
          <div className="row between">
            <div className="big-rating"><span className="num">{r.rating}</span><Grade grade={r.grade} large /></div>
            <span className="small muted">{r.grade === "NR" ? "Grade awarded after your first rated contest" : `${p.top ? `Top ${p.top}% · ` : ""}${user.ratedContests} rated ${user.ratedContests === 1 ? "contest" : "contests"}${r.provisional ? " · provisional" : ""}`}</span>
          </div>
          <RatingChart points={p.history} />
          <div className="scale">{[...GRADES].reverse().map((g) => <span key={g.grade} className={g.grade === r.grade ? "cur" : ""}>{g.grade} {isFinite(g.min) ? `${g.min}+` : "<1000"}</span>)}</div>
        </div>
        {own ? (
          <div className="panel card cred">
            <span className="eyebrow">Resume credential</span>
            <h3>Add this to your resume or LinkedIn</h3>
            <pre className="cred-text">{resumeLine}</pre>
            <div className="row"><CopyButton text={resumeLine} label="Copy text" /><Link href={`/verify/${user.credentialId}`} className="small">Open verification page</Link></div>
            <p className="small muted">Anyone with the link sees your live rating, grade and contest record, checked by Basis.</p>
          </div>
        ) : (
          <div className="panel card">
            <h3>About</h3>
            <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{user.bio || "No bio yet."}</p>
            <p className="small"><Link href={`/verify/${user.credentialId}`}>Verified credential {user.credentialId}</Link></p>
          </div>
        )}
      </div>
      <div className="grid-auto">
        <div className="panel card"><h3>Solved by track</h3>
          <div className="bars">{p.tracks.map((t) => (
            <div key={t.track}><div className="bar-lbl"><span>{t.track}</span><span className="num">{t.solved}/{t.total}</span></div><div className="track"><i style={{ width: `${Math.round((t.solved / t.total) * 100)}%` }} /></div></div>
          ))}</div>
        </div>
        <div className="panel card"><h3>Record</h3>
          <div className="stack-sm small">
            <span>Problems solved <strong className="num">{p.solvedCount}</strong></span>
            <span>Rated contests <strong className="num">{user.ratedContests}</strong></span>
            {p.best && <span>Best finish <strong>{p.best.rank} of {p.best.contest._count.entries}</strong> in {p.best.contest.title}</span>}
            <span>Rating deviation <strong className="num">±{r.rd}</strong> <span className="muted">(lower means more certain)</span></span>
            <span>Member since <strong>{user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</strong></span>
          </div>
        </div>
        <div className="panel card"><h3>Shared work</h3>
          {p.posts.length ? <div className="stack-sm">{p.posts.map((post) => <Link key={post.id} href={`/community/${post.id}`} className="small">{post.title} <span className="muted">· {post.score} votes</span></Link>)}</div> : <p className="small muted">Nothing shared yet.</p>}
        </div>
      </div>
      {p.entries.length > 0 && (
        <section className="stack-sm"><h2>Contest history</h2>
          <div className="panel table-box"><table className="data"><thead><tr><th>Contest</th><th className="r">Rank</th><th className="r">Score</th><th className="r">Rating</th></tr></thead><tbody>
            {p.entries.map((e) => { const d = e.ratingAfter != null && e.ratingBefore != null ? e.ratingAfter - e.ratingBefore : null; return (
              <tr key={e.id}><td><Link href={`/contests/${e.contest.slug}`}>{e.contest.title}</Link></td><td className="r num">{e.rank} / {e.contest._count.entries}</td><td className="r num">{e.score}</td>
                <td className="r num">{d == null ? "unrated" : <>{e.ratingAfter} <span style={{ color: d >= 0 ? "var(--good)" : "var(--bad)" }}>({d >= 0 ? "+" : ""}{d})</span></>}</td></tr>); })}
          </tbody></table></div>
        </section>
      )}
    </div>
  );
}
