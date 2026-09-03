import { createClient } from "@/utils/supabase/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { parseStoredUserKeys } from "@/utils/byok";

export const maxDuration = 60; // Allow sufficient time for AI processing

/**
 * Sanitizes markdown spacing, eliminating multiple consecutive blank lines
 * and fixing paragraph and list formatting.
 */
function cleanMarkdownSpacing(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "") // trim trailing line spaces
    .replace(/\n{3,}/g, "\n\n") // max 1 blank line between blocks
    .trim();
}

/**
 * Intelligent rule-based formatter used when offline or as high-fidelity fallback.
 * Cleans PDF linebreaks, organizes sections, detects contacts, and structures in clean Markdown.
 */
function formatRawResumeTextLocally(rawText: string, targetLanguage: string = "Spanish"): string {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return rawText.trim();

  // 1. Identify Candidate Name & Contact Info
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const phoneRegex = /(\+?[0-9]{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;
  const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/gi;
  const githubRegex = /(github\.com\/[a-zA-Z0-9_-]+)/gi;

  const emails: string[] = [];
  const phones: string[] = [];
  const links: string[] = [];

  for (const line of lines.slice(0, 15)) {
    const matchedEmails = line.match(emailRegex);
    if (matchedEmails) emails.push(...matchedEmails);

    const matchedPhones = line.match(phoneRegex);
    if (matchedPhones) {
      for (const p of matchedPhones) {
        if (p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 15) {
          phones.push(p);
        }
      }
    }

    const matchedIn = line.match(linkedinRegex);
    if (matchedIn) links.push(...matchedIn);
    const matchedGh = line.match(githubRegex);
    if (matchedGh) links.push(...matchedGh);
  }

  // Name is typically the very first substantial line
  const nameCandidate = lines[0].replace(/[#*•_]/g, "").trim();
  const titleCandidate = lines.length > 1 && lines[1].length < 60 && !lines[1].includes("@") ? lines[1] : "";

  // Section Headers Keywords
  const sectionKeywords = [
    { key: "summary", es: "Resumen Profesional", en: "Professional Summary", fr: "Profil Professionnel", pt: "Resumo Profissional", match: /^(resumen|perfil|summary|profile|about me|sobre mí|sobre mim|profil)/i },
    { key: "experience", es: "Experiencia Laboral", en: "Work Experience", fr: "Expérience Professionnelle", pt: "Experiência Profissional", match: /^(experiencia|work experience|employment|trayectoria|historique|experiência)/i },
    { key: "skills", es: "Habilidades & Competencias", en: "Core Skills", fr: "Compétences", pt: "Habilidades & Competências", match: /^(habilidades|skills|competencias|tecnologías|technologies|compétences)/i },
    { key: "education", es: "Educación & Certificaciones", en: "Education & Certifications", fr: "Formation & Diplômes", pt: "Educação & Certificações", match: /^(educaci[oó]n|education|formaci[oó]n|estudios|diplômes|educação)/i },
    { key: "projects", es: "Proyectos Destacados", en: "Key Projects", fr: "Projets", pt: "Projetos", match: /^(proyectos|projects|portfolio|portafolio|projets)/i },
    { key: "languages", es: "Idiomas", en: "Languages", fr: "Langues", pt: "Idiomas", match: /^(idiomas|languages|langues)/i },
  ];

  const langKey = targetLanguage.toLowerCase().startsWith("es") ? "es" : targetLanguage.toLowerCase().startsWith("fr") ? "fr" : targetLanguage.toLowerCase().startsWith("pt") ? "pt" : "en";

  const formattedOutput: string[] = [];

  // Add Header
  formattedOutput.push(`# ${nameCandidate}`);
  if (titleCandidate) {
    formattedOutput.push(`**${titleCandidate}**`);
  }

  const contacts: string[] = [];
  if (emails.length > 0) contacts.push(`✉️ ${emails[0]}`);
  if (phones.length > 0) contacts.push(`📞 ${phones[0]}`);
  if (links.length > 0) contacts.push(`🔗 ${links[0]}`);
  if (contacts.length > 0) {
    formattedOutput.push(contacts.join(" | "));
  }

  let currentSection = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line matches section header
    const matchedSec = sectionKeywords.find((s) => s.match.test(line));
    if (matchedSec) {
      currentSection = matchedSec.key;
      formattedOutput.push(`\n## ${matchedSec[langKey as "es" | "en" | "fr" | "pt"]}`);
      continue;
    }

    // Format list items
    if (/^[•\-\*\+]\s*/.test(line)) {
      const cleanBullet = line.replace(/^[•\-\*\+]\s*/, "").trim();
      formattedOutput.push(`- ${cleanBullet}`);
    } else if (line.length > 0 && currentSection) {
      if (line.length < 65 && (line.includes("20") || line.includes("19") || line.includes("Present") || line.includes("Actualidad"))) {
        formattedOutput.push(`\n### ${line}`);
      } else {
        formattedOutput.push(line);
      }
    }
  }

  return cleanMarkdownSpacing(formattedOutput.join("\n\n"));
}

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

    // 3. Local Text Extraction (Zero API dependencies)
    let rawExtractedText = "";

    if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      try {
        const { text } = await extractText(new Uint8Array(arrayBuffer));
        rawExtractedText = Array.isArray(text) ? text.join("\n") : (text || "");
      } catch (pdfErr) {
        console.warn("unpdf text extraction failed:", pdfErr);
      }
    } else if (
      fileName.endsWith(".docx") ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const mammothResult = await mammoth.extractRawText({ buffer });
        rawExtractedText = mammothResult.value || "";
      } catch (docxErr) {
        console.warn("Mammoth DOCX extraction failed:", docxErr);
      }
    } else if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileType.startsWith("text/")
    ) {
      rawExtractedText = buffer.toString("utf-8");
    } else {
      return new NextResponse(
        "Unsupported file format. Please upload a PDF, Word (.docx), or Text (.txt, .md) file.",
        { status: 400 }
      );
    }

    // 4. Fetch User's BYOK Keys
    const { data: profile } = await supabase
      .from("profiles")
      .select("byok_key")
      .eq("id", user.id)
      .single();

    // Decrypt and parse user BYOK keys (profiles.byok_key is stored encrypted)
    const userKeys = parseStoredUserKeys(profile?.byok_key);

    const autoTranslate = formData.get("autoTranslate") === "true";
    const targetLanguage = (formData.get("targetLanguage") as string) || "Spanish";

    const languageInstruction = autoTranslate
      ? `CRITICAL TRANSLATION MANDATE:
- Target Output Language: ${targetLanguage.toUpperCase()}.
- You MUST translate and adapt EVERYTHING (job titles, descriptions, achievements, responsibilities, section headers, technical summaries) COMPLETELY and STRICTLY into ${targetLanguage}.
- Absolutely NO untranslated source text (e.g. if target is Spanish, translate "Software Engineer" to "Ingeniero de Software", "Lead Backend" to "Líder Backend", "Developed REST APIs" to "Desarrollé APIs REST", etc.).
- Maintain pristine grammar, spelling, and professional vocabulary in ${targetLanguage}.`
      : `LANGUAGE REQUIREMENT: Maintain the original language of the document.`;

    const parsingInstruction = `You are an elite career strategist and executive resume architect.
Your task is to transform and structure this raw resume into a pristine, executive-level Master Resume in clean GitHub Flavored Markdown.

${languageInstruction}

STRUCTURE & FORMATTING SPECIFICATIONS:
1. Header:
# [Full Name]
**[Current / Target Professional Role or Title]**
📍 [Location] | ✉️ [Email] | 📞 [Phone] | 🔗 [LinkedIn / Portfolio]

2. Professional Summary:
## ${targetLanguage === "Spanish" ? "Resumen Profesional" : targetLanguage === "French" ? "Profil Professionnel" : targetLanguage === "Portuguese" ? "Resumo Profissional" : "Professional Summary"}
[A compelling 3-4 sentence narrative highlighting core expertise, years of experience, unique strengths, and major impact.]

3. Work Experience (reverse chronological, highly detailed):
## ${targetLanguage === "Spanish" ? "Experiencia Laboral" : targetLanguage === "French" ? "Expérience Professionnelle" : targetLanguage === "Portuguese" ? "Experiência Profissional" : "Work Experience"}
### [Job Title] — [Company Name]
*[Location or Remote] • [Start Month/Year] – [End Month/Year or Present]*
- [Action-driven, quantified achievement or key responsibility]
- [Major milestone, system designed, or measurable business outcome]
- **Tech/Tools:** [Key technologies utilized in this role]

4. Core & Technical Skills:
## ${targetLanguage === "Spanish" ? "Habilidades Técnicas & Competencias" : targetLanguage === "French" ? "Compétences Techniques" : targetLanguage === "Portuguese" ? "Habilidades Técnicas" : "Technical & Core Skills"}
- **[Category 1, e.g. Lenguajes & Frameworks]:** [Item 1, Item 2, Item 3]
- **[Category 2, e.g. Cloud & Infraestructura]:** [Item 1, Item 2, Item 3]
- **[Category 3, e.g. Herramientas & Metodologías]:** [Item 1, Item 2, Item 3]

5. Education & Certifications:
## ${targetLanguage === "Spanish" ? "Educación & Certificaciones" : targetLanguage === "French" ? "Formation & Certifications" : targetLanguage === "Portuguese" ? "Educação & Certificações" : "Education & Certifications"}
- **[Degree / Title]** — [University / Institution], *[Year]*
- **[Certification Name]** — [Issuing Entity], *[Year]*

6. Languages & Projects (if present):
## ${targetLanguage === "Spanish" ? "Idiomas & Proyectos Destacados" : targetLanguage === "French" ? "Langues & Projets" : targetLanguage === "Portuguese" ? "Idiomas & Projetos" : "Languages & Key Projects"}
- **[Language]:** [Proficiency Level]
- **[Project Name]:** [Brief description and link/impact]

CRITICAL FORMATTING & SPACING RULES:
- Separate distinct sections and jobs with a single blank line. Do not create huge empty gaps.
- Do NOT abbreviate or truncate past roles or accomplishments.
- Clean up any raw PDF artifacts, broken lines, weird spacing, or misplaced punctuation.
- Output ONLY the clean markdown resume text. Do NOT include introductory greetings or closing notes.`;

    // 5. Multi-Provider AI Cascade Runner
    // EXACT ORDER (Groq first — most reliable free quota):
    // 1st: Groq Qwen3.8 27B (text path; scanned PDFs without extractable text
    //   skip Groq and fall through to Google multimodal below)
    // 2nd-3rd: Google direct (Gemini 3.7 Flash + Gemma 4 31B, multimodal PDF support)
    // 4th-8th: OpenRouter free-tier (Nemotron Ultra/Super, Gemma 26B, Inkling, GLM 5.2)
    // Tier 3 local fallback (formatRawResumeTextLocally) runs if every candidate fails.
    let structuredResumeText = "";
    let lastAiError: string | null = null;

    const aiCandidates: Array<{
      name: string;
      getModel: () => any;
      canMultimodalPdf?: boolean;
    }> = [];

    const openrouterKey = userKeys.openrouter || process.env.OPENROUTER_API_KEY;
    const googleKey = userKeys.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const groqKey = userKeys.groq || process.env.GROQ_API_KEY;

    const getOpenRouterClient = () => {
      if (!openrouterKey) return null;
      return createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
        headers: {
          "HTTP-Referer": "https://vellura.vercel.app",
          "X-Title": "Vellura AI Resume Parser",
        },
      });
    };

    const openrouterClient = getOpenRouterClient();

    const getGroqClient = () => {
      if (!groqKey) return null;
      return createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: groqKey,
      });
    };

    const groqClient = getGroqClient();

    // Groq direct FIRST (most reliable, independent free quota, no credit card).
    // Text-only path (multimodal PDF falls through to Google direct below,
    // which sets canMultimodalPdf).
    if (groqClient) {
      aiCandidates.push({
        name: "Qwen3.8 27B (Groq)",
        getModel: () => groqClient("qwen/qwen3.8-27b"),
      });
    }

    // GPT-OSS 120B intentionally NOT included here: structuring a resume
    // doesn't need a 120B reasoner, and a Groq 429 on Qwen would likely
    // repeat on the same account. Single Groq attempt → fast failover.
    // (GPT-OSS 120B remains the reasoning candidate in app/api/generate.)

    // Google direct AFTER Groq (multimodal PDF support)
    if (googleKey) {
      const googleClient = createGoogleGenerativeAI({ apiKey: googleKey });
      aiCandidates.push({
        name: "Gemini 3.7 Flash (Direct Google)",
        getModel: () => googleClient("gemini-3.7-flash"),
        canMultimodalPdf: true,
      });
      aiCandidates.push({
        name: "Gemma 4 31B (Direct Google)",
        getModel: () => googleClient("gemma-4-31b-it"),
        canMultimodalPdf: true,
      });
    }

    // 1st OpenRouter Priority: Nemotron 3 Ultra 550B (best reasoning free model)

    if (openrouterClient) {
      aiCandidates.push({
        name: "Nemotron 3 Ultra 550B (OpenRouter)",
        getModel: () => openrouterClient("nvidia/nemotron-3-ultra-550b-a55b:free"),
      });
    }

    // 2nd Priority: Nemotron 3 Super 120B
    if (openrouterClient) {
      aiCandidates.push({
        name: "Nemotron 3 Super 120B (OpenRouter)",
        getModel: () => openrouterClient("nvidia/nemotron-3-super-120b-a12b:free"),
      });
    }

    // 3rd Priority: Gemma 4 26B (OpenRouter)
    if (openrouterClient) {
      aiCandidates.push({
        name: "Gemma 4 26B (OpenRouter)",
        getModel: () => openrouterClient("google/gemma-4-26b-a4b-it:free"),
      });
    }

    // 4th Priority: Inkling (balanced)
    if (openrouterClient) {
      aiCandidates.push({
        name: "Inkling (OpenRouter)",
        getModel: () => openrouterClient("thinkingmachines/inkling:free"),
      });
    }

    // 5th Priority (Last): GLM 5.2 (speed fallback)
    if (openrouterClient) {
      aiCandidates.push({
        name: "GLM 5.2 (OpenRouter)",
        getModel: () => openrouterClient("z-ai/glm-5.2:free"),
      });
    }

    // Execute AI Pipeline across candidates in strict order
    for (const candidate of aiCandidates) {
      try {
        console.log(`Attempting CV parsing with candidate: ${candidate.name}...`);

        if (candidate.canMultimodalPdf && (fileName.endsWith(".pdf") || fileType === "application/pdf") && (!rawExtractedText || rawExtractedText.length < 50)) {
          const result = await generateText({
            model: candidate.getModel(),
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(9000),
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
          if (result.text && result.text.trim().length > 50) {
            structuredResumeText = cleanMarkdownSpacing(result.text);
            break;
          }
        } else if (rawExtractedText && rawExtractedText.trim().length > 0) {
          const result = await generateText({
            model: candidate.getModel(),
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(9000),
            prompt: `${parsingInstruction}\n\nRAW RESUME TEXT:\n${rawExtractedText}`,
          });
          if (result.text && result.text.trim().length > 50) {
            structuredResumeText = cleanMarkdownSpacing(result.text);
            break;
          }
        }
      } catch (candidateErr: any) {
        console.warn(`Candidate ${candidate.name} failed:`, candidateErr?.message || candidateErr);
        lastAiError = candidateErr?.message || "AI error";
      }
    }

    // 6. Tier 3: Zero-Crash Resilient Fallback with Smart Local Formatting
    if (structuredResumeText && structuredResumeText.length > 50) {
      return NextResponse.json({
        success: true,
        resumeText: structuredResumeText,
        aiStructured: true,
      });
    }

    // If AI failed or no keys configured, format locally into clean markdown structure
    if (rawExtractedText && rawExtractedText.trim().length > 20) {
      const formattedLocalResume = formatRawResumeTextLocally(rawExtractedText, targetLanguage);

      return NextResponse.json({
        success: true,
        resumeText: formattedLocalResume,
        aiStructured: false,
        warning: lastAiError
          ? "Currículum transcrito y estructurado localmente. Para traducción y pulido profundo por IA, conecta tu clave en Ajustes > Avanzado."
          : undefined,
      });
    }

    return new NextResponse(
      "No se pudo extraer texto del archivo subido. Asegúrate de que el documento no sea una imagen escaneada vacía.",
      { status: 422 }
    );
  } catch (error: any) {
    console.error("Resume parsing fatal error:", error);
    return new NextResponse(
      "Error al procesar el archivo: " + (error.message || "Verifica el formato del documento."),
      { status: 500 }
    );
  }
}
