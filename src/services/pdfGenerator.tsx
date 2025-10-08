import React from "react";
import { pdf } from "@react-pdf/renderer";
import { BlueprintData } from "../models/blueprint";
import { BlueprintPDF } from "../components/pdf/BlueprintPDF";

/**
 * Generate and download a PDF report for the blueprint
 * @param blueprintData - The hierarchical blueprint data
 * @param flatFormData - The flat form data with scorecards, insights, objections
 */
export async function generateAndDownloadBlueprintPDF(blueprintData: BlueprintData, flatFormData: any): Promise<void> {
  try {
    // Create the PDF document
    const blob = await pdf(<BlueprintPDF blueprintData={blueprintData} flatFormData={flatFormData} />).toBlob();

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename from company name
    const companyName = blueprintData.businessInfo?.businessName || "company";
    const sanitizedName = companyName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    link.download = `${sanitizedName}-blueprint-report.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

/**
 * Generate PDF blob without downloading (useful for preview)
 * @param blueprintData - The hierarchical blueprint data
 * @param flatFormData - The flat form data with scorecards, insights, objections
 */
export async function generateBlueprintPDFBlob(blueprintData: BlueprintData, flatFormData: any): Promise<Blob> {
  try {
    const blob = await pdf(<BlueprintPDF blueprintData={blueprintData} flatFormData={flatFormData} />).toBlob();
    return blob;
  } catch (error) {
    console.error("Error generating PDF blob:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}
