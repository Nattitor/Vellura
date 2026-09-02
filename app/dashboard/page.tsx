import { createClient } from "@/utils/supabase/server";
import { GenerateWorkspace } from "@/components/dashboard/GenerateWorkspace";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userKeys: Record<string, string> = {};
  let profile: any = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("byok_key, resume_text, output_language, avatar_url")
      .eq("id", user.id)
      .single();
      
    profile = data;

    if (profile?.byok_key) {
      try {
        if (profile.byok_key.trim().startsWith("{")) {
          userKeys = JSON.parse(profile.byok_key);
        } else {
          userKeys = { google: profile.byok_key };
        }
      } catch (e) {
        userKeys = { google: profile.byok_key };
      }
    }
  }

  const configuredProviders = Object.keys(userKeys).filter(k => !!userKeys[k]?.trim());
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
