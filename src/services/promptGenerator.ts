import { BlueprintData } from "../models/blueprint";
import { flattenBlueprintToCallOutcomes } from "../utils/outcomeFlattener";

export interface OutcomePrompt {
  outcomeName: string;
  outcomePath: string[];
  callInsightsAgent: string;
  callObjectionsAgent: string;
  playbookChecksAgent: string;
  variableScorecardAgent: string;
}

export interface PromptsResponse {
  metadata: {
    generatedAt: string;
    businessName: string;
    totalOutcomes: number;
    systemContext: string;
  };
  companyContext: string;
  outcomePrompts: OutcomePrompt[];
}

/**
 * Generate AI-enriched prompts for call outcomes
 * @param blueprintData - The blueprint data containing business info and call outcomes
 * @returns Promise<PromptsResponse> - The generated prompts
 */
export async function generateCallOutcomePrompts(blueprintData: BlueprintData): Promise<PromptsResponse> {
  // Flatten the blueprint to get call outcomes
  const flattenedData = flattenBlueprintToCallOutcomes(blueprintData);

  // Prepare the request payload
  const requestPayload = {
    businessInfo: {
      businessName: flattenedData.businessInfo?.businessName || "Unknown Company",
      businessGoals: blueprintData.businessInfo?.businessGoals || "",
      companyWebsite: flattenedData.businessInfo?.companyWebsite || "",
      documentTranscription: blueprintData.businessInfo?.documentTranscription || "",
    },
    callOutcomes: flattenedData.callOutcomes,
  };

  // Call the API endpoint
  const response = await fetch("/api/generate-prompts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate prompts");
  }

  return response.json();
}

/**
 * Download the generated prompts as a JSON file
 * @param promptsData - The prompts response data
 * @param filename - Optional custom filename
 */
export function downloadCallOutcomePrompts(promptsData: PromptsResponse, filename?: string): void {
  const jsonString = JSON.stringify(promptsData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const defaultFilename = `${promptsData.metadata.businessName.toLowerCase().replace(/\s+/g, "-")}-call-prompts-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
