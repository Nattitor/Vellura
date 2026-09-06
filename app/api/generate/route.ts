import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getEffectiveDailyLimit } from "@/utils/limits";
import { resolveAIModel } from "@/utils/ai-providers";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { AIProviderId, DEFAULT_SPEED_MODEL } from "@/utils/ai-models";
import { extractCompanyAndRole } from "@/utils/extract-company";
import { parseStoredUserKeys } from "@/utils/byok";
import { normalizeOutputLanguage } from "@/utils/i18n/normalize-language";

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
      .select("resume_text, daily_limit, last_generation_date, byok_key, output_language, ui_language")
      .eq("id", user.id)
      .single();

    const resumeText = profile?.resume_text;

    if (!resumeText || resumeText.trim() === "") {
      return new NextResponse("Master resume not found. Please add it in settings.", {
        status: 400,
      });
    }

    // Decrypt and parse user BYOK keys (profiles.byok_key is stored encrypted)
    const userKeys = parseStoredUserKeys(profile?.byok_key);

    const today = new Date().toISOString().split('T')[0];
    const currentLimit = getEffectiveDailyLimit(profile);
    const isExpert = modelPreference === "expert";
    // isUsingOwnKey is true strictly in Expert Mode when the user provided their own key for that provider
    const isUsingOwnKey = isExpert && !!expertProviderId && !!(userKeys && userKeys[expertProviderId]?.trim());

    // Daily limit check applies if the user is NOT using their own API key for this provider
    if (!isUsingOwnKey && currentLimit <= 0) {
      return new NextResponse("You have reached your daily limit.", { status: 402 });
    }

    // Pre-flight: validate at least one functional key exists before attempting cascade
    const hasGoogleKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !!userKeys.google;
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY || !!userKeys.openrouter;
    const hasGroqKey = !!process.env.GROQ_API_KEY || !!userKeys.groq;
    if (!isUsingOwnKey && !hasGoogleKey && !hasOpenRouterKey && !hasGroqKey) {
      return new NextResponse(
        "No API keys configured. Add a provider key in Settings > Advanced, or contact support.",
        { status: 400 }
      );
    }

    // 4. Construct Prompts
    // Language priority: explicit output_language > ui_language > Spanish fallback.
    // Both columns are clamped to canonical names (never ISO codes) on write,
    // but normalize defensively: a raw code here ("es") would make the model
    // ignore the target language and answer in English.
    const targetLanguage = normalizeOutputLanguage(
      profile?.output_language || profile?.ui_language,
      "Spanish"
    );
    const systemPrompt = `You are an elite, highly persuasive executive cover letter writer.
Your task is to write a highly tailored cover letter based on the user's master resume and the provided job description.
Tone: ${tone || "Professional & Polished"}
Target Language: ${targetLanguage} (You MUST output the letter entirely in this language).
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

    // 5. DB Finish Callback
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
        
        const companyAndRole = extractCompanyAndRole(jobDescription, text);
        const cleanText = text.replace(/<!--[\s\S]*?-->/g, "").trim();
        const finalModelUsed = wasFallback ? `${usedModelName} (Fallback)` : usedModelName;

        // Try atomic RPC function first (single-transaction quota decrement + document insert)
        const { data: rpcResult, error: rpcError } = await staticSupabase.rpc(
          "consume_limit_and_save_document",
          {
            p_company_name: companyAndRole,
            p_job_description: jobDescription,
            p_generated_content: cleanText,
            p_ai_model_used: finalModelUsed,
            p_is_using_own_key: isUsingOwnKey,
          }
        );

        if (rpcError) {
          console.warn("Notice: RPC consume_limit_and_save_document not available, using fallback operations:", rpcError.message);
          // Defensive fallback if RPC not yet created in Supabase SQL editor
          if (!isUsingOwnKey) {
            const { error: profileError } = await staticSupabase
              .from("profiles")
              .update({
                daily_limit: Math.max(0, currentLimit - 1),
                last_generation_date: today,
                updated_at: new Date().toISOString()
              })
              .eq("id", user.id);
              
            if (profileError) console.error("Error updating limits (fallback):", profileError);
          }

          const { error: docError } = await staticSupabase
            .from("documents")
            .insert({
              user_id: user.id,
              company_name: companyAndRole,
              job_description: jobDescription,
              generated_content: cleanText,
              ai_model_used: finalModelUsed
            });
            
          if (docError) console.error("Error inserting document (fallback):", docError);
        } else {
          console.log("Atomic document persistence & limit consumption succeeded:", rpcResult);
        }
      } catch (err) {
        console.error("Unhandled error in onFinish:", err);
      }
    };

    // 6. Build Candidate Model List
    // Three independent free quotas: Groq direct (LPU, no credit card,
    // most reliable) → Google direct → OpenRouter :free → Google last
    // resort. Each provider is short-circuited independently on its first
    // 429/403 (see catch block).
    const openrouterKey = userKeys.openrouter || process.env.OPENROUTER_API_KEY;
    console.log(`[OpenRouter] system env key present: ${!!process.env.OPENROUTER_API_KEY}, user BYOK present: ${!!userKeys.openrouter}`);
    let openrouterClient = null;
    if (openrouterKey) {
      openrouterClient = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: userKeys.openrouter || process.env.OPENROUTER_API_KEY,
        headers: {
          "HTTP-Referer": "https://vellura-ai.vercel.app",
          "X-Title": "Vellura AI Workspace",
        },
      });
      console.log(`[OpenRouter] client initialized, key prefix: ${openrouterKey.substring(0, 12)}...`);
    } else {
      console.warn(`[OpenRouter] NO KEY available - cascade will only use Google direct models`);
    }

    // Groq direct: independent free quota (no credit card), OpenAI-compatible.
    const groqKey = userKeys.groq || process.env.GROQ_API_KEY;
    console.log(`[Groq] system env key present: ${!!process.env.GROQ_API_KEY}, user BYOK present: ${!!userKeys.groq}`);
    let groqClient = null;
    if (groqKey) {
      groqClient = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: userKeys.groq || process.env.GROQ_API_KEY,
      });
      console.log(`[Groq] client initialized, key prefix: ${groqKey.substring(0, 7)}...`);
    } else {
      console.warn(`[Groq] NO KEY available - cascade will skip Groq candidates`);
    }

    const googleClient = createGoogleGenerativeAI({
      apiKey: userKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    let candidateConfigs: Array<{ model: any; modelName: string; provider: AIProviderId; isFallback: boolean }> = [];

    if (modelPreference === "speed") {
      // Speed Mode: Groq Qwen3.8 27B → Google 3.7 → OpenRouter free-tier
      // models (shared 50/day per-account quota) → Gemini 3.6 Flash last resort.
      candidateConfigs = [
        ...(groqClient
          ? [{ model: groqClient("qwen/qwen3.8-27b"), modelName: "qwen/qwen3.8-27b", provider: "groq" as AIProviderId, isFallback: false }]
          : []),
        { model: googleClient("gemini-3.7-flash"), modelName: "gemini-3.7-flash", provider: "google", isFallback: false },
        ...(openrouterClient
          ? [{ model: openrouterClient("nvidia/nemotron-3.5-lightning:free"), modelName: "nemotron-3.5-lightning", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        ...(openrouterClient
          ? [{ model: openrouterClient("z-ai/glm-5.2:free"), modelName: "glm-5.2", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        ...(openrouterClient
          ? [{ model: openrouterClient("poolside/laguna-xs-2.1:free"), modelName: "laguna-xs-2.1", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        { model: googleClient("gemini-3.6-flash"), modelName: "gemini-3.6-flash", provider: "google", isFallback: true },
      ];
    } else if (modelPreference === "reasoning") {
      // Reasoning Mode: Groq GPT-OSS 120B → Gemma 4 (Google) → OpenRouter free
      // reasoning models → Gemini 3.6 Flash (last resort).
      candidateConfigs = [
        ...(groqClient
          ? [{ model: groqClient("openai/gpt-oss-120b"), modelName: "openai/gpt-oss-120b", provider: "groq" as AIProviderId, isFallback: false }]
          : []),
        { model: googleClient("gemma-4-31b-it"), modelName: "gemma-4-31b-it", provider: "google", isFallback: false },
        ...(openrouterClient
          ? [{ model: openrouterClient("nvidia/nemotron-3-ultra-550b-a55b:free"), modelName: "nemotron-3-ultra", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        ...(openrouterClient
          ? [{ model: openrouterClient("google/gemma-4-26b-a4b-it:free"), modelName: "gemma-4-26b", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        ...(openrouterClient
          ? [{ model: openrouterClient("google/gemma-4-31b-it:free"), modelName: "gemma-4-31b-it", provider: "openrouter" as AIProviderId, isFallback: true }]
          : []),
        { model: googleClient("gemini-3.6-flash"), modelName: "gemini-3.6-flash", provider: "google", isFallback: true },
      ];
    } else {
      // Expert Mode: user selected specific model & provider
      const resolved = resolveAIModel({
        providerId: expertProviderId as AIProviderId,
        modelId: expertModelId,
        mode: "expert",
        userKeys,
      });
      candidateConfigs = [
        { model: resolved.model, modelName: resolved.modelName, provider: resolved.provider, isFallback: false }
      ];
      // If user selected Gemini 3.7 in expert mode, also offer Gemini 3.6 fallback
      if (resolved.modelName === "gemini-3.7-flash" && resolved.provider === "google") {
        candidateConfigs.push({
          model: googleClient("gemini-3.6-flash"),
          modelName: "gemini-3.6-flash",
          provider: "google",
          isFallback: true,
        });
      }
    }

    // 7. Probe and establish live resilient stream
    let activeStream: ReadableStream<Uint8Array> | null = null;
    let activeModelName = candidateConfigs[0]?.modelName || "AI Model";
    let wasFallbackUsed = false;
    let openrouterQuotaExhausted = false;
    let groqQuotaExhausted = false;

    for (let i = 0; i < candidateConfigs.length; i++) {
      const candidate = candidateConfigs[i];
      console.log(`[Stream Attempt ${i + 1}/${candidateConfigs.length}] Requesting ${candidate.modelName}...`);

      // This AbortController only bounds how long we wait for the connection to be
      // established (first chunk). Once a candidate proves itself alive, we clear
      // this timer so it can NOT abort an already-successful, long-running stream.
      const connectController = new AbortController();
      const connectTimeout = setTimeout(() => connectController.abort(), 4500);

      try {
        const streamResult = streamText({
          model: candidate.model,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: typeof temperature === "number" ? temperature : 0.7,
          maxRetries: 0,
          abortSignal: connectController.signal,
        });

        // Test the first chunk to ensure stream connection is valid and not 503
        const [probeStream, liveStream] = streamResult.textStream.tee();
        const reader = probeStream.getReader();
        const firstChunk = await reader.read();
        reader.releaseLock();

        // Connection established (or cleanly ended) within the window: this
        // candidate is no longer subject to the 4.5s connect timeout.
        clearTimeout(connectTimeout);

        if (firstChunk.value !== undefined) {
          activeModelName = candidate.modelName;
          wasFallbackUsed = candidate.isFallback;
          console.log(`Stream established with ${candidate.modelName} (fallback: ${candidate.isFallback})`);

          // Transform and pipe the live stream while tracking full output for onFinish callback
          let accumulatedText = "";
          const encoder = new TextEncoder();
          const transformedStream = new ReadableStream<Uint8Array>({
            async start(controller) {
              try {
                const liveReader = liveStream.getReader();
                while (true) {
                  const { done, value } = await liveReader.read();
                  if (done) break;
                  if (value) {
                    accumulatedText += value;
                    controller.enqueue(encoder.encode(value));
                  }
                }
                controller.close();
                await handleFinish(accumulatedText, activeModelName, wasFallbackUsed);
              } catch (err: any) {
                console.error("Live streaming consumer error:", err);
                controller.error(err);
              }
            },
          });

          activeStream = transformedStream;
          break;
        }
      } catch (candidateErr: any) {
        clearTimeout(connectTimeout);
        const status = candidateErr?.statusCode;
        // Attribute the failure to the provider that actually returned it, not to
        // "a key happens to exist somewhere in this request". Google and
        // OpenRouter can share a modelName (e.g. "gemma-4-31b-it"), so name-based
        // detection is unreliable; the explicit `candidate.provider` tag is not.
        // Each free provider has its OWN independent quota, so a 429/403 on one
        // skips only that provider's remaining candidates.
        const isRateLimitedOrRestricted = status === 429 || status === 403;
        const shouldSkipProvider =
          isRateLimitedOrRestricted &&
          (candidate.provider === "openrouter" || candidate.provider === "groq");
        console.warn(
          `Model ${candidate.modelName} (${candidate.provider}) unavailable (status ${status || "?"}: ${candidateErr?.message || "high demand"}). ${shouldSkipProvider ? `${candidate.provider} quota exhausted, skipping remaining ${candidate.provider} candidates.` : "Cascading to next candidate..."}`
        );
        if (shouldSkipProvider) {
          if (candidate.provider === "openrouter") openrouterQuotaExhausted = true;
          if (candidate.provider === "groq") groqQuotaExhausted = true;
          for (let j = i + 1; j < candidateConfigs.length; j++) {
            if (candidateConfigs[j].provider !== candidate.provider) {
              i = j - 1; // -1 because the loop's i++ will increment
              break;
            }
          }
        }
      }
    }

    if (!activeStream) {
      if (openrouterQuotaExhausted || groqQuotaExhausted) {
        const exhausted = [
          openrouterQuotaExhausted ? "OpenRouter (50 gratis/día)" : null,
          groqQuotaExhausted ? "Groq (cuota gratis)" : null,
        ]
          .filter(Boolean)
          .join(" y ");
        return new NextResponse(
          `Cuotas gratuitas agotadas (${exhausted}). Vuelve mañana o conecta tu propia clave en Ajustes > Avanzado para generaciones ilimitadas.`,
          { status: 429 }
        );
      }
      return new NextResponse(
        "Servidores de IA temporalmente saturados. Por favor intenta de nuevo en unos momentos.",
        { status: 503 }
      );
    }

    return new Response(activeStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
        "X-AI-Model": activeModelName,
      },
    });
  } catch (error: any) {
    console.error("AI Generation Fatal Error:", error);
    return new NextResponse(
      error.message || "Error al conectar con el proveedor de IA.", 
      { status: 422 }
    );
  }
}
