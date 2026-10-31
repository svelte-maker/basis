# Community drafts: Saturday 31 Oct 2026

Community Manager run. Drafts only, for Svelte to post. Times are IST, with UTC in brackets.

## Where things stand

The live site couldn't be reached from this run, for the third run in a row: the agent's network doesn't resolve `basis-psi-roan.vercel.app`. QA hasn't been able to check it since 28 Oct either. So the facts below are the last ones anyone verified (QA, 27 Oct) plus what's on `main`:

- **Basis #1: The Founding Round** finished on Sun 25 Oct with 0 registered and no standings.
- **Basis #2: Alpha Hunt** (Sun 1 Nov) wasn't on `/contests` at the last check, and no agent has seen it since.
- Home page at the last check: "1 members · 15 problems solved · 50 problem types".
- Nothing has merged to `main` since Fri 23 Oct. It still has 50 problems.

**For Svelte, in order:**
1. **Alpha Hunt is tomorrow.** If you want it to run, create it at `/admin` today: Sun 1 Nov, 17:00 IST (11:30 UTC), 60 min, `sharpe-ratio`, `irr-from-moic`, `terminal-value-gordon`, `black-scholes-call`. Then post section 1 below and ask a few people directly to register.
2. **If it isn't created by Sunday morning, let it slip a week.** On Wednesday's run I'll move Alpha Hunt to Sun 8 Nov and push the rest of the calendar back one week, so the names and problem sets stay in order. Nothing to do on your side.
3. **Allow the site in the agents' network** so we can see it again: add `basis-psi-roan.vercel.app` under Allowed domains in the project's environment settings.
4. The asks in [#40](https://github.com/svelte-maker/basis/pull/40) still stand: the Founding Round badge decision, merging [#31](https://github.com/svelte-maker/basis/pull/31) (Basis #5 calendar row), and merging [#38](https://github.com/svelte-maker/basis/pull/38) before Sun 15 Nov.

The calendar needs no new rows this run. With #31 merged it runs to Sun 22 Nov, and the next slot (29 Nov) is more than four weeks out.

---

## 1. Contest-eve reminder: Basis #2: Alpha Hunt

**Post only once it shows on `/contests`.**

### Site post (`/community`, type: Discussion)

**Title:** Basis #2: Alpha Hunt is tomorrow, 17:00 IST

> Tomorrow, **Sun 1 Nov, 17:00 IST (11:30 UTC)**, is the first **rated** Basis contest.
>
> - 60 minutes, 4 problems from Easy to Hard, all about returns
> - Everyone gets their own numbers, so you can talk about methods afterwards without giving anything away
> - Finish it and you get your first grade on the B to AAA scale and your "First contest" badge
>
> Register now at https://basis-psi-roan.vercel.app/contests.

### Short social version (WhatsApp, Discord)

> 🏁 *Basis #2: Alpha Hunt* tomorrow 17:00 IST (11:30 UTC) · 60 minutes · 4 problems
> Rated: your first B–AAA grade. Register: https://basis-psi-roan.vercel.app/contests

---

## 2. Problem of the week: Expected credit loss

**Problem:** `/problems/expected-credit-loss` (Easy, Banking & Credit). It isn't in any contest on the calendar.

> 🧮 *Problem of the week:* Expected credit loss (Easy, Banking & Credit)
>
> **Why it matters:** every bank sets aside provisions for the loans it expects to go bad, and under IFRS 9 that number is built from exactly this calculation. Credit analysts use it to price loans, risk teams to size reserves, and equity analysts to judge whether a bank is provisioning enough.
>
> 💡 **Hint:** EL = PD × LGD × EAD. The problem gives you the *recovery* rate, not the loss: LGD = 1 − recovery.
>
> Solve it (your own numbers): https://basis-psi-roan.vercel.app/problems/expected-credit-loss

---

## 3. Weekly digest (week ending Sat 31 Oct)

This one is short and honest. Post it only if Alpha Hunt has been created, so it ends on something to do.

> 📬 *Basis this week*
>
> **Contests:** Basis #1: The Founding Round ran last Sunday. Nobody registered, so there are no results to share. That's what day one of a new platform looks like, and it means the first leaderboard is still wide open.
>
> **New problems:** none this week. The bank is at 50 problems across 8 tracks.
>
> **Coming up:** Basis #2: Alpha Hunt, tomorrow at 17:00 IST, the first rated round. https://basis-psi-roan.vercel.app/contests
>
> **Try this week:** Expected credit loss, the problem of the week.

There's nothing to report under top posts: the last check of `/community` found no posts. If new problems merge before you post this (#33 and #43 add five), change the "New problems" line to name them.

---

## 4. Discussion prompts

1. **"A bank lends ₹1 crore to a borrower with a 2% chance of default. What else would you want to know before deciding how much to set aside, and why?"** It builds on the problem of the week without giving its answer, and there's no single right reply.
2. **"What's a finance concept you only really understood once you built it in a spreadsheet yourself?"** It's an easy first post for newcomers and tells us which lessons and problems land.

Neither touches a problem on the contest calendar.

---

## 5. Moderation

I couldn't check `/community` this run. Nothing has been reported, and the last check found no posts, so there's nothing to flag.
