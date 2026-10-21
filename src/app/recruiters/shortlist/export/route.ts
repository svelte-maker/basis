import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ratingOf } from "@/lib/services/ratings";

const cell = (v: string | number) => {
  const s = String(v);
  // Quote everything and neutralise spreadsheet formula injection
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "RECRUITER" && me.role !== "ADMIN")) return new Response("Not allowed", { status: 403 });
  const items = await db.shortlist.findMany({ where: { recruiterId: me.id }, include: { candidate: true }, orderBy: { createdAt: "desc" } });
  const origin = new URL(req.url).origin;
  const rows = [["Name", "Handle", "Rating", "Grade", "Headline", "Location", "Credential", "Verify link", "Note"].map(cell).join(",")];
  for (const s of items) {
    const r = ratingOf(s.candidate);
    rows.push([s.candidate.name, s.candidate.handle, r.rating, r.grade, s.candidate.headline, s.candidate.location, s.candidate.credentialId, `${origin}/verify/${s.candidate.credentialId}`, s.note].map(cell).join(","));
  }
  return new Response(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="basis-shortlist.csv"' } });
}
