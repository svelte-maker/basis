import Link from "next/link";
import { db } from "@/lib/db";
import { teamSplit } from "@/lib/teams";
import { activeTeamFor } from "@/lib/services/teams";
import { createTeamAction } from "../../actions/teams";

/** "Build it with a team": your current team for this task, or start one, or join an open one. */
export async function TeamPanel({ slug, userId }: { slug: string; userId: string | null }) {
  const parts = teamSplit(slug);
  if (!parts) return null;
  const current = userId ? await activeTeamFor(userId, slug) : null;
  const open = current ? [] : await db.team.findMany({
    where: { slug, finalizedAt: null }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" }, take: 10,
  });
  const joinable = open.filter((t) => t._count.members < parts.length).slice(0, 3);

  return (
    <section className="panel card stack-sm">
      <h3>Build it with a team</h3>
      <p className="small muted">This task splits into {parts.length} parts: {parts.map((p) => p.title).join(", ")}. Each teammate claims a part, everyone works on the same sheet, and each part is checked and credited on its own. <Link href="/teams">How points are shared</Link></p>
      <div className="row">
        {current ? <Link className="btn" href={`/teams/${current}`}>Open your team</Link>
          : userId ? <form action={createTeamAction.bind(null, slug)}><button className="btn ghost">Start a team</button></form>
          : <Link className="btn ghost" href={`/login?next=/models/${slug}`}>Log in to team up</Link>}
        {joinable.map((t) => <Link key={t.id} className="btn quiet small" href={`/teams/${t.id}`}>Join {t.name} ({t._count.members}/{parts.length})</Link>)}
      </div>
    </section>
  );
}
