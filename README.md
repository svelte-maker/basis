# Basis

A rating platform for finance skill. Members solve auto-graded finance problems, compete in timed contests, share their work, and earn a verified rating (B to AAA) they can put on a resume. Recruiters search candidates by grade and track.

## What's in it

| Area | What it does |
| --- | --- |
| Learn | 20 in-depth lessons across 10 modules, from the time value of money to IPOs and FPOs, DCF, LBOs, derivatives and credit. Each explains the idea, every formula and a worked example computed by the grading code, shows where textbook and real practice differ, and ends with a quiz, interview questions and links to the problems, model tasks and case parts that apply it. Live spreadsheets in lessons can be edited and rebuilt. Glossary at `/learn/glossary`. |
| Problems | 47 problem templates across 8 tracks (Accounting, Corporate Finance, Valuation, Fixed Income, Derivatives, Private Equity, Portfolio & Risk, Banking & Credit). Each member gets their own randomized numbers, so answers can't be shared. Answers are checked on the server with a tolerance. |
| Rating | Glicko-2 contest rating plus a practice bonus capped at 150. Grades use credit-rating letters; NR until a first rated contest. Method is published at `/how-it-works`. |
| Contests | Scheduled, timed rounds. Points decay with time and wrong attempts. Live standings, automatic rating when a contest ends. Admins schedule contests at `/admin`. |
| Community | Posts (models, case write-ups, research, questions), comments and votes. Authors' grades shown next to their names. |
| Profiles | Rating history chart, track breakdown, contest history, a copyable resume line and a public verification page (`/verify/<credential id>`). |
| Recruiters | Search by minimum grade, track and keyword; shortlist with private notes; CSV export. |
| Tools | DCF, LBO, WACC and beta, trading comps, bonds, options (Black-Scholes, Greeks, binomial American, implied vol), NPV/IRR, loan amortisation, ratio analysis, portfolio risk and VaR. |

## Run it locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL (any Postgres) and AUTH_SECRET
npm run db:push               # creates the tables
ALLOW_DEMO_SEED=yes npm run db:seed   # optional: fictional demo members, contests and posts (wipes the database)
npm run dev                   # http://localhost:3000
```

Demo logins (password `basis-demo`): `aarav@demo.basis` (member), `recruiter@demo.basis` (recruiter), `admin@demo.basis` (admin).

## Tests

```bash
npm test            # unit tests: finance formulas, every problem template (150 seeds each), Glicko-2, contest scoring
npm run typecheck
npm run build && npm start   # then, in another terminal:
npm run test:e2e    # browser smoke test of the main flows (needs seeded data)
```

## Deploying

1. Create a Postgres database on Neon (free) and copy the direct connection string (connection pooling off).
2. On Vercel, import the repo and set three environment variables: `DATABASE_URL`, `AUTH_SECRET` and `ADMIN_EMAILS` (your email).
3. Deploy. The build creates or updates the tables automatically (`prisma db push`).
4. Sign up with the admin email, then schedule the first contest at `/admin`.

Don't seed demo data into production: the demo members are fictional and recruiters would see them.

## Code map

- `src/lib/finance/` — pure, tested finance formulas used by the grader, the tools and the lessons
- `src/lib/learn/` — Learn lessons as typed data; see [`content/learn/README.md`](content/learn/README.md)
- `src/lib/problems/` — problem templates, seeded RNG, answer parsing and grading
- `src/lib/rating/` — Glicko-2 and grade bands
- `src/lib/contestScoring.ts` — contest points and ranking
- `src/lib/services/` — database logic for practice, contests, profiles and candidate search
- `src/app/` — pages and server actions

## The team

Basis is grown by a team of scheduled Claude agents (problem author, product engineer, QA, growth marketer, community manager, chief of staff). Their charters and shared rules are in [`agents/`](agents/README.md), priorities in [`ROADMAP.md`](ROADMAP.md), and marketing drafts in [`growth/`](growth/). Agents work through pull requests and drafts; nothing merges or gets posted publicly without the owner's approval.
