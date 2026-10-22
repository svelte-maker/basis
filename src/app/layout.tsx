import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "@/components/NavLinks";
import { Grade } from "@/components/Grade";
import { ratingOf } from "@/lib/services/ratings";
import { logout } from "./actions/auth";

export const metadata: Metadata = {
  title: { default: "Basis: finance, rated", template: "%s · Basis" },
  description: "Solve finance problems, compete in rated contests and earn a verified rating recruiters trust.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const links = [
    { href: "/learn", label: "Learn" },
    { href: "/problems", label: "Problems" },
    { href: "/models", label: "Models" },
    { href: "/teams", label: "Teams" },
    { href: "/cases", label: "Cases" },
    { href: "/contests", label: "Contests" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/community", label: "Community" },
    { href: "/tools", label: "Tools" },
    ...(user && (user.role === "RECRUITER" || user.role === "ADMIN") ? [{ href: "/recruiters", label: "Find candidates" }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const r = user ? ratingOf(user) : null;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap bar">
            <Link href="/" className="logo">Basis <small>finance, rated</small></Link>
            <NavLinks links={links} />
            <div className="me">
              {user && r ? (
                <>
                  <Link href={`/u/${user.handle}`}><span className="num">{r.rating}</span> <Grade grade={r.grade} /></Link>
                  <Link href="/settings" className="muted small">Settings</Link>
                  <form action={logout}><button className="btn quiet small">Log out</button></form>
                </>
              ) : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link href="/signup" className="btn small" style={{ color: "var(--accent-ink)" }}>Join</Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="footer"><div className="wrap row between">
          <span>Basis · a verified rating for finance skill</span>
          <span className="row"><Link href="/learn">Learn</Link><Link href="/learn/glossary">Glossary</Link><Link href="/how-it-works">How ratings work</Link><Link href="/tools">Tools</Link></span>
        </div></footer>
      </body>
    </html>
  );
}
