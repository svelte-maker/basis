import Link from "next/link";
import { db } from "@/lib/db";
import { activeTeamFor, teamTask, type TeamKind } from "@/lib/services/teams";
import { createTeamAction } from "../actions/teams";

/** "Do it with a team": your current team for this task, or start one, or join an open one. */
export async function TeamPanel({ kind, slug, userId }: { kind: TeamKind; slug: string; userId: string | null }) {
  const task = teamTask(kind, slug, "new");
  if (!task) return null;
  const parts = task.parts;
  const current = userId ? await activeTeamFor(userId, slug, kind) : null;
  const open = current ? [] : await db.team.findMany({
    where: { kind, slug, finalizedAt: null }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" }, take: 10,
  });
  const joinable = open.filter((t) => t._count.members < parts.length).slice(0, 3);
  const back = `/${kind === "case" ? "cases" : "models"}/${slug}`;

  return (
    <section className="panel card stack-sm">
      <h3>{kind === "case" ? "Work it with a team" : "Build it with a team"}</h3>
      <p className="small muted">
        This {kind === "case" ? "case" : "task"} splits into {parts.length} parts{parts.length <= 4 ? `: ${parts.map((p) => p.title).join(", ")}` : ""}. Each teammate claims parts, and each part is checked and credited on its own. <Link href="/teams">How points are shared</Link>
      </p>
      <div className="row">
        {current ? <Link className="btn" href={`/teams/${current}`}>Open your team</Link>
          : userId ? <form action={createTeamAction.bind(null, kind, slug)}><button className="btn ghost">Start a team</button></form>
          : <Link className="btn ghost" href={`/login?next=${back}`}>Log in to team up</Link>}
        {joinable.map((t) => <Link key={t.id} className="btn quiet small" href={`/teams/${t.id}`}>Join {t.name} ({t._count.members}/{parts.length})</Link>)}
      </div>
    </section>
  );
}
