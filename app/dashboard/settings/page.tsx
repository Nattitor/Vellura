import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { AIUsageForm } from "@/components/dashboard/AIUsageForm";
import { PreferencesForm } from "@/components/dashboard/PreferencesForm";
import { redirect } from "next/navigation";
import { SettingsHeader } from "@/components/dashboard/SettingsHeader";
import { getEffectiveDailyLimit } from "@/utils/limits";

export default async function SettingsPage() {
  const { data: profile, error } = await getProfile();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  // Calculate profile completion
  const hasResume = profile?.resume_text && profile.resume_text.trim().length > 50;
  const hasBYOK = !!profile?.byok_key;
  const completionPercentage = (hasResume ? 60 : 0) + (hasBYOK ? 40 : 0);

  const effectiveLimit = getEffectiveDailyLimit(profile);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <SettingsHeader completionPercentage={completionPercentage} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Context (Takes up 2/3 on extra large screens) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amethyst-glow/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative">
              <ProfileForm 
                initialResume={profile?.resume_text || ""} 
                outputLanguage={profile?.output_language || "English"}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Usage & Preferences */}
        <div className="space-y-8">
          <AIUsageForm 
            dailyLimit={effectiveLimit} 
            hasBYOK={hasBYOK} 
          />
          
          <PreferencesForm initialOutputLanguage={profile?.output_language || "English"} />
        </div>
      </div>
    </div>
  );
}
