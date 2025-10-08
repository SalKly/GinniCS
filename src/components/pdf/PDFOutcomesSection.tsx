import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "./PDFStyles";
import { BlueprintData, NestedNode } from "../../models/blueprint";
import { HTMLRenderer } from "./HTMLRenderer";

interface PDFOutcomesSectionProps {
  blueprintData: BlueprintData;
  companyName: string;
}

// Helper to count items for an outcome
const countOutcomeItems = (node: NestedNode) => {
  const insights = node.customerInsights?.length || 0;
  const objections = node.customerObjection?.length || 0;
  const booleanCards = node.booleanScoreCard?.length || 0;
  const variableCards = node.variableScoreCard?.length || 0;
  return { insights, objections, scorecards: booleanCards + variableCards };
};

export const PDFOutcomesSection: React.FC<PDFOutcomesSectionProps> = ({ blueprintData, companyName }) => {
  const renderOutcome = (outcome: NestedNode, level: number = 0, index: number = 0, parentIndex: string = "") => {
    const counts = countOutcomeItems(outcome);
    const outcomeNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
    const isNested = level > 0;

    return (
      <View
        key={`outcome-${outcomeNumber}`}
        style={[styles.outcomeItem, isNested ? styles.outcomeNestedLevel : styles.outcomeMainLevel]}
        wrap={false}
      >
        <Text style={styles.outcomeTitle}>
          {outcomeNumber}. {outcome.nodeName || "Untitled Outcome"}
        </Text>

        {outcome.nodeDescription && (
          <View style={{ marginBottom: 6 }}>
            <HTMLRenderer html={outcome.nodeDescription} fontSize={10} color={COLORS.text} lineHeight={1.6} />
          </View>
        )}

        <View style={styles.badgeContainer}>
          {counts.scorecards > 0 && (
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text>
                {counts.scorecards} Scorecard{counts.scorecards !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {counts.insights > 0 && (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text>
                {counts.insights} Insight{counts.insights !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {counts.objections > 0 && (
            <View style={[styles.badge, styles.badgePrimary]}>
              <Text>
                {counts.objections} Objection{counts.objections !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Render nested outcomes */}
        {outcome.nestedNodes && outcome.nestedNodes.length > 0 && (
          <View style={{ marginTop: 12 }}>{outcome.nestedNodes.map((nested, idx) => renderOutcome(nested, level + 1, idx, outcomeNumber))}</View>
        )}
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
        <Text style={styles.sectionHeader}>CALL OUTCOMES</Text>
        <Text style={styles.sectionDescription}>
          This section defines all possible call outcomes in a hierarchical structure. Each outcome represents a specific goal or result that can be
          achieved during a customer interaction.
        </Text>

        {/* All outcomes (Root) */}
        <View style={styles.outcomeItem} wrap={false}>
          <Text style={[styles.outcomeTitle, { fontSize: 14 }]}>0. {blueprintData.nodeName || "All outcomes"} (Root)</Text>

          {blueprintData.nodeDescription && (
            <View style={{ marginBottom: 6 }}>
              <HTMLRenderer html={blueprintData.nodeDescription} fontSize={10} color={COLORS.text} lineHeight={1.6} />
            </View>
          )}

          {(() => {
            const rootCounts = countOutcomeItems(blueprintData);
            return (
              <View style={styles.badgeContainer}>
                {rootCounts.scorecards > 0 && (
                  <View style={[styles.badge, styles.badgeBlue]}>
                    <Text>
                      {rootCounts.scorecards} Scorecard{rootCounts.scorecards !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
                {rootCounts.insights > 0 && (
                  <View style={[styles.badge, styles.badgeGreen]}>
                    <Text>
                      {rootCounts.insights} Insight{rootCounts.insights !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
                {rootCounts.objections > 0 && (
                  <View style={[styles.badge, styles.badgePrimary]}>
                    <Text>
                      {rootCounts.objections} Objection{rootCounts.objections !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        <View style={styles.divider} />

        {/* Main Outcomes */}
        {blueprintData.nestedNodes && blueprintData.nestedNodes.length > 0 ? (
          blueprintData.nestedNodes.map((outcome, idx) => renderOutcome(outcome, 0, idx))
        ) : (
          <Text style={styles.cardMeta}>No additional outcomes defined.</Text>
        )}
      </View>

      {/* Page number */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </Page>
  );
};
