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
    if (!isUsingOwnKey && !hasGoogleKey && !hasOpenRouterKey) {
      return new NextResponse(
        "No API keys configured. Add a provider key in Settings > Advanced, or contact support.",
        { status: 400 }
      );
    }

    // 4. Construct Prompts
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
        
        // Deduct limit only if valid completion and using free tier
        if (!isUsingOwnKey) {
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

    // 6. Build Candidate Model List
    // Try OpenRouter first (less saturated, multi-provider), then fallback to Google direct
    const openrouterKey = userKeys.openrouter || process.env.OPENROUTER_API_KEY;
    console.log(`[OpenRouter] system env key present: ${!!process.env.OPENROUTER_API_KEY}, user BYOK present: ${!!userKeys.openrouter}`);
    let openrouterClient = null;
    if (openrouterKey) {
      openrouterClient = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
        headers: {
          "HTTP-Referer": "https://vellura.ai",
          "X-Title": "Vellura AI Workspace",
        },
      });
      console.log(`[OpenRouter] client initialized, key prefix: ${openrouterKey.substring(0, 12)}...`);
    } else {
      console.warn(`[OpenRouter] NO KEY available - cascade will only use Google direct models`);
    }

    const googleClient = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || userKeys.google,
    });

    let candidateConfigs: Array<{ model: any; modelName: string; provider: AIProviderId; isFallback: boolean }> = [];

    if (modelPreference === "speed") {
      // Speed Mode: Google first → OpenRouter models (if key, but skip on first 429) → Gemini 3.6 Flash (last resort)
      // All OpenRouter free models share a single 50/day per-account quota, so we probe only one OR model first.
      candidateConfigs = [
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
      // Reasoning Mode: Gemma 4 (Google) → Nemotron 3 Ultra (OpenRouter) → Gemma 4 26B (OR) → Gemma 4 31B (OR free) → Gemini 3.6 Flash
      // All OpenRouter free models share a single 50/day per-account quota.
      candidateConfigs = [
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
        // "an OpenRouter key happens to exist somewhere in this request". Google and
        // OpenRouter can share a modelName (e.g. "gemma-4-31b-it"), so name-based
        // detection is unreliable; the explicit `candidate.provider` tag is not.
        const isOpenRouterCandidate = candidate.provider === "openrouter";
        const isRateLimitedOrRestricted = status === 429 || status === 403;
        const shouldSkipRemainingOR = isOpenRouterCandidate && isRateLimitedOrRestricted;
        console.warn(
          `Model ${candidate.modelName} (${candidate.provider}) unavailable (status ${status || "?"}: ${candidateErr?.message || "high demand"}). ${shouldSkipRemainingOR ? "OpenRouter quota exhausted, skipping remaining OR candidates." : "Cascading to next candidate..."}`
        );
        // If an OpenRouter candidate returned 429 (rate limit) or 403 (model restricted),
        // all remaining OpenRouter models will likely fail the same way (shared quota).
        // Skip straight to the next non-OpenRouter candidate to avoid wasting time.
        if (shouldSkipRemainingOR) {
          openrouterQuotaExhausted = true;
          for (let j = i + 1; j < candidateConfigs.length; j++) {
            if (candidateConfigs[j].provider !== "openrouter") {
              i = j - 1; // -1 because the loop's i++ will increment
              break;
            }
          }
        }
      }
    }

    if (!activeStream) {
      if (openrouterQuotaExhausted) {
        return new NextResponse(
          "Tu cuota gratuita de OpenRouter (50 requests/día) se agotó. Agrega créditos en https://openrouter.ai/credits o vuelve mañana.",
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
