import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Topbar } from "@/components/dashboard/Topbar";
import { LanguageProvider } from "@/components/providers/language-provider";
import { AvatarProvider } from "@/components/providers/avatar-provider";
import { QuotaProvider } from "@/components/providers/quota-provider";
import { LanguageType } from "@/utils/i18n/dictionaries";
import { getEffectiveDailyLimit } from "@/utils/limits";

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

  // Fetch the user's profile to get daily limit, last generation date, and ui_language
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_limit, last_generation_date, ui_language, byok_key")
    .eq("id", user.id)
    .single();

  const initialLang = (profile?.ui_language as LanguageType) || "English";
  const effectiveLimit = getEffectiveDailyLimit(profile);

  return (
    <LanguageProvider initialLanguage={initialLang}>
      <AvatarProvider>
        <QuotaProvider initialLimit={effectiveLimit}>
          <div className="min-h-screen bg-deep-void selection:bg-amethyst-glow/30 selection:text-white flex flex-col">
            <Topbar userEmail={user.email || "User"} />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </QuotaProvider>
      </AvatarProvider>
    </LanguageProvider>
  );
}
