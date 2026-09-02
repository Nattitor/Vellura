"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateAvatar(avatarUrl: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. NEVER store large base64 in auth user_metadata because Supabase embeds user_metadata in the JWT cookie, causing HTTP 431!
  // If user_metadata currently has a base64 avatar, clean it:
  if (user.user_metadata?.avatar_url?.startsWith("data:")) {
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });
  }

  // 2. Store avatar in profiles table (safe from cookie size limits)
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
      
    if (error) {
      console.warn("Notice: avatar_url column in profiles update:", error.message);
      return { error: error.message };
    }
  } catch (err: any) {
    console.warn("Could not save avatar to profiles table:", err);
    return { error: err?.message || "Database update failed" };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function updateProfile(data: { resume_text?: string; output_language?: string; ui_language?: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateResume(resumeText: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ resume_text: resumeText })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateBYOK(key: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ byok_key: key })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateProviderKey(provider: string, key: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch current byok_key
  const { data: profile } = await supabase
    .from("profiles")
    .select("byok_key")
    .eq("id", user.id)
    .single();

  let keys: Record<string, string> = {};
  if (profile?.byok_key) {
    try {
      if (profile.byok_key.trim().startsWith("{")) {
        keys = JSON.parse(profile.byok_key);
      } else {
        keys = { google: profile.byok_key };
      }
    } catch {
      keys = { google: profile.byok_key };
    }
  }

  if (key.trim() === "") {
    delete keys[provider];
  } else {
    keys[provider] = key.trim();
  }

  const serialized = Object.keys(keys).length > 0 ? JSON.stringify(keys) : "";

  const { error } = await supabase
    .from("profiles")
    .update({ byok_key: serialized })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true, keys };
}

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
