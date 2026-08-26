import { createClient } from "@/utils/supabase/server";
import { GenerateWorkspace } from "@/components/dashboard/GenerateWorkspace";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userKeys: Record<string, string> = {};
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("byok_key")
      .eq("id", user.id)
      .single();
      
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

  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <GenerateWorkspace configuredProviders={configuredProviders} />
    </div>
  );
}
