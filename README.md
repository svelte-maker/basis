# Basis

A rating platform for finance skill. Members solve auto-graded finance problems, compete in timed contests, share their work, and earn a verified rating (B to AAA) they can put on a resume. Recruiters search candidates by grade and track.

## What's in it

| Area | What it does |
| --- | --- |
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
cp .env.example .env          # then set AUTH_SECRET to a long random string
npm run db:push               # creates the SQLite database
npm run db:seed               # demo members, contests and posts
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

1. Create a Postgres database (Neon or Supabase both have free tiers).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. On Vercel, import the repo and set `DATABASE_URL` and `AUTH_SECRET`.
4. Run `npx prisma db push` once against the production database, and optionally `npm run db:seed` for demo data.

## Code map

- `src/lib/finance/` — pure, tested finance formulas used by both the grader and the tools
- `src/lib/problems/` — problem templates, seeded RNG, answer parsing and grading
- `src/lib/rating/` — Glicko-2 and grade bands
- `src/lib/contestScoring.ts` — contest points and ranking
- `src/lib/services/` — database logic for practice, contests, profiles and candidate search
- `src/app/` — pages and server actions
