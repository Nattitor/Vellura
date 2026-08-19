import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile to get credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-deep-void selection:bg-amethyst-glow/30 selection:text-white flex flex-col">
      <Topbar userEmail={user.email || "User"} credits={profile?.credits ?? 5} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
