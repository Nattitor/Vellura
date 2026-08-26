/**
 * Utility to extract a clean, human-friendly Company Name and Job Role
 * from a Job Description and Generated Cover Letter to display in History.
 */

function isLikelyRole(str: string): boolean {
  return /(?:Engineer|Developer|Desarrollador(?:a)?|Designer|Diseñador(?:a)?|Manager|Analyst|Analista|Lead|L[ií]der|Architect|Arquitecto(?:a)?|Specialist|Especialista|Consultant|Consultor(?:a)?|Tech|Programador(?:a)?|Director(?:a)?)/i.test(
    str
  );
}

function cleanPart(str: string): string {
  if (!str) return "";
  let s = str.trim();
  s = s.replace(/[,;.:\-–—|•]+$/, "").replace(/^[,;.:\-–—|•]+/, "").trim();
  s = s.replace(/^(?:the|la|el|un|una|un\/a|el\/la)\s+/i, "").trim();
  return s;
}

export function stripMetadataComments(text?: string | null): string {
  if (!text) return "";
  let s = text;
  // 1. Remove all closed HTML / metadata comments
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // 2. Remove unclosed opening comment while streaming on the first line
  s = s.replace(/^<!--[^\n\r]*(?:\r?\n)?/, "");
  // 3. Remove any unicode dashes or markdown formatted comments
  s = s.replace(/^<![-–—]+[\s\S]*?[-–—]+>/, "");
  return s.trimStart();
}

