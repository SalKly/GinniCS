import * as pdfjs from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Set up the worker for PDF.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

/**
 * Parses a PDF file and extracts text content
 * @param file - The PDF file to parse
 * @returns Promise<string> - The extracted text content
 */
export async function parsePdfToText(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Combine all text items from the page
      const pageText = textContent.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => item.str)
        .join(" ");

      fullText += pageText + "\n";
    }

    // Return the extracted text, cleaned up
    return fullText.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF document. Please ensure the file is a valid PDF.");
  }
}

/**
 * Validates if a file is a PDF
 * @param file - The file to validate
 * @returns boolean - True if the file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Formats the extracted text for better readability
 * @param text - Raw extracted text
 * @returns string - Formatted text
 */
export function formatExtractedText(text: string): string {
  // Clean up the text by:
  // 1. Removing excessive whitespace
  // 2. Normalizing line breaks
  // 3. Removing page numbers and headers/footers patterns

  return (
    text
      // Replace multiple whitespace with single space
      .replace(/\s+/g, " ")
      // Replace multiple line breaks with double line break for paragraphs
      .replace(/\n\s*\n/g, "\n\n")
      // Remove common page number patterns
      .replace(/\n\s*\d+\s*\n/g, "\n")
      // Remove excessive line breaks at start and end
      .trim()
  );
}
