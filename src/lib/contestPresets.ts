// Ready-made contest settings an admin can load into the /admin form, review and schedule.

export type ContestPreset = {
  title: string;
  description: string;
  /** UTC, as the form's datetime-local input expects. */
  start: string;
  minutes: number;
  rated: boolean;
  problems: string[];
};

export const CONTEST_PRESETS: Record<string, { label: string; preset: ContestPreset }> = {
  "founding-round": {
    label: "Basis #1: The Founding Round (Sun 25 Oct, 17:00 IST)",
    preset: {
      title: "Basis #1: The Founding Round",
      description: "Founding Round: the first Basis contest. Five problems that follow one buyout, from Easy to Hard, in 75 minutes. Everyone gets their own numbers. Unrated: ratings start once our anti-guessing checks ship. Points drop 2 a minute and 50 per wrong answer, so accuracy beats speed. Calculator or spreadsheet welcome. Start with LBO sources and uses. Worked solutions go up when it ends.",
      start: "2026-10-25T11:30",
      minutes: 75,
      rated: false,
      problems: ["lbo-sources-and-uses", "unlevered-free-cash-flow", "macaulay-duration", "eps-accretion-dilution", "lbo-exit-returns"],
    },
  },
};
