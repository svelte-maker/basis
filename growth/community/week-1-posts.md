# Week 1 posts (Thu 22 Oct to Wed 28 Oct 2026)

Drafts for Svelte to post. Times are UTC. "Everywhere" means WhatsApp Announcements, Discord `#problem-of-the-day` (or `#announcements`) and the Telegram channel if you set one up. Each daily problem uses the WhatsApp format from [whatsapp.md](whatsapp.md#message-formats-reuse-every-week).

**Contest #1 is the Founding Round:** Sunday 25 Oct, 17:00 IST (11:30 UTC), 75 minutes, 5 problems, **unrated**. It ends at 18:15 IST (12:45 UTC).

**Launching later than Thursday?** Post the Thursday rows (A, B and the welcome messages) on the day you launch, then carry on from that day's row.

**Depends on:** the Founding Round being scheduled at `/admin` (see [contest-calendar.md](../contest-calendar.md)). If it isn't, drop the contest lines and say "first contest coming soon".

| Day | Where | Post |
| --- | --- | --- |
| Thu 22, 08:00 | Basis `/community` | Site welcome post (A) |
| Thu 22, 09:00 | LinkedIn personal + Page | Launch post (B), share to Group |
| Thu 22, 09:30 | Everywhere | Welcome messages from each kit, then problem of the day: WACC |
| Fri 23, 08:00 | Everywhere | Problem of the day: EV bridge |
| Fri 23, 12:00 | LinkedIn Group, Discord `#ask-anything` | Discussion prompt 1 |
| Sat 24, 08:00 | Everywhere | Problem of the day: cash from operations |
| Sat 24, 13:30 (19:00 IST) | Everywhere, LinkedIn Page | Contest reminder (C) |
| Sun 25, 10:30 (16:00 IST) | Everywhere | Contest reminder, "in one hour" |
| Sun 25, 12:50 (18:20 IST) | Everywhere | Contest wrap-up (D) |
| Mon 26, 08:00 | Everywhere | Problem of the day: bond price |
| Tue 27, 08:00 | Everywhere | Problem of the day: put-call parity |
| Tue 27, 12:00 | LinkedIn Group, Discord | Discussion prompt 2 |
| Wed 28, 08:00 | Everywhere | Problem of the day: LBO exit returns |
| Wed 28, 09:00 | LinkedIn personal | "What I learned in week 1" (E), written by you from what actually happened |

## A. Site welcome post (`/community`, type: Question or Discussion)

**Title:** Welcome to Basis: introduce yourself

> Basis is a place to get better at finance by doing it, and to prove it with a rating.
>
> If you're new, start with any Easy problem in a track you like, then join our first contest, the Founding Round, on Sunday 25 Oct at 17:00 IST (11:30 UTC). It's unrated, so it's a free run at the format; ratings start with the rated weekly contests after it.
>
> Reply with: where you are (student, analyst, switching in), the track you want to improve, and one concept you still find confusing. I'll use the answers to decide which problems we add next.

## B. LinkedIn launch post (personal profile; reshare from the Page)

> Finance has no LeetCode. So I built one.
>
> If you want a job in banking, PE or asset management, you're asked to prove you can value a company, read a cash-flow statement or price an option. But there's no good place to practise that with feedback, and no way to show a recruiter you can do it except by saying so.
>
> Basis is my attempt to fix that. It's free:
> • 47 auto-graded problems across 8 tracks: accounting, corporate finance, valuation, fixed income, derivatives, PE, portfolio & risk, banking & credit
> • You get your own randomized numbers, so answers can't be copied
> • Weekly timed contests, Sundays 17:00 IST (11:30 UTC), that feed a rating from B to AAA
> • A public verification link for your resume
>
> The first contest, an unrated Founding Round, is this Sunday at 17:00 IST (11:30 UTC). It's early, so things will break and problems will be missing. Tell me what you'd want to see.
>
> Link in the first comment. 👇
>
> #Finance #FinancialModeling #Valuation #CFA #InvestmentBanking

First comment: `Try it here: https://basis-psi-roan.vercel.app` plus the LinkedIn Group link.

## Problems of the day

**Thu: WACC** (Easy, Corporate Finance) · `/problems/wacc`
> Why it matters: WACC is the discount rate in almost every DCF, and getting it wrong moves the valuation more than most forecast changes.
> 💡 Hint: weight debt and equity by market value, and use the after-tax cost of debt: rd × (1 − tax rate).

**Fri: Bridge from market cap to EV** (Easy, Valuation) · `/problems/enterprise-value-bridge`
> Why it matters: comps and DCFs both live in enterprise value; the bridge is how you get back to a share price.
> 💡 Hint: EV = market cap + debt + preferred + minority interest − cash.

**Sat: Cash from operations, indirect method** (Medium, Accounting) · `/problems/cfo-indirect-method`
> Why it matters: profitable companies run out of cash all the time. This is where you see why.
> 💡 Hint: start from net income, add back non-cash charges like D&A, subtract increases in working-capital assets, add increases in working-capital liabilities.

**Mon: Price a coupon bond** (Medium, Fixed Income) · `/problems/bond-price`
> Why it matters: every fixed-income role starts here, and so do many interview questions.
> 💡 Hint: price = PV of each coupon + PV of face value, discounted at the yield per period. Check whether coupons are annual or semi-annual.

**Tue: Put-call parity** (Medium, Derivatives) · `/problems/put-call-parity`
> Why it matters: it ties calls, puts, the stock and cash together; if it breaks, there's an arbitrage.
> 💡 Hint: call + PV(strike) = put + stock price. Discount the strike to today.

**Wed: LBO exit returns** (Hard, Private Equity) · `/problems/lbo-exit-returns`
> Why it matters: MOIC and IRR are the two numbers every PE deal is judged on.
> 💡 Hint: exit equity = exit EV − net debt at exit; MOIC = exit equity ÷ equity invested; IRR = MOIC^(1/years) − 1.

## Discussion prompts

1. **"Walk through how you'd value a company with negative EBITDA."** Which methods still work, and what would you look at instead of EV/EBITDA?
2. **"What's one finance concept that only clicked for you after you calculated it by hand?"** Share the concept and what made it click.

## C. Contest reminder (Saturday)

> 🏁 The Basis Founding Round is tomorrow, Sunday 25 Oct, 17:00 IST (11:30 UTC).
> 75 minutes · 5 problems from Easy to Hard · everyone gets their own numbers.
> It's unrated: a free run at the format before rated weekly contests begin.
> Register: https://basis-psi-roan.vercel.app/contests

## D. Contest wrap-up (Sunday after it ends)

Fill in only from the live standings page. Don't post numbers you haven't seen there.

> 🏁 The Founding Round is done. Thank you to everyone who took part.
> Final standings: https://basis-psi-roan.vercel.app/contests (unrated, so no rating changes this time)
> Approaches are open now: share how you tackled each problem in the Lounge / #post-contest-walkthroughs.
> Next contest: Sunday 1 Nov, 17:00 IST (11:30 UTC), rated.

## E. "What I learned in week 1" (LinkedIn, you write it)

Prompts for you: what surprised you about who joined, the most common question, one thing you fixed or will build because of feedback. Use real numbers from the site only (sign-ups, contest participants) or leave numbers out.
