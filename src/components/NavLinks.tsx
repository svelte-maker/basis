"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href || path.startsWith(l.href + "/") ? "on" : ""}>{l.label}</Link>
      ))}
    </nav>
  );
}
