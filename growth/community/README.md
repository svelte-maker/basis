# Community launch kits

Prepared by the Community Manager agent on 2026-10-21. Everything here is a draft. Svelte creates the accounts and posts; agents never do.

## Where to build, and in what order

Basis today: 47 problems, 8 tracks, contests and a verified rating, free, and brand new (0 members at launch). So the first job is not "a big group" but a small group of people who actually solve problems each week. Pick a few channels and run them well.

| Priority | Platform | Role | Why |
| --- | --- | --- | --- |
| 1 | **LinkedIn** (Company Page + Group) | Credibility and reach | It's where finance students, analysts and recruiters already are, and where members will show their Basis rating. The Page is the brand; the Group is for discussion. Kit: [linkedin.md](linkedin.md) |
| 2 | **WhatsApp Community** | Weekly reminders and daily problem | Highest open rate for students, especially in India. Keep it low-noise: one announcement channel plus one chat group. Kit: [whatsapp.md](whatsapp.md) |
| 3 | **Discord server** | Real-time contest chat, study rooms | CFA/FRM and finance study groups already live on Discord. Threads, roles and voice rooms suit contests and post-contest walkthroughs. Kit: [discord.md](discord.md) |
| 4 | **Telegram channel** (optional) | Mirror of WhatsApp announcements | Many CFA and Indian finance study groups use Telegram. Only add it if WhatsApp is running smoothly. Kit: [telegram.md](telegram.md) |
| — | **Reddit** | Go where people already are | Don't create a subreddit yet; an empty one hurts more than it helps. Post genuinely useful content in existing subreddits under their rules. Playbook: [reddit.md](reddit.md) |

Not recommended yet: Facebook groups (low fit for this audience), Slack (paid history limits, poor discovery), X/Instagram as community spaces (fine for broadcast later, owned by the Growth Marketer).

**The site's own `/community` page is the real home.** Every external channel should point people back to Basis to solve, post and get rated. External groups are for reminders and conversation.

## Shared identity (use the same everywhere)

- **Name:** Basis Finance Community (23 characters, fits WhatsApp's 25-character limit)
- **Short handle ideas:** `basisfinance`, `basis.finance`, `solvebasis` (check availability on each platform; keep it identical across them if you can)
- **One-liner:** LeetCode for finance. Solve real finance problems, earn a verified rating, put it on your resume.
- **Short description (≈150 chars):** Weekly finance contests, a daily problem and a verified B–AAA rating. Valuation, LBOs, fixed income, derivatives and more. Free.
- **Long description:**
  > Basis is a free practice and rating platform for finance. Every member gets their own randomized numbers, so answers can't be copied, and your rating (B to AAA, like a credit rating) is earned in timed contests. This community is where members get the weekly contest reminder and the problem of the day, swap approaches after contests and help each other prepare for interviews and exams like CFA and FRM. Start here: https://basis-psi-roan.vercel.app
- **Logo/avatar:** the Basis logo on a plain background, square, readable at 64 px.
- **Banner text (all platforms):** "Solve. Compete. Get rated." with a smaller line "Weekly finance contests every Sunday · basis-psi-roan.vercel.app" (no clock time, so the banner survives a schedule change)

## Shared rules (paste and adapt per platform)

1. **Be useful and kind.** Critique the model, not the person.
2. **No contest answers during a live contest.** Discuss approaches after it ends. Everyone gets different numbers anyway, so answers don't help.
3. **No spam or self-promotion** (courses, referral links, paid groups, DMs to members) without admin approval.
4. **No confidential information.** Don't share employer, client or deal information, or anything under NDA.
5. **Not investment advice.** Discussion here is educational.
6. **English, please,** so everyone can join in.
7. Admins may remove posts or members who break these rules. Report problems to an admin.

## Before you launch (Svelte)

- [ ] Sign up on Basis with your admin email and check `/community`, `/contests` and your profile look right.
- [ ] Schedule the first weekly contest at `/admin` from [`../contest-calendar.md`](../contest-calendar.md). Launch posts mention it, so it has to exist.
- [ ] Post the first site post on `/community` (draft in [week-1-posts.md](week-1-posts.md)) so the page isn't empty when people arrive.
- [ ] Create a dedicated email (e.g. a Gmail for Basis) for platform accounts, so they aren't tied to your personal one, and turn on two-factor authentication on each.
- [ ] Optional but recommended for WhatsApp: a separate number with the WhatsApp Business app, so your personal number isn't the community's contact.

## Launch order (about 2 hours of your time)

1. LinkedIn Company Page (20 min) → LinkedIn Group (15 min).
2. WhatsApp Community (20 min).
3. Discord server (40 min, most of it is pasting channel descriptions).
4. Put every invite link on the LinkedIn Page "About", the Discord welcome channel and the WhatsApp description. If the Product Engineer adds a "Join the community" block to the site, give them the links in an issue.
5. Post the week 1 schedule in [week-1-posts.md](week-1-posts.md).

## Growing honestly

- Invite people one to one: classmates, colleagues, CFA study partners, university finance clubs (the Growth Marketer drafts club outreach). Never add people to a WhatsApp group without asking; it gets numbers banned.
- Don't buy members, followers or engagement, and don't post "X members" until the number is real.
- Measure what matters: weekly contest participants and problems solved on Basis, not group size.
- Show up every day for the first month. A group where the admin posts the daily problem and answers questions grows; one that only posts links dies.

## Where things live

- Per-platform kits: this folder.
- Weekly announcement drafts: `growth/drafts/<YYYY-MM-DD>-community.md` (Community Manager, Wed and Sat).
- Contest schedule: [`growth/contest-calendar.md`](../contest-calendar.md).
