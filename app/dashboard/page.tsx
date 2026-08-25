import { GenerateWorkspace } from "@/components/dashboard/GenerateWorkspace";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveDailyLimit } from "@/utils/limits";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dailyLimit = 3; // fallback
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_limit, last_generation_date, byok_key")
      .eq("id", user.id)
      .single();
    dailyLimit = getEffectiveDailyLimit(profile);
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <GenerateWorkspace initialDailyLimit={dailyLimit} />
    </div>
  );
}
