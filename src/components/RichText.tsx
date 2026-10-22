import { Fragment } from "react";

/** Renders text with **bold** and `code` spans. Everything else is plain text, so it is safe for user content. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i}>{p.slice(1, -1)}</code>
    : <Fragment key={i}>{p}</Fragment>)}</>;
}
