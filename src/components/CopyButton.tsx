"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState<string | null>(null);
  return (
    <button type="button" className="btn" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone("Copied"); }
      catch { setDone("Select the text and copy it manually"); }
      setTimeout(() => setDone(null), 2500);
    }}>{done ?? label}</button>
  );
}
