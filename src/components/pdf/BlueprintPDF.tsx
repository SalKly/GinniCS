import React from "react";
import { Document } from "@react-pdf/renderer";
import { BlueprintData } from "../../models/blueprint";
import { PDFCoverPage } from "./PDFCoverPage";
import { PDFOutcomesSection } from "./PDFOutcomesSection";
import { PDFScorecardsSection } from "./PDFScorecardsSection";
import { PDFInsightsSection } from "./PDFInsightsSection";
import { PDFObjectionsSection } from "./PDFObjectionsSection";

interface BlueprintPDFProps {
  blueprintData: BlueprintData;
  flatFormData: any; // The flat form data with scorecards, insights, objections arrays
}

export const BlueprintPDF: React.FC<BlueprintPDFProps> = ({ blueprintData, flatFormData }) => {
  const companyName = blueprintData.businessInfo?.businessName || "Company";
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get flat arrays from form data
  const scorecards = flatFormData.scorecards || [];
  const insights = flatFormData.insights || [];
  const objections = flatFormData.objections || [];

  return (
    <Document
      title={`${companyName} - Onboarding Blueprint`}
      author="Ginni.ai"
      subject="Call Evaluation Framework"
      keywords="onboarding, blueprint, call evaluation, scorecards"
    >
      {/* Cover Page */}
      <PDFCoverPage companyName={companyName} generatedDate={generatedDate} />

      {/* Call Outcomes Section */}
      <PDFOutcomesSection blueprintData={blueprintData} companyName={companyName} />

      {/* Scorecards Section */}
      <PDFScorecardsSection blueprintData={blueprintData} companyName={companyName} scorecards={scorecards} />

      {/* Insights Section */}
      <PDFInsightsSection blueprintData={blueprintData} companyName={companyName} insights={insights} />

      {/* Objections Section */}
      <PDFObjectionsSection blueprintData={blueprintData} companyName={companyName} objections={objections} />
    </Document>
  );
};
