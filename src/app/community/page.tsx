import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ratingOf } from "@/lib/services/ratings";
import { Grade } from "@/components/Grade";
import { TRACKS } from "@/lib/problems";
import { toggleVote } from "../actions/community";
import { POST_KINDS } from "@/lib/community";
import { Composer } from "./Composer";
import { canonical } from "@/lib/seo";

export const metadata = { title: "Community", ...canonical("/community") };
export const dynamic = "force-dynamic";

function ago(d: Date) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ sort?: string; kind?: string }> }) {
  const { sort = "top", kind } = await searchParams;
  const user = await getCurrentUser();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const posts = await db.post.findMany({
    where: { ...(kind ? { kind } : {}), ...(sort === "top" ? { createdAt: { gte: since } } : {}) },
    orderBy: sort === "top" ? [{ score: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: 50,
    include: { author: true, _count: { select: { comments: true } } },
  });
  const myVotes = user ? new Set((await db.vote.findMany({ where: { userId: user.id, postId: { in: posts.map((p) => p.id) } } })).map((v) => v.postId)) : new Set<string>();
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ sort, kind, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/community?${q}`;
  };
  return (
    <div className="stack">
      <div className="head"><div><h1>Community</h1><p className="lede">Share models, case write-ups and research. Every author&apos;s verified grade sits next to their name, so readers know whose work they&apos;re looking at.</p></div></div>
      {user ? <Composer kinds={POST_KINDS} tracks={TRACKS} /> : <div className="fb info"><Link href="/login?next=/community">Log in</Link> to post, comment and vote.</div>}
      <div className="row">
        <Link className={`chip ${sort === "top" ? "on" : ""}`} href={href({ sort: "top" })}>Top this month</Link>
        <Link className={`chip ${sort === "new" ? "on" : ""}`} href={href({ sort: "new" })}>Newest</Link>
        <span className="small muted" style={{ marginLeft: 10 }}>Type</span>
        <Link className={`chip ${!kind ? "on" : ""}`} href={href({ kind: undefined })}>All</Link>
        {POST_KINDS.map((k) => <Link key={k} className={`chip ${kind === k ? "on" : ""}`} href={href({ kind: k })}>{k}</Link>)}
      </div>
      <div className="stack-sm" style={{ maxWidth: 780 }}>
        {posts.length === 0 && <p className="muted">No posts yet. Be the first to share something.</p>}
        {posts.map((p) => { const r = ratingOf(p.author); const vote = toggleVote.bind(null, p.id); return (
          <article key={p.id} className="panel post">
            <form action={vote} className="vote"><button className={myVotes.has(p.id) ? "on" : ""} aria-label="Upvote" disabled={user?.id === p.authorId}>▲</button><span className="num small">{p.score}</span></form>
            <div className="stack-sm" style={{ minWidth: 0, gap: 6 }}>
              <div className="row"><span className="chip">{p.kind}</span>{p.track && <span className="chip">{p.track}</span>}</div>
              <h3><Link href={`/community/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>{p.title}</Link></h3>
              <p className="muted small" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.body}</p>
              <div className="byline"><Link href={`/u/${p.author.handle}`}>{p.author.name}</Link><Grade grade={r.grade} /><span className="num">{r.rating}</span><span>· <Link href={`/community/${p.id}`} style={{ fontWeight: 400, color: "var(--muted)" }}>{p._count.comments} comments</Link> · {ago(p.createdAt)}</span></div>
            </div>
          </article>); })}
      </div>
    </div>
  );
}
