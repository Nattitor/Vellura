import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";

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
    
    const { prompt: jobDescription, tone } = body;

    if (!jobDescription) {
      console.log("Job description missing");
      return new NextResponse("Job description is required", { status: 400 });
    }

    // 3. Fetch User's Master Resume, Limits, and BYOK
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text, daily_limit, last_generation_date, byok_key")
      .eq("id", user.id)
      .single();

    const resumeText = profile?.resume_text;

    if (!resumeText || resumeText.trim() === "") {
      return new NextResponse("Master resume not found. Please add it in settings.", {
        status: 400,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    let currentLimit = profile?.daily_limit ?? 3;
    const lastDate = profile?.last_generation_date;

    if (lastDate !== today) {
      currentLimit = 3; // Reset daily limit for a new day
    }

    const hasBYOK = !!profile?.byok_key;

    if (!hasBYOK && currentLimit <= 0) {
      return new NextResponse("You have reached your daily limit.", { status: 402 });
    }

    // Configure Provider (BYOK or Default)
    const aiProvider = hasBYOK 
      ? createGoogleGenerativeAI({ apiKey: profile.byok_key }) 
      : google;

    // 4. Construct Prompt
    const systemPrompt = `You are an elite, highly persuasive executive cover letter writer. 
Your task is to write a highly tailored cover letter based on the user's master resume and the provided job description.
Tone: ${tone || "Professional & Polished"}
Keep the letter concise (3-4 paragraphs max), highly impactful, and avoiding cliché buzzwords. Focus on aligning the user's past impact with the job's requirements. Do not invent facts that are not in the resume. Output standard markdown.`;

    const userPrompt = `USER RESUME:
${resumeText}

-----------------

JOB DESCRIPTION:
${jobDescription}`;

    // 5. Generate AI Stream with Dynamic Fallback
    const handleFinish = async (text: string, modelName: string) => {
      try {
        console.log("onFinish triggered, starting DB updates...");
        
        const staticSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              fetch: (url, init) => {
                // Strip the Next.js abort signal to prevent it from killing the DB insert
                // after the streaming response finishes.
                const newInit = { ...init };
                delete newInit.signal;
                return fetch(url, newInit);
              }
            },
          }
        );
        
        if (!hasBYOK) {
          const { error: profileError } = await staticSupabase
            .from("profiles")
            .update({ 
              daily_limit: Math.max(0, currentLimit - 1),
              last_generation_date: today
            })
            .eq("id", user.id);
            
          if (profileError) console.error("Error updating limits:", profileError);
        }

        const { error: docError } = await staticSupabase
          .from("documents")
          .insert({
            user_id: user.id,
            company_name: "Not Specified",
            job_description: jobDescription,
            generated_content: text,
            ai_model_used: modelName
          });
          
        if (docError) console.error("Error inserting document:", docError);
        else console.log("Document successfully saved to DB!");
        
      } catch (err) {
        console.error("Unhandled error in onFinish:", err);
      }
    };

    let result;
    try {
      result = await streamText({
        model: aiProvider("gemini-3.7-flash"),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        onFinish: async ({ text }) => handleFinish(text, "gemini-3.7-flash")
      });
    } catch (e) {
      console.warn("Primary model failed, falling back to gemini-3.5-flash-lite...", e);
      result = await streamText({
        model: aiProvider("gemini-3.5-flash-lite"),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        onFinish: async ({ text }) => handleFinish(text, "gemini-3.5-flash-lite")
      });
    }

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new NextResponse(
      "Internal Server Error: " + (error.message || error.toString()), 
      { status: 500 }
    );
  }
}
