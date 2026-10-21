import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/problems" } = await searchParams;
  return (
    <div className="stack" style={{ maxWidth: 440 }}>
      <div><h1>Log in</h1><p className="lede">Pick up where you left off.</p></div>
      <LoginForm next={next} />
      <p className="small muted">New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
      <p className="small muted">Demo accounts (password <span className="num">basis-demo</span>): aarav@demo.basis, recruiter@demo.basis, admin@demo.basis</p>
    </div>
  );
}
