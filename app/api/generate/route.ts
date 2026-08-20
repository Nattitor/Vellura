import { createClient } from "@/utils/supabase/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse Request Body
    const body = await req.json();
    console.log("Received generation request:", body);
    
    const { prompt: jobDescription, tone } = body;

    if (!jobDescription) {
      console.log("Job description missing");
      return new NextResponse("Job description is required", { status: 400 });
    }

    // 3. Fetch User's Master Resume (Global Context)
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", user.id)
      .single();

    const resumeText = profile?.resume_text;

    if (!resumeText || resumeText.trim() === "") {
      return new NextResponse("Master resume not found. Please add it in settings.", {
        status: 400,
      });
    }

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

    // 5. Generate AI Stream
    const result = await streamText({
      model: google("gemini-3.7-flash"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new NextResponse(
      "Internal Server Error: " + (error.message || error.toString()), 
      { status: 500 }
    );
  }
}
