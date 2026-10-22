"use client";
import { useEffect, useState } from "react";
import { readDone } from "./progress";

/** A tick that fills in once this browser has passed the lesson's quiz. */
export function LessonTick({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => { setDone(readDone().has(slug)); }, [slug]);
  return <span className={`tick ${done ? "done" : ""}`} aria-label={done ? "Completed" : "Not completed"}>{done ? "✓" : ""}</span>;
}

/** "3 of 20 lessons completed", counted in this browser. */
export function DoneCount({ slugs }: { slugs: string[] }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => { const d = readDone(); setN(slugs.filter((s) => d.has(s)).length); }, [slugs]);
  if (!n) return null;
  return <span className="small muted">Completed <span className="num">{n}/{slugs.length}</span> in this browser</span>;
}
