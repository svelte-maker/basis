import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ratingOf } from "@/lib/services/ratings";
import { Grade } from "@/components/Grade";
import { toggleVote } from "../../actions/community";
import { CommentForm } from "./CommentForm";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, include: { author: true, comments: { include: { author: true }, orderBy: { createdAt: "asc" } } } });
  if (!post) notFound();
  const user = await getCurrentUser();
  const voted = user ? !!(await db.vote.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } })) : false;
  const r = ratingOf(post.author);
  return (
    <div className="stack" style={{ maxWidth: 780 }}>
      <div className="row small"><Link href="/community">← Community</Link></div>
      <article className="panel post">
        <form action={toggleVote.bind(null, post.id)} className="vote"><button className={voted ? "on" : ""} aria-label="Upvote" disabled={user?.id === post.authorId}>▲</button><span className="num small">{post.score}</span></form>
        <div className="stack-sm" style={{ minWidth: 0 }}>
          <div className="row"><span className="chip">{post.kind}</span>{post.track && <span className="chip">{post.track}</span>}</div>
          <h1 style={{ fontSize: 26 }}>{post.title}</h1>
          <div className="byline"><Link href={`/u/${post.author.handle}`}>{post.author.name}</Link><Grade grade={r.grade} /><span className="num">{r.rating}</span><span>· {post.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</span></div>
          <p className="post-body">{post.body}</p>
          {post.link && <p><a href={post.link} target="_blank" rel="noopener noreferrer nofollow">Open the attached file or link ↗</a></p>}
        </div>
      </article>
      <section className="stack-sm">
        <h2>{post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}</h2>
        {post.comments.map((c) => { const cr = ratingOf(c.author); return (
          <div key={c.id} className="panel card" style={{ gap: 6 }}>
            <div className="byline"><Link href={`/u/${c.author.handle}`}>{c.author.name}</Link><Grade grade={cr.grade} /><span>· {c.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</span></div>
            <p className="post-body">{c.body}</p>
          </div>); })}
        {user ? <CommentForm postId={post.id} /> : <p className="small muted"><Link href={`/login?next=/community/${post.id}`}>Log in</Link> to comment.</p>}
      </section>
    </div>
  );
}
