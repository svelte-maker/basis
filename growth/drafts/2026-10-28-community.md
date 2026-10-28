# Community drafts: Wednesday 28 Oct 2026

Community Manager run. Drafts only, for Svelte to post. Times are IST, with UTC in brackets.

## Where things stand

The live site couldn't be reached from this run: the agent's network blocked `basis-psi-roan.vercel.app`. The facts below come from QA's live checks in [#20](https://github.com/svelte-maker/basis/pull/20), the latest from 27 Oct:

- **Basis #1: The Founding Round** finished on Sun 25 Oct with **0 registered** and no standings, so no badges were earned.
- **No upcoming contest is listed.** Basis #2: Alpha Hunt (Sun 1 Nov) hasn't been created at `/admin` yet.
- Home page: "1 members · 15 problems solved · 50 problem types".
- Nothing has merged to `main` since Fri 23 Oct. Eleven agent PRs are open, including last Saturday's [#31](https://github.com/svelte-maker/basis/pull/31).

**For Svelte, in order:**
1. **Create Basis #2: Alpha Hunt at `/admin`** for Sun 1 Nov, 17:00 IST (11:30 UTC), 60 min, problems `sharpe-ratio`, `irr-from-moic`, `terminal-value-gordon`, `black-scholes-call`. Until it exists, don't post the announcement below.
2. **Get the first people in before Sunday.** A contest with nobody registered teaches us nothing. The launch kits in `growth/community/` are ready. Even 10 friends, classmates or CFA study partners registering would give a real first leaderboard.
3. **Decide what to do with the Founding Round badge.** Nobody earned it. One option is to rename Alpha Hunt "Basis #2: The Founding Round" and run the badge again. My recommendation is to keep the badge for the first contest that has at least one finisher. That's a product change (`src/lib/badges.ts` matches on the contest title), so it's your call.
4. **Merge #31 if you want the calendar to stay four weeks ahead.** Its Founding Round posts are out of date now, but it adds Basis #5: Capital Stack (22 Nov). Two of that round's problems (`dividend-recap-irr`, `fund-waterfall-carry`) have edge-seed issues filed in #35 with a fix in #38, so merge #38 before 22 Nov or I'll swap them out.

---

## 1. Next contest: Basis #2: Alpha Hunt (Sun 1 Nov)

**Post only after it's created at `/admin` and shows on `/contests`.**

### Site post (`/community`, type: Discussion)

**Title:** Basis #2: Alpha Hunt, this Sunday 17:00 IST

> The first **rated** Basis contest is this Sunday, **1 Nov, 17:00 IST (11:30 UTC)**.
>
> - 60 minutes, 4 problems from Easy to Hard, all about returns: risk-adjusted performance, deal returns, terminal value and an option price
> - Everyone gets their own numbers
> - It's rated: finish it and you get your first grade on the B to AAA scale, plus your "First contest" badge
>
> Register at https://basis-psi-roan.vercel.app/contests. If you've never tried a timed finance round, do two Easy problems first so the answer format is familiar.

### Short social version (WhatsApp, Discord, LinkedIn comment)

> 🏁 *Basis #2: Alpha Hunt* · Sun 1 Nov, 17:00 IST (11:30 UTC)
> 60 min · 4 problems · **rated**: your first B–AAA grade
> Register: https://basis-psi-roan.vercel.app/contests

### LinkedIn (personal profile)

> This Sunday is the first rated round on Basis: Alpha Hunt.
>
> Four problems in 60 minutes, all about returns. Finish it and you get a grade on a B to AAA scale with a public link you can verify, the same idea as a credit rating but for your finance skills.
>
> It's free, it's early, and the first leaderboard is wide open.
>
> Sunday 1 Nov, 17:00 IST. Link in the first comment.

---

## 2. Problem of the week: Cash conversion cycle

**Problem:** `/problems/cash-conversion-cycle` (Easy, Accounting). It isn't in any contest on the calendar.

> 🧮 *Problem of the week:* Cash conversion cycle (Easy, Accounting)
>
> **Why it matters:** it's how many days a company's cash is tied up between paying suppliers and getting paid by customers. A retailer with a negative cycle is effectively funded by its suppliers. A manufacturer whose cycle keeps stretching can run short of cash even while it reports profits. Lenders, equity analysts and FP&A teams all watch it.
>
> 💡 **Hint:** CCC = DSO + DIO − DPO. Days payables is the only term you subtract, because that's the time *suppliers* are financing you.
>
> Solve it (your own numbers): https://basis-psi-roan.vercel.app/problems/cash-conversion-cycle

---

## 3. Discussion prompts

1. **"Name a company you think runs a negative cash conversion cycle. How do they pull it off, and what would break it?"** It builds on the problem of the week.
2. **"What's the one finance calculation you'd want a new analyst to do from memory on day one, and why that one?"** It's an easy first post for newcomers, and the answers show us which problems to write next.

Neither touches a problem on the contest calendar.

---

## 4. Moderation

I couldn't check `/community` directly this run. QA's 24–27 Oct checks found the page loading with no posts mentioned, so there's nothing to flag.
