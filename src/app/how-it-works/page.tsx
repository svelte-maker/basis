import Link from "next/link";
import { GRADES, PRACTICE_BONUS_CAP, PROVISIONAL_RD } from "@/lib/rating/grades";
import { PRACTICE_POINTS, CONTEST_POINTS } from "@/lib/problems";
import { canonical } from "@/lib/seo";

export const metadata = { title: "How ratings work", ...canonical("/how-it-works") };

export default function HowItWorks() {
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div><span className="eyebrow">Methodology</span><h1 style={{ marginTop: 4 }}>How the Basis rating works</h1><p className="lede">We publish the whole method so candidates and recruiters can trust the number.</p></div>
      <section className="stack-sm"><h2>1. Contest rating (Glicko-2)</h2>
        <p>Your core rating comes from rated contests. After each contest, every participant is compared with every other: finishing above someone counts as a win, level as a draw, below as a loss. Ratings update with Glicko-2, the system used by chess sites and programming contests.</p>
        <p>Glicko-2 tracks how sure it is about you (the rating deviation, shown as ±). New members start at 1200 ±350. Beating people rated above you moves you more; a result the system expected moves you less. While your deviation is above {PROVISIONAL_RD}, your rating is marked provisional.</p>
      </section>
      <section className="stack-sm"><h2>2. Practice bonus</h2>
        <p>Your first correct solve of each problem adds a small bonus: Easy +{PRACTICE_POINTS.Easy}, Medium +{PRACTICE_POINTS.Medium}, Hard +{PRACTICE_POINTS.Hard}. The bonus is capped at {PRACTICE_BONUS_CAP} points in total, so practice alone can&apos;t carry anyone to a high grade. Viewing the solution before solving forfeits that problem&apos;s bonus.</p>
        <p><strong>Basis rating = contest rating + practice bonus (max {PRACTICE_BONUS_CAP}).</strong></p>
      </section>
      <section className="stack-sm"><h2>3. Contest scoring</h2>
        <p>Problems are worth Easy {CONTEST_POINTS.Easy}, Medium {CONTEST_POINTS.Medium} and Hard {CONTEST_POINTS.Hard} points. A problem loses 2 points per minute after the start and 50 points per wrong attempt, but never drops below 30% of its value. Ties break on the time of your last correct answer.</p>
      </section>
      <section className="stack-sm"><h2>4. Grades</h2>
        <div className="panel table-box"><table className="data"><thead><tr><th>Grade</th><th>Rating</th><th>Meaning</th></tr></thead><tbody>
          {GRADES.map((g) => <tr key={g.grade}><td><strong>{g.grade}</strong></td><td className="num">{isFinite(g.min) ? `${g.min}+` : "below 1000"}</td><td>{g.label}</td></tr>)}
          <tr><td><strong>NR</strong></td><td>—</td><td>Not rated: no rated contest yet</td></tr>
        </tbody></table></div>
      </section>
      <section className="stack-sm"><h2>5. Integrity</h2>
        <ul className="stack-sm" style={{ paddingLeft: 20, margin: 0 }}>
          <li>Every member gets different numbers for the same problem, in practice and in contests, so answers can&apos;t be passed around.</li>
          <li>Contests are timed, and answers are checked on the server. The correct answer never reaches your browser.</li>
          <li>Each profile has a credential ID and a public verification page that always shows the live rating.</li>
        </ul>
      </section>
      <p><Link href="/problems">Start solving →</Link></p>
    </div>
  );
}
