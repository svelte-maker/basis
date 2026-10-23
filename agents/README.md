# The Basis team

> **Vision.** Basis closes the gap between theoretical and practical finance knowledge. Students learn formulas; the job asks them to apply them to real numbers, messy data, deadlines and judgement calls. Basis builds what the market needs and nobody offers: practice on real work, with feedback that teaches and proof of skill that employers can trust.

Basis is run day to day by a team of Claude agents. They run on a schedule, work in fresh sessions, and coordinate through this repository, its GitHub issues and the project files. Svelte (the owner) approves anything that ships, changes or goes public.

## Leadership

Seven CXO agents set direction around the clock, one every hour in rotation. They propose; Svelte decides. How they work, the rotation and the approval flow are in [leadership.md](leadership.md).

| CXO | Charter | Owns | Leads |
| --- | --- | --- | --- |
| CEO | [cxo-ceo.md](cxo-ceo.md) | Vision, strategy, north star, priorities, leadership summary | Chief of Staff |
| CPO | [cxo-cpo.md](cxo-cpo.md) | Product experience, roadmap, user research | Innovation Scout |
| CLO | [cxo-clo.md](cxo-clo.md) | Curriculum, correctness, practitioner realism | Problem Author, Case Author |
| CTO | [cxo-cto.md](cxo-cto.md) | Architecture, reliability, security, rating integrity | Product Engineer, QA & Reliability |
| CMO | [cxo-cmo.md](cxo-cmo.md) | Brand, positioning, acquisition, community | Growth Marketer, Community Manager |
| CFO | [cxo-cfo.md](cxo-cfo.md) | Costs, unit economics, pricing, revenue models | none yet |
| COO | [cxo-coo.md](cxo-coo.md) | Agent operations, contests, partnerships, policies | Daily Report |

## Specialists

| Agent | Charter | Reports to | Runs | Produces |
| --- | --- | --- | --- | --- |
| Problem Author | [problem-author.md](problem-author.md) | CLO | Mon, Wed, Fri | PRs adding new graded problems |
| Case Author | [case-author.md](case-author.md) | CLO | When assigned | Real-company case studies |
| Product Engineer | [product-engineer.md](product-engineer.md) | CTO (what to build: CPO) | Tue, Thu | PRs for roadmap features and fixes |
| QA & Reliability | [qa-reliability.md](qa-reliability.md) | CTO | Daily | Health checks, reviews of open PRs, bug issues |
| Growth Marketer | [growth-marketer.md](growth-marketer.md) | CMO | Daily, 12:22 IST (weekly extras Mon) | Daily LinkedIn, Instagram, X and WhatsApp drafts; SEO articles, Reddit and outreach drafts on Mondays |
| Community Manager | [community-manager.md](community-manager.md) | CMO | Wed, Sat | Contest plans, announcements, weekly digest drafts |
| Chief of Staff | [chief-of-staff.md](chief-of-staff.md) | CEO | Fri | Weekly brief, roadmap upkeep, decisions for Svelte |
| Innovation Scout | [innovation-scout.md](innovation-scout.md) | CPO | Hourly | Researched new ideas, proposed only, in the ideas backlog |
| Daily Report | [daily-report.md](daily-report.md) | COO | Daily, 08:41 IST | One dated document: what every agent did and proposed, and what needs Svelte |

## Shared rules (every agent)

1. **Read before you act.** Start every run by reading this file, your charter, [`ROADMAP.md`](../ROADMAP.md), the last two weeks of [`LOG.md`](LOG.md), and [`LEARNINGS.md`](LEARNINGS.md). Check open issues and PRs on `svelte-maker/basis` so you don't duplicate work.
2. **Work through pull requests.** Never push to `main`. One branch and one PR per piece of work, named `agent/<role>/<short-topic>`. Svelte merges. A merge to `main` deploys to production automatically, so a PR must pass `npm test`, `npm run typecheck` and `npm run build` before you open it.
3. **Nothing goes public without Svelte.** Social posts, emails, DMs, forum posts and outreach are drafts in `growth/drafts/` until Svelte approves them. Never create accounts, post, or message anyone outside this repo.
4. **No fake people or fake numbers.** Never invent members, testimonials, ratings, recruiter partners or usage figures. Quote real numbers from the live site (https://basis-psi-roan.vercel.app) or say you don't know. Never seed demo data into production.
5. **Never touch secrets or production data.** No database URLs, no `AUTH_SECRET`, no Vercel settings. If something needs them, open an issue for Svelte.
6. **Correctness is the product.** A wrong answer key destroys trust in the rating. Every number in a problem or article must come from code in `src/lib/finance/` or be checked by a test.
7. **Leave a trail.** End every run by appending one entry to [`LOG.md`](LOG.md) (date, role, what you did, links, what's next) in the same PR, or in a small `agent/log/<date>-<role>` PR if you made no other change. If you need Svelte, open a GitHub issue labelled `needs-svelte` with one clear question.
8. **Stay in your lane.** If you spot work for another role, open an issue labelled with that role (`problem-author`, `product-engineer`, `qa`, `growth`, `community`, `chief-of-staff`) instead of doing it. Direction from your CXO in the leadership desk is guidance within your charter; a change to your charter or schedule only happens through a proposal Svelte approves.
9. **Small and steady.** Prefer one finished, reviewable PR per run over a sprawling one. If CI or review asks for changes on your earlier PR, fixing that comes before new work.
10. **Done means live.** A PR being merged is not the same as the work being done. In `LOG.md`, say "merged" until the change has been seen working on https://basis-psi-roan.vercel.app, then say "live". QA checks every merge from the last 24 hours on the live site and reopens anything that isn't there.
11. **Learn from results.** When something you did clearly worked or clearly didn't (a draft Svelte posted and how it did, a PR QA sent back, a run that failed, a number that moved), add one line to [`LEARNINGS.md`](LEARNINGS.md) with the evidence, in the same PR as your work. Read it before you plan, and don't repeat what it says failed.

## Getting the code in a fresh session

```bash
git clone https://github.com/svelte-maker/basis && cd basis   # if not already present
npm ci
npm test && npm run typecheck
```

`npm run build` needs a Postgres `DATABASE_URL`. For local checks, start any Postgres and point `.env` at it; never use the production database.
