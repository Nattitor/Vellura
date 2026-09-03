/**
 * ✦ Vellura | Centralized PDF Export Engine
 * Generates deterministic, beautifully styled Serif PDF documents from AI-generated Markdown.
 */

export interface ExportPDFOptions {
  content: string;
  fileName?: string;
  targetName?: string;
}

export async function exportDocumentToPDF({
  content,
  fileName,
  targetName,
}: ExportPDFOptions): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  // Strip XML comments and Markdown headings/bold/italic for clean text layout
  const plainText = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .trim();

  // Times is the standard readable serif font embedded in standard jsPDF
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const margin = 20;
  const pdfWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pdfWidth - margin * 2;

  const lines = doc.splitTextToSize(plainText, maxLineWidth);

  let y = 20;
  const lineHeight = 7;

  for (let i = 0; i < lines.length; i++) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  let finalName = fileName;
  if (!finalName) {
    const cleanTarget = (targetName || "cover-letter")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 35);
    finalName = `vellura-${cleanTarget}.pdf`;
  }

  if (!finalName.endsWith(".pdf")) {
    finalName = `${finalName}.pdf`;
  }

  doc.save(finalName);
}
