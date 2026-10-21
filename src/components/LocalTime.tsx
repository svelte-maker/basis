"use client";
import { useEffect, useState } from "react";

/** Shows a time in the viewer's own timezone, with a UTC fallback for the first render. */
export function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const [text, setText] = useState(d.toISOString().slice(0, 16).replace("T", " ") + " UTC");
  useEffect(() => setText(d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })), [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return <time dateTime={iso}>{text}</time>;
}
