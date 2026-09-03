"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { languageTypeToBcp47 } from "@/utils/i18n/bcp47";
import { LanguageType } from "@/utils/i18n/dictionaries";
import { toAuthErrorCode } from "@/utils/i18n/auth-errors";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: toAuthErrorCode(error.message) };
  }

  // Clean bloated base64 from user_metadata if it was previously set
  if (data?.user?.user_metadata?.avatar_url?.startsWith("data:")) {
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const preferredLanguage = (formData.get("preferredLanguage") as LanguageType) || "Spanish";
  const langCode = languageTypeToBcp47(preferredLanguage);

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        preferred_language: langCode,
        ui_language: preferredLanguage,
      },
    },
  });

  if (error) {
    return { error: toAuthErrorCode(error.message) };
  }

  if (data?.user?.identities?.length === 0) {
    return { error: "EMAIL_EXISTS" };
  }

  if (!data.session) {
    return { 
      success: true, 
      requiresVerification: true, 
      email 
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "INVALID_EMAIL" };
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
  });

  if (error) {
    return { error: toAuthErrorCode(error.message) };
  }

  return { success: true };
}

export async function updateUserPassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "NOT_SIGNED_IN" };
  }

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "WEAK_PASSWORD" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "PASSWORD_MISMATCH" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: toAuthErrorCode(error.message) };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getUserAuthDetails() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const identities = user.identities || [];
  const providers = identities.map((id) => id.provider);

  return {
    id: user.id,
    email: user.email || "",
    providers,
    hasGoogle: providers.includes("google") || user.app_metadata?.provider === "google",
    hasPassword: providers.includes("email"),
    createdAt: user.created_at,
  };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: toAuthErrorCode(error.message) };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
