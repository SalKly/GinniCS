import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "./PDFStyles";
import { BlueprintData } from "../../models/blueprint";
import { HTMLRenderer } from "./HTMLRenderer";

interface PDFScorecardsSectionProps {
  blueprintData: BlueprintData;
  companyName: string;
  scorecards: any[]; // From the flat form structure
}

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

export const PDFScorecardsSection: React.FC<PDFScorecardsSectionProps> = ({ blueprintData, companyName, scorecards }) => {
  // Separate boolean and variable scorecards
  const booleanScorecards = scorecards.filter((sc) => {
    // Check the type from the first outcome config
    const firstOutcome = sc.outcomes?.[0];
    const config = sc.outcomeConfigs?.[firstOutcome];
    return config?.type === "boolean";
  });

  const variableScorecards = scorecards.filter((sc) => {
    const firstOutcome = sc.outcomes?.[0];
    const config = sc.outcomeConfigs?.[firstOutcome];
    return config?.type === "variable";
  });

  const renderBooleanScorecard = (scorecard: any, index: number) => {
    const firstOutcome = scorecard.outcomes?.[0];
    const config = scorecard.outcomeConfigs?.[firstOutcome] || {};
    const callPhases = config.callPhases || [];

    return (
      <View key={`bool-${index}`} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }} wrap={false}>
        {/* Scorecard Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.text }}>{scorecard.name || "Untitled Scorecard"}</Text>
          <Text style={{ fontSize: 9, color: COLORS.textLight, marginLeft: 8 }}>[Yes/No]</Text>
        </View>

        {/* Description */}
        {config.description && (
          <View style={{ marginBottom: 8, paddingLeft: 16 }}>
            <HTMLRenderer html={config.description} fontSize={10} color={COLORS.text} lineHeight={1.6} />
          </View>
        )}

        {/* Call Phases */}
        {callPhases.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, paddingLeft: 16 }}>
            <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", width: 80 }}>Call Phases:</Text>
            <Text style={{ fontSize: 9, color: COLORS.text }}>
              {callPhases.map((phase: string) => (phase === "opening" ? "Opening" : phase === "during" ? "During" : "Ending")).join(", ")}
            </Text>
          </View>
        )}

        {/* Applicable Outcomes */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingLeft: 16 }}>
          <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", width: 80 }}>Applies to:</Text>
          <View style={{ flex: 1 }}>
            {scorecard.outcomes && scorecard.outcomes.length > 0 ? (
              scorecard.outcomes.map((outcomeKey: string, idx: number) => (
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

  const renderVariableScorecard = (scorecard: any, index: number) => {
    const firstOutcome = scorecard.outcomes?.[0];
    const config = scorecard.outcomeConfigs?.[firstOutcome] || {};
    const callPhases = config.callPhases || [];

    return (
      <View key={`var-${index}`} style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }} wrap={false}>
        {/* Scorecard Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.text }}>{scorecard.name || "Untitled Scorecard"}</Text>
          <Text style={{ fontSize: 9, color: COLORS.textLight, marginLeft: 8 }}>[1-5 Score]</Text>
        </View>

        {/* Description */}
        {config.description && (
          <View style={{ marginBottom: 8, paddingLeft: 16 }}>
            <HTMLRenderer html={config.description} fontSize={10} color={COLORS.text} lineHeight={1.6} />
          </View>
        )}

        {/* Call Phases */}
        {callPhases.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, paddingLeft: 16 }}>
            <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", width: 80 }}>Call Phases:</Text>
            <Text style={{ fontSize: 9, color: COLORS.text }}>
              {callPhases.map((phase: string) => (phase === "opening" ? "Opening" : phase === "during" ? "During" : "Ending")).join(", ")}
            </Text>
          </View>
        )}

        {/* Score Guide */}
        <View style={{ marginBottom: 10, paddingLeft: 16 }}>
          <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Scoring Guide:</Text>
          {[1, 2, 3, 4, 5].map((score) => (
            <View key={score} style={{ flexDirection: "row", marginBottom: 6, paddingLeft: 8, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.primary, width: 50, flexShrink: 0 }}>Score {score}:</Text>
              <View style={{ flex: 1 }}>
                <HTMLRenderer html={config[`score${score}Desc`] || "—"} fontSize={9} color={COLORS.text} lineHeight={1.5} />
              </View>
            </View>
          ))}
        </View>

        {/* Applicable Outcomes */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingLeft: 16 }}>
          <Text style={{ fontSize: 9, color: COLORS.textLight, fontFamily: "Helvetica-Bold", width: 80 }}>Applies to:</Text>
          <View style={{ flex: 1 }}>
            {scorecard.outcomes && scorecard.outcomes.length > 0 ? (
              scorecard.outcomes.map((outcomeKey: string, idx: number) => (
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
        <Text style={styles.sectionHeader}>SCORECARDS</Text>
        <Text style={styles.sectionDescription}>
          Evaluation criteria used to assess call quality. Scorecards can be Boolean (Yes/No) or Variable (1-5 scale) and are applied to specific
          outcomes during call analysis.
        </Text>

        {/* Boolean Scorecards */}
        <Text style={styles.subsectionHeader}>Boolean (Yes/No) Scorecards</Text>
        {booleanScorecards.length > 0 ? (
          booleanScorecards.map((sc, idx) => renderBooleanScorecard(sc, idx))
        ) : (
          <Text style={styles.cardMeta}>No boolean scorecards defined.</Text>
        )}

        {/* Variable Scorecards */}
        <Text style={[styles.subsectionHeader, { marginTop: 24 }]}>Variable (1-5 Score) Scorecards</Text>
        {variableScorecards.length > 0 ? (
          variableScorecards.map((sc, idx) => renderVariableScorecard(sc, idx))
        ) : (
          <Text style={styles.cardMeta}>No variable scorecards defined.</Text>
        )}
      </View>

      {/* Page number */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </Page>
  );
};
