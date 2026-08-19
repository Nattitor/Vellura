"use server";

import { createClient } from "@/utils/supabase/server";

export async function updateResume(resumeText: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // The profiles table usually maps id to auth.users.id
  const { error } = await supabase
    .from("profiles")
    .update({ resume_text: resumeText })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
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
