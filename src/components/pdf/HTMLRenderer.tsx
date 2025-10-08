import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { COLORS } from "./PDFStyles";

/**
 * Properly render HTML content in PDF using react-pdf Text components
 * Based on react-pdf documentation: https://react-pdf.org/components#text
 */

interface HTMLRendererProps {
  html: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
}

// Comprehensive HTML entity decoder
const decodeHtmlEntities = (text: string): string => {
  if (!text) return "";

  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "...",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8217;": "'",
    "&#8216;": "'",
    "&#8211;": "–",
    "&#8212;": "—",
  };

  let decoded = text;

  // Replace named entities
  Object.keys(entities).forEach((entity) => {
    decoded = decoded.split(entity).join(entities[entity]);
  });

  // Decode numeric entities (decimal)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // Decode numeric entities (hex)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
};

// Clean and normalize text
const cleanText = (text: string): string => {
  if (!text) return "";

  let cleaned = decodeHtmlEntities(text);

  // Remove zero-width and invisible characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");

  // Remove control characters except newlines
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
};

// Parse HTML and extract styled text segments
interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

const parseHtmlToSegments = (html: string): TextSegment[] => {
  if (!html) return [];

  const segments: TextSegment[] = [];
  let currentText = "";
  let isBold = false;
  let isItalic = false;

  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Replace <br> with newline
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // Parse tags
  const tagRegex = /<(\/?)([a-z]+)[^>]*>/gi;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(cleaned)) !== null) {
    // Add text before this tag
    if (match.index > lastIndex) {
      currentText += cleaned.substring(lastIndex, match.index);
    }

    const isClosing = match[1] === "/";
    const tagName = match[2].toLowerCase();

    if (tagName === "b" || tagName === "strong") {
      if (!isClosing) {
        // Save current text and start bold
        if (currentText) {
          segments.push({ text: cleanText(currentText), bold: isBold, italic: isItalic });
          currentText = "";
        }
        isBold = true;
      } else {
        // End bold
        if (currentText) {
          segments.push({ text: cleanText(currentText), bold: isBold, italic: isItalic });
          currentText = "";
        }
        isBold = false;
      }
    } else if (tagName === "i" || tagName === "em") {
      if (!isClosing) {
        // Save current text and start italic
        if (currentText) {
          segments.push({ text: cleanText(currentText), bold: isBold, italic: isItalic });
          currentText = "";
        }
        isItalic = true;
      } else {
        // End italic
        if (currentText) {
          segments.push({ text: cleanText(currentText), bold: isBold, italic: isItalic });
          currentText = "";
        }
        isItalic = false;
      }
    } else if (tagName === "p" && !isClosing) {
      // Add space between paragraphs
      if (currentText && !currentText.endsWith("\n")) {
        currentText += "\n";
      }
    } else if (tagName === "li") {
      if (!isClosing) {
        // Add bullet before list item
        if (currentText && !currentText.endsWith("\n")) {
          currentText += "\n";
        }
        currentText += "- ";
      } else {
        // Add newline after list item
        if (!currentText.endsWith("\n")) {
          currentText += "\n";
        }
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < cleaned.length) {
    currentText += cleaned.substring(lastIndex);
  }

  if (currentText) {
    segments.push({ text: cleanText(currentText), bold: isBold, italic: isItalic });
  }

  return segments.filter((seg) => seg.text.length > 0);
};

export const HTMLRenderer: React.FC<HTMLRendererProps> = ({ html, fontSize = 10, color = COLORS.text, lineHeight = 1.6 }) => {
  if (!html) return null;

  const segments = parseHtmlToSegments(html);

  if (segments.length === 0) {
    const plainText = cleanText(html.replace(/<[^>]*>/g, ""));
    if (!plainText) return null;
    return <Text style={{ fontSize, color, lineHeight }}>{plainText}</Text>;
  }

  // Render segments with proper styling
  return (
    <Text style={{ fontSize, color, lineHeight }}>
      {segments.map((segment, idx) => {
        const style: any = {};

        if (segment.bold && segment.italic) {
          style.fontFamily = "Helvetica-BoldOblique";
        } else if (segment.bold) {
          style.fontFamily = "Helvetica-Bold";
        } else if (segment.italic) {
          style.fontFamily = "Helvetica-Oblique";
        }

        return (
          <Text key={idx} style={style}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

export default HTMLRenderer;
