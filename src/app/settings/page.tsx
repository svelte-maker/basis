import { requireUser } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const u = await requireUser("/settings");
  return (
    <div className="stack">
      <div><h1>Profile settings</h1><p className="lede">This is what recruiters and the community see on your profile.</p></div>
      <SettingsForm user={{ name: u.name, headline: u.headline, location: u.location, bio: u.bio, company: u.company, openToWork: u.openToWork, role: u.role }} />
    </div>
  );
}
