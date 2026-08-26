import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getEffectiveDailyLimit } from "@/utils/limits";
import { resolveAIModel } from "@/utils/ai-providers";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AIProviderId, DEFAULT_SPEED_MODEL } from "@/utils/ai-models";
import { extractCompanyAndRole } from "@/utils/extract-company";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    // 2. Parse Request Body
    const body = await req.json();
    console.log("Received generation request:", body);
    
    const { 
      prompt: jobDescription, 
      tone, 
      modelPreference = "speed", // "speed" | "reasoning" | "expert"
      expertModelId,
      expertProviderId,
      temperature = 0.7,
      customDirectives = ""
    } = body;

    if (!jobDescription) {
      return new NextResponse("Job description is required", { status: 400 });
    }

    // 3. Fetch User's Master Resume, Limits, and BYOK
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text, daily_limit, last_generation_date, byok_key, output_language")
      .eq("id", user.id)
      .single();

    const resumeText = profile?.resume_text;

    if (!resumeText || resumeText.trim() === "") {
      return new NextResponse("Master resume not found. Please add it in settings.", {
        status: 400,
      });
    }

    // Parse user BYOK keys
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

    const today = new Date().toISOString().split('T')[0];
    const currentLimit = getEffectiveDailyLimit(profile);
    const isExpert = modelPreference === "expert";
    // isUsingOwnKey is true strictly in Expert Mode when the user provided their own key for that provider
    const isUsingOwnKey = isExpert && !!expertProviderId && !!(userKeys && userKeys[expertProviderId]?.trim());

    // Daily limit check applies if the user is NOT using their own API key for this provider
    if (!isUsingOwnKey && currentLimit <= 0) {
      return new NextResponse("You have reached your daily limit.", { status: 402 });
    }

    // 4. Resolve Model & Provider
    const { model, modelName } = resolveAIModel({
      providerId: expertProviderId as AIProviderId,
      modelId: expertModelId,
      mode: modelPreference === "expert" ? "expert" : modelPreference,
      userKeys,
    });

    // 5. Construct Prompts
    const systemPrompt = `You are an elite, highly persuasive executive cover letter writer. 
Your task is to write a highly tailored cover letter based on the user's master resume and the provided job description.
Tone: ${tone || "Professional & Polished"}
Target Language: ${profile?.output_language || "English"} (You MUST output the letter entirely in this language).
${customDirectives ? `Special Instructions: ${customDirectives}` : ""}
Keep the letter concise (3-4 paragraphs max), highly impactful, and avoiding cliché buzzwords. Focus on aligning the user's past impact with the job's requirements. Do not invent facts that are not in the resume. Output standard markdown.

CRITICAL INSTRUCTION:
On the very first line of your response, output an HTML metadata comment with the clean Company Name and Job Title in this exact format:
<!-- TARGET: [Exact Company Name] • [Exact Job Title] -->
(Examples: <!-- TARGET: Mercado Libre • Líder Técnico Backend -->, <!-- TARGET: Stripe • Senior Frontend Engineer -->, <!-- TARGET: TechCorp • Desarrollador Full Stack -->. If company is not mentioned, write <!-- TARGET: Empresa • [Exact Job Title] -->).
Follow this immediately with a blank line and then begin the cover letter text.`;

    const userPrompt = `USER RESUME:
${resumeText}

-----------------

JOB DESCRIPTION:
${jobDescription}`;

    // 6. DB Finish Callback
    const handleFinish = async (text: string, usedModelName: string, wasFallback = false) => {
      try {
        if (!text || text.trim().length < 150) {
          console.warn("Generation incomplete or aborted (<150 chars), skipping DB save and limit deduction.");
          return;
        }
        const trimmed = text.trim();
        // Do not save error payloads from failed provider streams into the database
        if (
          trimmed.startsWith('{"type":"error"') ||
          trimmed.startsWith('{"error"') ||
          trimmed.includes('"insufficient_quota"') ||
          trimmed.includes('"invalid_api_key"') ||
          trimmed.includes('"model_not_found"')
        ) {
          console.warn("Generation returned an error payload from provider:", trimmed);
          return;
        }

        const staticSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              fetch: (url, init) => {
                const newInit = { ...init };
                delete newInit.signal;
                return fetch(url, newInit);
              }
            },
          }
        );
        
        // Deduct limit only if valid completion and using free tier
        if (!isUsingOwnKey && !wasFallback) {
          const { error: profileError } = await staticSupabase
            .from("profiles")
            .update({ 
              daily_limit: Math.max(0, currentLimit - 1),
              last_generation_date: today
            })
            .eq("id", user.id);
            
          if (profileError) console.error("Error updating limits:", profileError);
        }

        const companyAndRole = extractCompanyAndRole(jobDescription, text);
        const cleanText = text.replace(/<!--[\s\S]*?-->/g, "").trim();

        const { error: docError } = await staticSupabase
          .from("documents")
          .insert({
            user_id: user.id,
            company_name: companyAndRole,
            job_description: jobDescription,
            generated_content: cleanText,
            ai_model_used: wasFallback ? `${usedModelName} (Fallback)` : usedModelName
          });
          
        if (docError) console.error("Error inserting document:", docError);
      } catch (err) {
        console.error("Unhandled error in onFinish:", err);
      }
    };

    // 7. Stream text response with native non-blocking SSE response
    const streamResult = streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: typeof temperature === "number" ? temperature : 0.7,
      onFinish: async ({ text }) => handleFinish(text, modelName, false),
    });

    return streamResult.toTextStreamResponse({
      headers: {
        "X-AI-Model": modelName,
      },
    });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new NextResponse(
      error.message || "Error al conectar con el proveedor de IA.", 
      { status: 422 }
    );
  }
}
