import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { AIUsageForm } from "@/components/dashboard/AIUsageForm";
import { PreferencesForm } from "@/components/dashboard/PreferencesForm";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const { data: profile, error } = await getProfile();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your profile, AI limits, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-8">
          <TabsTrigger value="profile" className="data-[state=active]:bg-amethyst-glow data-[state=active]:text-white text-zinc-400">
            Profile Context
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-amethyst-glow data-[state=active]:text-white text-zinc-400">
            AI & Usage
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-amethyst-glow data-[state=active]:text-white text-zinc-400">
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm initialResume={profile?.resume_text || ""} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <AIUsageForm 
            dailyLimit={profile?.daily_limit ?? 3} 
            hasBYOK={!!profile?.byok_key} 
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
