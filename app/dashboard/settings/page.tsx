import { getProfile } from "@/app/actions/profile";
import { getUserAuthDetails } from "@/app/actions/auth";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { redirect } from "next/navigation";
import { SettingsHeader } from "@/components/dashboard/SettingsHeader";
import { getEffectiveDailyLimit } from "@/utils/limits";

export default async function SettingsPage() {
  const { data: profile, error } = await getProfile();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  const authDetails = await getUserAuthDetails();

  // Parse keys
  let userKeys: Record<string, string> = {};
  if (profile?.byok_key) {
    try {
      if (profile.byok_key.trim().startsWith("{")) {
        userKeys = JSON.parse(profile.byok_key);
      } else {
        userKeys = { google: profile.byok_key };
      }
    } catch {
      userKeys = { google: profile.byok_key };
    }
  }

  // Calculate granular profile completion (4 pillars: Avatar 25%, Master Resume 40%, Preferences 20%, BYOK 15%)
  const hasAvatar = !!profile?.avatar_url;
  const hasResume = !!profile?.resume_text && profile.resume_text.trim().length > 20;
  const hasPreferences = !!profile?.ui_language || !!profile?.output_language;
  const hasBYOK = Object.keys(userKeys).length > 0;

  const completionPercentage =
    (hasAvatar ? 25 : 0) +
    (hasResume ? 40 : 0) +
    (hasPreferences ? 20 : 0) +
    (hasBYOK ? 15 : 0);

  const effectiveLimit = getEffectiveDailyLimit(profile);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <SettingsHeader completionPercentage={completionPercentage} />

      <SettingsView
        initialResume={profile?.resume_text || ""}
        outputLanguage={profile?.output_language || "English"}
        dailyLimit={effectiveLimit}
        hasBYOK={hasBYOK}
        userKeys={userKeys}
        authDetails={authDetails}
      />
    </div>
  );
}
