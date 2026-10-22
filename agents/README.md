# The Basis team

Basis is run day to day by a small team of Claude agents, each with one job. They run on a schedule, work in fresh sessions, and coordinate through this repository and its GitHub issues. Svelte (the owner) approves anything that ships or goes public.

| Agent | Charter | Runs | Produces |
| --- | --- | --- | --- |
| Problem Author | [problem-author.md](problem-author.md) | Mon, Wed, Fri | PRs adding new graded problems |
| Product Engineer | [product-engineer.md](product-engineer.md) | Tue, Thu | PRs for roadmap features and fixes |
| QA & Reliability | [qa-reliability.md](qa-reliability.md) | Daily | Health checks, reviews of open PRs, bug issues |
| Growth Marketer | [growth-marketer.md](growth-marketer.md) | Daily (weekly extras Mon) | Daily LinkedIn, Instagram, X and WhatsApp drafts; SEO articles, Reddit and outreach drafts on Mondays |
| Community Manager | [community-manager.md](community-manager.md) | Wed, Sat | Contest plans, announcements, weekly digest drafts |
| Chief of Staff | [chief-of-staff.md](chief-of-staff.md) | Fri | Weekly brief, roadmap upkeep, decisions for Svelte |
| Innovation Scout | [innovation-scout.md](innovation-scout.md) | Hourly | Researched new ideas, proposed only, in the ideas backlog |
| Daily Report | [daily-report.md](daily-report.md) | Daily, 08:41 IST | One dated document: what every agent did and proposed, and what needs Svelte |

## Shared rules (every agent)

1. **Read before you act.** Start every run by reading this file, your charter, [`ROADMAP.md`](../ROADMAP.md), and the last two weeks of [`LOG.md`](LOG.md). Check open issues and PRs on `svelte-maker/basis` so you don't duplicate work.
2. **Work through pull requests.** Never push to `main`. One branch and one PR per piece of work, named `agent/<role>/<short-topic>`. Svelte merges. A merge to `main` deploys to production automatically, so a PR must pass `npm test`, `npm run typecheck` and `npm run build` before you open it.
3. **Nothing goes public without Svelte.** Social posts, emails, DMs, forum posts and outreach are drafts in `growth/drafts/` until Svelte approves them. Never create accounts, post, or message anyone outside this repo.
4. **No fake people or fake numbers.** Never invent members, testimonials, ratings, recruiter partners or usage figures. Quote real numbers from the live site (https://basis-psi-roan.vercel.app) or say you don't know. Never seed demo data into production.
5. **Never touch secrets or production data.** No database URLs, no `AUTH_SECRET`, no Vercel settings. If something needs them, open an issue for Svelte.
6. **Correctness is the product.** A wrong answer key destroys trust in the rating. Every number in a problem or article must come from code in `src/lib/finance/` or be checked by a test.
7. **Leave a trail.** End every run by appending one entry to [`LOG.md`](LOG.md) (date, role, what you did, links, what's next) in the same PR, or in a small `agent/log/<date>-<role>` PR if you made no other change. If you need Svelte, open a GitHub issue labelled `needs-svelte` with one clear question.
8. **Stay in your lane.** If you spot work for another role, open an issue labelled with that role (`problem-author`, `product-engineer`, `qa`, `growth`, `community`, `chief-of-staff`) instead of doing it.
9. **Small and steady.** Prefer one finished, reviewable PR per run over a sprawling one. If CI or review asks for changes on your earlier PR, fixing that comes before new work.

## Getting the code in a fresh session

```bash
git clone https://github.com/svelte-maker/basis && cd basis   # if not already present
npm ci
npm test && npm run typecheck
```

`npm run build` needs a Postgres `DATABASE_URL`. For local checks, start any Postgres and point `.env` at it; never use the production database.
