import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "./PDFStyles";
import { BlueprintData } from "../../models/blueprint";
import { HTMLRenderer } from "./HTMLRenderer";

interface PDFInsightsSectionProps {
  blueprintData: BlueprintData;
  companyName: string;
  insights: any[]; // From the flat form structure
}

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

// Helper to get outcome name from outcome key
const getOutcomeName = (outcomeKey: string, blueprintData: BlueprintData): string => {
  if (outcomeKey === "ALL_OUTCOMES") {
    return "All Outcomes";
  }

  const match = outcomeKey.match(/^outcome-(\d+)(?:-nested-(\d+))?$/);
  if (!match) return "Unknown";

  const parentIdx = parseInt(match[1]);
  const nestedIdx = match[2] ? parseInt(match[2]) : null;

  if (!blueprintData.nestedNodes || !blueprintData.nestedNodes[parentIdx]) {
    return "Unknown";
  }

  const parentOutcome = blueprintData.nestedNodes[parentIdx];

  if (nestedIdx !== null) {
    if (!parentOutcome.nestedNodes || !parentOutcome.nestedNodes[nestedIdx]) {
      return "Unknown";
    }
    const nestedOutcome = parentOutcome.nestedNodes[nestedIdx];
    return `${parentOutcome.nodeName} > ${nestedOutcome.nodeName}`;
  }

  return parentOutcome.nodeName;
};

export const PDFInsightsSection: React.FC<PDFInsightsSectionProps> = ({ blueprintData, companyName, insights }) => {
  const renderInsight = (insight: any, index: number) => {
    return (
      <View key={`insight-${index}`} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }} wrap={false}>
        {/* Insight Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.text }}>{insight.name || "Untitled Insight"}</Text>
        </View>

        {/* Description */}
        {insight.description && (
          <View style={{ marginBottom: 8, paddingLeft: 16 }}>
            <HTMLRenderer html={insight.description} fontSize={10} color={COLORS.text} lineHeight={1.6} />
          </View>
        )}

        {/* Applicable Outcomes */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingLeft: 16 }}>
          <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", width: 80 }}>Applies to:</Text>
          <View style={{ flex: 1 }}>
            {insight.outcomes && insight.outcomes.length > 0 ? (
              insight.outcomes.map((outcomeKey: string, idx: number) => (
                <Text key={idx} style={{ fontSize: 9, color: COLORS.text, marginBottom: 2 }}>
                  • {getOutcomeName(outcomeKey, blueprintData)}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 9, color: COLORS.textLight }}>No outcomes specified</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header} fixed>
        <Text style={styles.headerCompany}>{companyName}</Text>
        <Text style={styles.headerText}>Onboarding Blueprint</Text>
      </View>

      {/* Section Content */}
      <View style={{ marginTop: 50 }}>
        <Text style={styles.sectionHeader}>CUSTOMER INSIGHTS</Text>
        <Text style={styles.sectionDescription}>
          Key insights about customer behavior, needs, and expectations. These insights help representatives understand what to look for and how to
          tailor their approach during customer interactions.
        </Text>

        {insights && insights.length > 0 ? (
          insights.map((insight, idx) => renderInsight(insight, idx))
        ) : (
          <Text style={styles.cardMeta}>No customer insights defined.</Text>
        )}
      </View>

      {/* Page number */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </Page>
  );
};
