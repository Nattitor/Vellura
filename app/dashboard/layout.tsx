import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Topbar } from "@/components/dashboard/Topbar";
import { BottomNav } from "@/components/dashboard/BottomNav";
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

  // Fetch the user's profile to get daily limit, last generation date, ui_language and output_language
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const initialLang = (profile?.ui_language as LanguageType) || "Spanish";
  // Sync the AI output language to the UI language whenever the DB column is empty
  // or missing. This avoids the "Spanish UI but English letter" footgun for users
  // who never opened Settings.
  const initialOutputLang =
    (profile?.output_language && String(profile.output_language).trim() !== ""
      ? String(profile.output_language)
      : null) || initialLang;
  const effectiveLimit = getEffectiveDailyLimit(profile);
  
  // Extract cloud avatar from profile or user metadata (Google OAuth picture)
  const cloudAvatar = 
    (profile as { avatar_url?: string | null } | null)?.avatar_url || 
    user.user_metadata?.avatar_url || 
    user.user_metadata?.picture || 
    null;

  return (
    <LanguageProvider initialLanguage={initialLang} initialOutputLanguage={initialOutputLang}>
      <AvatarProvider initialAvatar={cloudAvatar}>
        <QuotaProvider initialLimit={effectiveLimit}>
          <div className="min-h-screen bg-deep-void selection:bg-amethyst-glow/30 selection:text-white flex flex-col">
            <Topbar userEmail={user.email || "User"} />
            {/* F1 mobile: bottom padding clears the fixed tab bar (+ safe-area) */}
            <main className="flex-1 flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </QuotaProvider>
      </AvatarProvider>
    </LanguageProvider>
  );
}
