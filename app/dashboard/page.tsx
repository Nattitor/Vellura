import { createClient } from "@/utils/supabase/server";
import { GenerateWorkspace } from "@/components/dashboard/GenerateWorkspace";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { getConfiguredProviders } from "@/utils/byok";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: any = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("byok_key, resume_text, output_language, avatar_url")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  // Only the list of configured providers is derived here; the actual
  // (encrypted) key values in profile.byok_key never leave the server.
  const configuredProviders = getConfiguredProviders(profile?.byok_key);
  const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <OnboardingWizard
        userEmail={user?.email || ""}
        initialResume={profile?.resume_text || ""}
        initialOutputLang={profile?.output_language || "Spanish"}
        googleAvatarUrl={googleAvatarUrl}
      />
      <GenerateWorkspace configuredProviders={configuredProviders} />
    </div>
  );
}
