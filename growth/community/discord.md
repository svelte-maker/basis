# Discord kit

Discord is the best home for live contest chat, study sessions and threads on specific problems. Keep the channel list short at launch; add channels when existing ones get busy.

## Create it

1. In Discord, click **+** (Add a Server) at the bottom of the server list → **Create My Own** → **For a club or community**.
2. Server name: **Basis Finance Community**. Upload the logo. **Create**.
3. Delete the default channels you don't need, then create the categories and channels below (right-click the server name → **Create Category** / **Create Channel**). Paste each channel's topic into **Edit Channel → Channel Topic**.
4. **Server Settings → Enable Community** and follow the steps:
   - Verification level: **Medium** (account older than 5 minutes) at least; **High** if spam appears.
   - Explicit media content filter: **all members**.
   - Rules channel: `#rules`. Community updates channel: `#mod-log`.
5. **Server Settings → Roles**, create:
   - `@Admin` (you), `@Moderator` (trusted helpers later, manage messages, timeout members)
   - Track roles members can pick: `@Valuation`, `@Accounting`, `@Fixed Income`, `@Derivatives`, `@Private Equity`, `@Risk`, `@Credit`
   - `@Contest pings` (opt in to contest reminders)
   - Grade roles only once members can be verified against `/verify/<id>`: give them manually on request with the link, never self-assigned.
6. **Server Settings → Onboarding**: add one question "What do you want to practise?" with the track roles as answers, and one "Want contest reminders?" → `@Contest pings`. Default channels: `#welcome`, `#problem-of-the-day`, `#general`.
7. **Server Settings → AutoMod**: turn on *Block mention spam*, *Block suspected spam content* and a custom keyword filter for invite-link spam (`discord.gg/`, `t.me/` from non-admins).
8. **Server Settings → Server Profile**: add the banner (960 × 540 px, text "Solve. Compete. Get rated.") and the short description from [README.md](README.md#shared-identity-use-the-same-everywhere).
9. Create an invite: right-click `#welcome` → **Invite People** → **Edit invite link** → *Expire after: Never*, *Max uses: No limit*. Use this link everywhere.

## Channels

**START HERE**
- `#welcome`: read-only. Topic: "Start here. What Basis is, how this server works, and links."
- `#rules`: read-only. Topic: "Server rules. Breaking them gets you removed."
- `#announcements`: read-only. Topic: "Contest reminders, results and new problems. Follow this channel to get them."

**PRACTICE**
- `#problem-of-the-day`: read-only for members; each post opens a thread for discussion. Topic: "One Basis problem a day, with a hint. Discuss in the thread."
- `#ask-anything`: Forum channel. Topic: "Stuck on a concept or problem? Ask here. One post per question. Tags: Valuation, Accounting, Fixed Income, Derivatives, PE, Risk, Credit, Interviews, CFA/FRM."
- `#model-review`: Forum channel. Topic: "Share a model or case write-up and get feedback. Remove anything confidential first."

**CONTESTS**
- `#contest-chat`: Topic: "Chat before and after the weekly contest. No answers, hints or approaches while a contest is live."
- `#post-contest-walkthroughs`: Forum channel. Topic: "After a contest ends: how did you approach each problem?"

**COMMUNITY**
- `#introductions`: Topic: "Who are you, what are you working towards, which track?"
- `#general`
- `#careers`: Topic: "Recruiting, interviews, CFA/FRM and career-switch questions."
- `#feedback-and-bugs`: Topic: "Something wrong on Basis, or a problem you'd like to see? Tell us here."
- 🔊 `Study room` (voice)

**STAFF** (private, admins and mods only)
- `#mod-log`, `#mod-chat`

## #welcome message

> # Welcome to the Basis Finance Community 👋
> Basis is a free practice and rating platform for finance: auto-graded problems with your own randomized numbers, weekly timed contests and a verified rating from **B to AAA**.
>
> **Get started**
> 1. Make an account: https://basis-psi-roan.vercel.app/signup
> 2. Pick your tracks in *Channels & Roles* so you see what matters to you.
> 3. Say hi in #introductions.
> 4. Try today's problem in #problem-of-the-day.
>
> **Every week**
> 🏁 Contest: **Sunday 17:00 IST (11:30 UTC)**, 60 minutes, 4 problems, Easy → Hard. Grab `@Contest pings` to get a reminder.
> 🧮 A problem of the day, every day.
> 🗣️ Post-contest walkthroughs in #post-contest-walkthroughs.
>
> Read #rules before posting. Questions? Ping an `@Admin`.

## #rules message

Paste the shared rules from [README.md](README.md#shared-rules-paste-and-adapt-per-platform), then add:

> 8. Don't DM members to sell anything. Report unwanted DMs to an admin.
> 9. Use the right channel. Forum posts get better answers than chat.

## #introductions: your first message

> Hi, I'm Svelte and I built Basis. I'm working towards {your goal}, and the concept that took me longest to really get was {concept}.
> Your turn: where are you (student, analyst, switching in), which track do you want to improve, and what's one concept you still find confusing?

## Running contests on Discord

- Saturday 13:30 UTC (19:00 IST) and Sunday 10:30 UTC (16:00 IST): post the reminder in `#announcements` with `@Contest pings`.
- During the contest (11:30 to 12:30 UTC, 17:00 to 18:00 IST): set `#contest-chat` to slow mode (1 minute) and remind people "no approaches until it ends".
- After it ends: open a forum post per problem in `#post-contest-walkthroughs`.
- Optional: a voice "walkthrough" in the Study room at 16:15 UTC, 20 minutes.
