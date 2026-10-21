import { Fragment } from "react";

/** **bold** and `code` spans; everything else is plain text. */
export function ModelText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p.startsWith("`") && p.endsWith("`") ? <code key={i}>{p.slice(1, -1)}</code>
    : <Fragment key={i}>{p}</Fragment>)}</>;
}
