# Community drafts: Wednesday 18 Nov 2026

This Community Manager run is kept short. It holds drafts only, for Svelte to post. Times are IST, with UTC in brackets.

## Where things stand

- The agents' network still can't reach the live site. The last check was on 6 Nov and showed 1 member, 50 problems and no contest scheduled.
- Nothing has merged to `main` since Fri 23 Oct.
- **Basis #3: Fine Print (15 Nov) is marked missed.** Nobody could confirm it was created. Alpha Hunt (8 Nov) was marked missed on 11 Nov.
- **Calendar changes, pushed to [#52](https://github.com/svelte-maker/basis/pull/52):** both missed rounds are marked. [#48](https://github.com/svelte-maker/basis/issues/48) still isn't fixed, so as planned I swapped the last two problems on its list out of the upcoming rounds:
  - `implied-price-from-multiple` → `jensens-alpha` in Basis #4: Price Discovery (22 Nov)
  - `net-interest-margin` → `loan-payment` in Basis #5: Capital Stack (29 Nov)

**For Svelte:**
1. **Answer the pause card** in the project thread. I recommend pausing until there are about 10 members.
2. **If contests continue:** merge #52 and #38 (Price Discovery uses `yield-to-maturity`, which #38 fixes). Then create Price Discovery at `/admin` for Sun 22 Nov, 17:00 IST, 60 min, unrated, with `payback-period`, `jensens-alpha`, `bond-price` and `yield-to-maturity`, and post section 1.
3. **Allow `basis-psi-roan.vercel.app`** in the agents' network settings.

---

## 1. Next contest: Basis #4: Price Discovery (Sun 22 Nov)

**Post this only if contests continue and the round shows on `/contests`.**

### Site post (`/community`, type: Discussion)

**Title:** Basis #4: Price Discovery, Sunday 22 Nov, 17:00 IST

> The next Basis contest is **Sunday 22 Nov, 17:00 IST (11:30 UTC)**.
>
> - 60 minutes and 4 problems, Easy to Hard, on what things are worth: payback, risk-adjusted performance, bond prices and yields
> - Everyone gets their own numbers
> - Finish it to earn the "First contest" badge on your profile
>
> Register at https://basis-psi-roan.vercel.app/contests.

### Short social version (WhatsApp, Discord)

> 🏁 *Basis #4: Price Discovery* · Sun 22 Nov, 17:00 IST (11:30 UTC)
> 60 minutes · 4 problems · your "First contest" badge
> Register: https://basis-psi-roan.vercel.app/contests

---

## 2. Problem of the week: Long straddle profit

**Problem:** `/problems/straddle-payoff` (Easy, Derivatives). It isn't in any contest on the calendar.

> 🧮 *Problem of the week:* Long straddle profit (Easy, Derivatives)
>
> **Why it matters:** a straddle is a bet on *how far* a price moves, not which way. Traders buy them before earnings, budget announcements and rate decisions. The two premiums tell you how big a move the market already expects.
>
> 💡 **Hint:** only one leg pays off at expiry. Take the distance between the final price and the strike, then subtract *both* premiums.
>
> Solve it (your own numbers): https://basis-psi-roan.vercel.app/problems/straddle-payoff

---

## 3. Discussion prompts

1. **"Before a big announcement, options get more expensive. If you think the move will be large, why might a straddle still lose money?"** This builds on the problem of the week without giving away its answer.
2. **"If you could add one topic to Basis, what would it be?"** It's an easy first post, and the answers feed straight into which problems get written next.

Neither prompt touches a problem on the contest calendar.

---

## 4. Moderation

I couldn't check `/community` this run. Nothing has been reported, so there's nothing to flag.
