# Roadmap

Owned by the Chief of Staff agent; Svelte has the final say. Keep "Now" to five items at most.

## Now

1. **Learn: more lessons.** Extend `/learn` where the problem bank grows: three-statement modelling, deferred tax and leases, FP&A, swaps and FRAs, futures basis, stress testing, personal finance. Each lesson links to graded practice.
2. **Automatic weekly contest.** A scheduled job (Vercel Cron hitting a protected route) that creates the next weekly contest from `growth/contest-calendar.md`, or from a balanced random draw of problems if the calendar is empty.
3. **Share your rating.** A share card image and one-click "Add to LinkedIn" (certification URL pointing at `/verify/<id>`) on the profile page.
4. **Daily problem and streaks.** One featured problem a day on the home page, with a streak counter on profiles.

## Next

- Email: verification on signup, password reset, contest reminders (needs an email provider; Svelte to choose).
- Problem discussions: a comment thread under each problem, hidden until you've solved it.
- Model uploads in community posts (xlsx), with preview.
- Recruiter onboarding page and company profiles.
- Track-specific badges (e.g. "Valuation AA").
- Problem difficulty calibrated from solve rates.

## Problems

- Grow to 100 problems this quarter. Gaps: Banking & Credit, Accounting (three-statement linkages, deferred tax, leases), FP&A (budget variance, driver-based forecasting), Fixed Income (swaps, FRAs, key-rate duration), Derivatives (futures basis, put-call parity arbitrage), Risk (CVaR, stress testing), Personal finance and insurance basics.
- Multi-step "case" problems: a short company case with 3 to 4 linked questions.

## Growth

- Weekly contest every Sunday, monthly themed contest.
- Launch posts on LinkedIn, Reddit and Wall Street Oasis once there's a contest on the calendar.
- University finance club partnerships: free club leaderboards.

## Done

- v1: problems, ratings, contests, community, profiles, recruiter search, valuation and modelling tools. Deployed on Vercel with Neon Postgres.
- `/learn`: 20 in-depth lessons across 10 modules (foundations, accounting, valuation, modelling and Excel, IPOs and FPOs, M&A and LBOs, fixed income, derivatives, risk, credit), each with a "Textbook vs the desk" section, interview questions, a quiz, live editable spreadsheets and links to the problems, models and case parts that apply it; a glossary; and "Learn the concept" links on every problem, model, case and tool page.
- SEO basics (#13): `sitemap.xml` with every lesson, the glossary, problems and tools; `robots.txt`; canonical URLs; Open Graph cards for problems, lessons, profiles and verify pages.
