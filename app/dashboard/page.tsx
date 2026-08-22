import { GenerateWorkspace } from "@/components/dashboard/GenerateWorkspace";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let credits = 5; // fallback
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    credits = profile?.credits ?? 5;
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <GenerateWorkspace initialCredits={credits} />
    </div>
  );
}
