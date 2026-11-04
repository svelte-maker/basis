# Community drafts: Wednesday 4 Nov 2026

Community Manager run. Drafts only, for Svelte to post. Times are IST, with UTC in brackets.

## Where things stand

The live site still can't be reached from the agents' network, and no agent has seen it since 30 Oct. So I don't know whether Basis #2: Alpha Hunt ran on Sun 1 Nov. Nothing suggests it was created: it wasn't on `/contests` at the last check (27 Oct), and Svelte hasn't said otherwise. Nothing has merged to `main` since Fri 23 Oct.

**What I changed:** as planned on Saturday, the calendar moves back one week. Each round keeps its number and name:

| Date | Round | Problems |
| --- | --- | --- |
| Sun 8 Nov | Basis #2: Alpha Hunt | `sharpe-ratio`, `irr-from-moic`, `terminal-value-gordon`, `one-step-binomial` |
| Sun 15 Nov | Basis #3: Fine Print | `current-yield`, `cfo-indirect-method`, `parametric-var`, `fifo-vs-lifo` |
| Wed 18 Nov | Valuation Month: Terminal Velocity | unchanged |
| Sun 22 Nov | Basis #4: Price Discovery | `payback-period`, `implied-price-from-multiple`, `bond-price`, `yield-to-maturity` |
| Sun 29 Nov | Basis #5: Capital Stack | `cet1-ratio`, `net-interest-margin`, `dividend-recap-irr`, `fund-waterfall-carry` |

I swapped out three problems that QA's [#48](https://github.com/svelte-maker/basis/issues/48) sweep found marking one of their own listed mistakes as correct: `black-scholes-call` (142 of 300 seeds), `diluted-shares-tsm` (102 of 300) and `two-asset-volatility` (20 of 300). The replacements match in difficulty and theme, and none of them is on #48's list except `one-step-binomial`, which had 5 of 300.

**For Svelte, in order:**
1. **If Alpha Hunt did run on 1 Nov, tell me** and I'll put the calendar back. Otherwise, create it at `/admin` for **Sun 8 Nov, 17:00 IST (11:30 UTC), 60 min, unrated**, with the problems above. Then post section 1.
2. **Get the first people in.** Every round so far has had 0 entrants. Even a handful of friends or classmates registering would give the first real leaderboard.
3. **Merge [#38](https://github.com/svelte-maker/basis/pull/38) before Sun 22 Nov.** Price Discovery and Capital Stack each use two problems it fixes.
4. **Allow `basis-psi-roan.vercel.app`** in the agents' network settings, so we can see the site again.
5. This PR replaces the calendar changes in [#31](https://github.com/svelte-maker/basis/pull/31) and [#47](https://github.com/svelte-maker/basis/pull/47). Their drafts are out of date now, so you can close both, or merge them as a record and I'll resolve the conflicts.

---

## 1. Next contest: Basis #2: Alpha Hunt (Sun 8 Nov)

**Post only once it's created at `/admin` and shows on `/contests`.**

### Site post (`/community`, type: Discussion)

**Title:** Basis #2: Alpha Hunt, Sunday 8 Nov, 17:00 IST

> The next Basis contest is **Sunday 8 Nov, 17:00 IST (11:30 UTC)**.
>
> - 60 minutes, 4 problems from Easy to Hard, all about returns: risk-adjusted performance, deal returns, terminal value and an option price
> - Everyone gets their own numbers, so you can compare methods afterwards without giving anything away
> - Finish it and you get your "First contest" badge on your profile
>
> Register at https://basis-psi-roan.vercel.app/contests. If you've never done a timed finance round, try two Easy problems first so the answer format is familiar.

### Short social version (WhatsApp, Discord, LinkedIn comment)

> 🏁 *Basis #2: Alpha Hunt* · Sun 8 Nov, 17:00 IST (11:30 UTC)
> 60 minutes · 4 problems · your "First contest" badge
> Register: https://basis-psi-roan.vercel.app/contests

---

## 2. Problem of the week: Leverage and interest coverage

**Problem:** `/problems/leverage-and-coverage` (Easy, Banking & Credit). It isn't in any contest on the calendar.

> 🧮 *Problem of the week:* Leverage and interest coverage (Easy, Banking & Credit)
>
> **Why it matters:** these are the first two numbers a credit analyst looks at, and they sit in almost every loan agreement as covenants. Leverage (debt ÷ EBITDA) says how many years of earnings the debt represents. Coverage says how many times over operating profit pays the interest bill. When coverage falls toward a covenant level, the borrower's lenders get a say in what happens next.
>
> 💡 **Hint:** the problem asks for *EBIT* coverage, so take D&A off EBITDA first. Interest is debt × the average rate.
>
> Solve it (your own numbers): https://basis-psi-roan.vercel.app/problems/leverage-and-coverage

---

## 3. Discussion prompts

1. **"Two companies both have 4x debt to EBITDA. One is a software business and one is a steel maker. Which would you rather lend to, and what would change your mind?"** It builds on the problem of the week and has no single right answer.
2. **"What's the best piece of finance advice you got from someone senior, and did it hold up?"** It's an easy first post for newcomers and works without any numbers.

Neither touches a problem on the contest calendar.

---

## 4. Moderation

I couldn't check `/community` this run. Nothing has been reported, and the last check found no posts, so there's nothing to flag.
