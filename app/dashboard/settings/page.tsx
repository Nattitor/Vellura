import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { data: profile, error } = await getProfile();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your profile and global AI context.</p>
      </div>

      <div className="space-y-8">
        <ProfileForm initialResume={profile?.resume_text || ""} />
      </div>
    </div>
  );
}
