# Contest calendar

Kept four weeks ahead by the Community Manager agent. Svelte creates each contest at /admin from this list until scheduling is automated.

Weekly contests: Sundays 17:00 IST (11:30 UTC), 60 minutes, 4 problems (Easy, Medium, Medium, Hard), mixed tracks (Svelte, 23 Oct). Contest #1 is the exception: 75 minutes, 5 problems, unrated (plan in the project files, 23 Oct). Monthly themed contest: one per month, 90 minutes, 5 problems in one theme.

**Naming (Svelte, 23 Oct):** every contest gets a name with energy that still says what's being tested. Format: `Basis #<n>: <Name>` for weekly contests, `<Name>` plus the month theme for monthly ones. The name is two or three words, riffs on the round's finance theme or deal story (a term a practitioner would recognise, like "Alpha Hunt" for a returns round), and reads well in a story post or a group chat. No emoji in the title, no memes that date in a month, nothing that sounds like investment advice or a get-rich promise, and never the same name twice. Propose it with the problems; Svelte can veto.

| Date (UTC) | Name | Length | Problems |
| --- | --- | --- | --- |
| Sun 25 Oct 2026, 11:30 (17:00 IST) | Basis #1: The Founding Round (unrated) | 75 min | `lbo-sources-and-uses` (E), `unlevered-free-cash-flow` (M), `macaulay-duration` (M), `eps-accretion-dilution` (H), `lbo-exit-returns` (H) |
| ~~Sun 1 Nov 2026~~ | Basis #2: Alpha Hunt (no sign it was created, moved to 8 Nov) | | |
| Sun 8 Nov 2026, 11:30 (17:00 IST) | Basis #2: Alpha Hunt (unrated) | 60 min | `sharpe-ratio` (E), `irr-from-moic` (M), `terminal-value-gordon` (M), `one-step-binomial` (H) |
| Sun 15 Nov 2026, 11:30 (17:00 IST) | Basis #3: Fine Print | 60 min | `current-yield` (E), `cfo-indirect-method` (M), `parametric-var` (M), `fifo-vs-lifo` (H) |
| Wed 18 Nov 2026, 18:00 | Valuation Month: Terminal Velocity | 90 min | `capm-cost-of-equity` (E), `gordon-growth-price` (E), `terminal-value-gordon` (M), `two-stage-ddm` (H), `unlever-relever-beta` (H) |
| Sun 22 Nov 2026, 11:30 (17:00 IST) | Basis #4: Price Discovery | 60 min | `payback-period` (E), `implied-price-from-multiple` (M), `bond-price` (M), `yield-to-maturity` (H) |
| Sun 29 Nov 2026, 11:30 (17:00 IST) | Basis #5: Capital Stack | 60 min | `cet1-ratio` (E), `net-interest-margin` (M), `dividend-recap-irr` (M), `fund-waterfall-carry` (H) |

**Slip of 4 Nov:** there's no sign Alpha Hunt was created for 1 Nov (no agent could reach the site, and Svelte hasn't said), so every weekly round moved back one week and keeps its number and name. Problem swaps made because of [#48](https://github.com/svelte-maker/basis/issues/48) (listed mistakes graded as correct): `black-scholes-call` → `one-step-binomial` in Alpha Hunt, `diluted-shares-tsm` → `cfo-indirect-method` in Fine Print, `two-asset-volatility` → `bond-price` in Price Discovery. Price Discovery and Capital Stack each use two problems fixed by [#38](https://github.com/svelte-maker/basis/pull/38), so #38 needs to merge before 22 Nov. Rounds are unrated until CTO-2's anti-guessing limits ship, unless Svelte decides otherwise.