export function extractCompanyAndRole(
  jobDescription?: string | null,
  generatedContent?: string | null
): string {
  const text = (jobDescription || "").trim();
  const letter = (generatedContent || "").trim();

  // 1. Check for AI-embedded comment <!-- TARGET: Company • Role -->
  const commentMatch = (letter || text).match(/<!--\s*TARGET:\s*([^\n\r>]+?)\s*-->/i);
  if (commentMatch) {
    const extracted = commentMatch[1].trim();
    if (extracted.length > 2 && extracted.length < 80) {
      return extracted.replace(/^<!--\s*TARGET:\s*/i, "").replace(/\s*-->$/i, "").trim();
    }
  }

  let company = "";
  let role = "";

  // 2. Extract from Letter Greetings & Subject line
  const letterLines = letter.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of letterLines.slice(0, 8)) {
    // Subject line: "Re: [Role] - [Company]" or "Subject: [Role] at [Company]"
    const subjMatch = line.match(
      /^(?:Re|Subject|Asunto|Postulaci[oó]n|Candidatura)\s*[:|-]\s*(.+)$/i
    );
    if (subjMatch) {
      const parts = subjMatch[1].split(/[-–—|•]|\bat\b|\ben\b/i);
      if (parts.length >= 2) {
        role = parts[0].trim();
        company = parts[1].trim();
        break;
      }
    }

    // Greeting: "Estimado equipo de [Company]:" or "Dear [Company] Team,"
    if (!company) {
      const greetMatch = line.match(
        /(?:Dear|Estimado equipo de|Equipo de|To the team at|To)\s+([A-ZÁÉÍÓÚÑ][A-Za-z0-9áéíóúñÁÉÍÓÚÑ\s&.,'-]{2,25}?)(?:\s+Team|\s+Hiring|\s+Engineering|[:,\n]|$)/i
      );
      if (greetMatch) {
        const cand = greetMatch[1].trim();
        const forbidden = [
          "hiring",
          "selection",
          "selección",
          "seleccion",
          "reclutamiento",
          "recruiting",
          "all",
          "whom",
          "este",
          "esta",
          "sir",
          "madam",
          "señor",
          "señora",
        ];
        if (!forbidden.includes(cand.toLowerCase())) {
          company = cand;
        }
      }
    }
  }

  // 3. Extract Role from Letter Opening Paragraph
  if (!role) {
    const roleInLetter = letter.match(
      /(?:puesto de|posici[oó]n de|rol de|candidatura (?:a|al puesto de|para)|apply for the|interest in the|position as|role of|position of)\s+([A-Za-z0-9áéíóúñÁÉÍÓÚÑ/()-]{2,40}(?:\s+[A-Za-z0-9áéíóúñÁÉÍÓÚÑ/()-]{2,30}){0,4})/i
    );
    if (roleInLetter) {
      let candRole = roleInLetter[1].trim();
      candRole = candRole.replace(
        /\s+(?:at|en|in|para|con|with|for|to|de|del|la|el|un|una|and|y)\s*$/i,
        ""
      );
      candRole = candRole.replace(/^(?:un|una|el|la|the|a|an)\s+/i, "");
      candRole = candRole.replace(/^(?:un\/a|el\/la)\s+/i, "");

      const garbageWords = [
        "candidatura",
        "opportunity",
        "oportunidad",
        "vacante",
        "empresa",
        "dynamic environment",
        "candidates to fill",
      ];
      if (!garbageWords.some((g) => candRole.toLowerCase().includes(g)) && candRole.length > 3) {
        role = candRole;
      }
    }
  }

  // 4. Job Description Explicit Header (Line 1 "Company - Role" or "Role - Company")
  const jobLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if ((!company || !role) && jobLines.length > 0) {
    for (const line of jobLines.slice(0, 3)) {
      const splitMatch = line.match(
        /^([^–—\-:|•]{2,35})\s*(?:[-–—|•:]|\s+at\s+|\s+en\s+)\s*([^–—\-:|•]{3,45})$/i
      );
      if (splitMatch) {
        const p1 = splitMatch[1].trim();
        const p2 = splitMatch[2].trim();
        const isRole1 = isLikelyRole(p1);
        const isRole2 = isLikelyRole(p2);

        if (isRole1 && !isRole2) {
          if (!role) role = p1;
          if (!company) company = p2;
        } else if (!isRole1 && isRole2) {
          if (!company) company = p1;
          if (!role) role = p2;
        }
        break;
      }
    }
  }

  // 5. Look for standard Role keywords if still missing
  if (!role) {
    const commonRolesRegex =
      /(?:Senior\s+|Junior\s+|Lead\s+|Staff\s+|Principal\s+|Semi\s*Senior\s+|SSR\s+|SR\s+)?(?:Full\s*Stack\s+(?:Developer|Engineer|Desarrollador(?:a)?)|Frontend\s+(?:Developer|Engineer|Desarrollador(?:a)?)|Backend\s+(?:Developer|Engineer|Desarrollador(?:a)?)|Software\s+(?:Engineer|Developer|Ingeniero(?:a)?)|Desarrollador(?:a)?\s+(?:Web|Mobile|Software|Full\s*Stack|Frontend|Backend|React|Node|Python|Java|PHP|\.NET|Senior|Junior|Semi\s*Senior)?|Ingeniero(?:a)?\s+(?:de\s+Software|de\s+Sistemas|DevOps|Cloud|de\s+Datos)|Product\s+Designer|UI\/UX\s+Designer|Diseñador(?:a)?\s+(?:Web|UI\/UX|Gr[aá]fico|Digital)|Data\s+(?:Scientist|Analyst|Engineer)|Product\s+Manager|Project\s+Manager|Scrum\s+Master|QA\s+Engineer|DevOps\s+Engineer|Tech\s+Lead|L[ií]der\s+T[eé]cnico)/i;
    const found = (text || "").match(commonRolesRegex) || (letter || "").match(commonRolesRegex);
    if (found) {
      role = found[0].trim();
    }
  }

  // 6. Clean strings
  company = cleanPart(company);
  role = cleanPart(role);

  if (role) {
    role = role.replace(/^(?:un\/a|el\/la|un|una|el|la|the|a|an)\s+/i, "").trim();
    role = role.replace(/\s+(?:role|position|puesto|rol)$/i, "").trim();
    if (role[0] === role[0]?.toLowerCase()) {
      role = role[0]?.toUpperCase() + role.slice(1);
    }
  }

  if (company) {
    if (company.toLowerCase() === "syst" || company.toLowerCase() === "america") {
      company = "";
    }
  }

  if (company && role) {
    return `${company} • ${role}`;
  } else if (company) {
    return `${company} • Cover Letter`;
  } else if (role) {
    return role;
  }

  return "Carta de Presentación";
}
