import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveInitialLanguage } from "@/utils/i18n/accept-language";
import { languageTypeToBcp47 } from "@/utils/i18n/bcp47";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Auto-clean bloated base64 from user_metadata if present to prevent oversized cookies
      if (data?.user?.user_metadata?.avatar_url?.startsWith("data:")) {
        await supabase.auth.updateUser({
          data: { avatar_url: null },
        });
      }

      // If the OAuth user came in without a ui_language in their metadata
      // (Google OAuth doesn't send one), seed it from the browser's
      // Accept-Language header so the trigger-based profile creation has a
      // sensible default. Existing users are unaffected: the update below
      // only writes when the field is currently null or empty.
      const existingUi = data?.user?.user_metadata?.ui_language;
      if (!existingUi || String(existingUi).trim() === "") {
        const acceptLanguage = request.headers.get("accept-language");
        const detected = resolveInitialLanguage(acceptLanguage);
        await supabase.auth.updateUser({
          data: {
            ui_language: detected,
            preferred_language: languageTypeToBcp47(detected),
          },
        });
      }

      // Email-confirmation flow (option 1): never strand a session in the
      // opener (mobile mail apps open links in throwaway webviews). Drop the
      // session created by the exchange and land on login with the banner.
      if (next.startsWith("/login?verified=true")) {
        await supabase.auth.signOut();
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
