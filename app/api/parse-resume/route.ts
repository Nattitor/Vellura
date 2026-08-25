import { createClient } from "@/utils/supabase/server";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const maxDuration = 60; // Allow sufficient time for AI processing

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify User Authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Extract and Validate File from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new NextResponse("No resume file uploaded", { status: 400 });
    }

    // Max file size: 12MB
    if (file.size > 12 * 1024 * 1024) {
      return new NextResponse("File size exceeds 12MB limit", { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Fetch User's BYOK Key (if any)
    const { data: profile } = await supabase
      .from("profiles")
      .select("byok_key")
      .eq("id", user.id)
      .single();

    const aiProvider = profile?.byok_key
      ? createGoogleGenerativeAI({ apiKey: profile.byok_key })
      : google;

    const autoTranslate = formData.get("autoTranslate") === "true";
    const targetLanguage = (formData.get("targetLanguage") as string) || "English";

    const languageInstruction = autoTranslate
      ? `5. LANGUAGE & TRANSLATION REQUIREMENT:
- Detect the language of the source resume.
- Target Output Language: ${targetLanguage}.
- If the source resume is in a different language (e.g. Spanish source and English target, or English source and Spanish target), you MUST translate and adapt all professional content, technical skills, job titles, and achievements flawlessly into ${targetLanguage}.
- If the source resume is already in ${targetLanguage}, maintain that language without altering meaning.`
      : `5. LANGUAGE REQUIREMENT: Maintain the exact original language of the source resume document.`;

    const parsingInstruction = `You are an elite career strategist and executive resume architect.
Extract and structure ALL information from this resume document into a comprehensive, high-detail Master Resume in clean markdown.

Guidelines:
1. Include: Full Name / Professional Title, Executive Summary, Detailed Work Experience (with company, role, dates, key responsibilities, and quantified achievements), Core & Technical Skills, Education, Certifications, and Key Projects.
2. Maintain maximum professional depth: Do NOT summarize away or truncate past roles or accomplishments. Capture every important skill, tech stack, and milestone.
3. Structure with clean Markdown (## Section Headings, bold text for roles/technologies, bulleted lists for achievements).
4. Output ONLY the extracted master resume markdown without any conversational intro, disclaimer, or outro.
${languageInstruction}`;

    let extractedText = "";

    // 4. Handle Different Document Types
    if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      // PDF handling via Gemini Multimodal document input
      try {
        const result = await generateText({
          model: aiProvider("gemini-3.7-flash"),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "file",
                  data: buffer,
                  mediaType: "application/pdf",
                },
                {
                  type: "text",
                  text: parsingInstruction,
                },
              ],
            },
          ],
        });
        extractedText = result.text;
      } catch (err) {
        console.warn("Primary PDF parser failed, falling back to gemini-1.5-flash...", err);
        const fallbackResult = await generateText({
          model: aiProvider("gemini-1.5-flash"),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "file",
                  data: buffer,
                  mediaType: "application/pdf",
                },
                {
                  type: "text",
                  text: parsingInstruction,
                },
              ],
            },
          ],
        });
        extractedText = fallbackResult.text;
      }
    } else if (
      fileName.endsWith(".docx") ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // DOCX handling via mammoth
      const mammothResult = await mammoth.extractRawText({ buffer });
      const rawText = mammothResult.value;

      if (!rawText || rawText.trim().length === 0) {
        return new NextResponse("Could not extract readable text from DOCX file.", {
          status: 400,
        });
      }

      const result = await generateText({
        model: aiProvider("gemini-3.7-flash"),
        prompt: `${parsingInstruction}\n\nRAW RESUME TEXT:\n${rawText}`,
      });
      extractedText = result.text;
    } else if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileType.startsWith("text/")
    ) {
      // Plain text / Markdown
      const rawText = buffer.toString("utf-8");
      const result = await generateText({
        model: aiProvider("gemini-3.7-flash"),
        prompt: `${parsingInstruction}\n\nRAW RESUME TEXT:\n${rawText}`,
      });
      extractedText = result.text;
    } else {
      return new NextResponse(
        "Unsupported file format. Please upload a PDF, Word (.docx), or Text (.txt, .md) file.",
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return new NextResponse("Failed to extract meaningful content from the resume.", {
        status: 422,
      });
    }

    return NextResponse.json({
      success: true,
      resumeText: extractedText.trim(),
    });
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return new NextResponse(
      "Internal Server Error: " + (error.message || error.toString()),
      { status: 500 }
    );
  }
}
