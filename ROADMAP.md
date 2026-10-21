# Roadmap

Owned by the Chief of Staff agent; Svelte has the final say. Keep "Now" to five items at most.

## Now

1. **`/learn` section.** Render `content/learn/*.md` as articles with title, description, related problems and tools; index page by track; sitemap and per-page metadata (title, description, Open Graph). This is how the Growth Marketer's SEO work reaches search engines.
2. **SEO basics.** `sitemap.xml`, `robots.txt`, canonical URLs, Open Graph images for problems, profiles and verify pages, JSON-LD for articles.
3. **Automatic weekly contest.** A scheduled job (Vercel Cron hitting a protected route) that creates the next weekly contest from `growth/contest-calendar.md`, or from a balanced random draw of problems if the calendar is empty.
4. **Share your rating.** A share card image and one-click "Add to LinkedIn" (certification URL pointing at `/verify/<id>`) on the profile page.
5. **Daily problem and streaks.** One featured problem a day on the home page, with a streak counter on profiles.

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
