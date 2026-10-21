import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Join" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; role?: string }> }) {
  const { next = "/problems", role } = await searchParams;
  return (
    <div className="stack" style={{ maxWidth: 440 }}>
      <div><h1>Join Basis</h1><p className="lede">Free for finance professionals and students. Recruiters can search verified ratings.</p></div>
      <SignupForm next={next} initialRole={role === "recruiter" ? "RECRUITER" : "MEMBER"} />
      <p className="small muted">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}
