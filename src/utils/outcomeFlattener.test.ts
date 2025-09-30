import { flattenBlueprintToCallOutcomes } from "./outcomeFlattener";
import { BlueprintData } from "../models/blueprint";

// Test data that matches the structure described by the user
const testBlueprintData: BlueprintData = {
  nodeName: "Root Outcome",
  nodeDescription: "Root level outcome",
  customerInsights: [{ name: "Root Insight 1", description: "Root level insight" }],
  customerObjection: [{ name: "Root Objection 1", description: "Root level objection" }],
  booleanScoreCard: [{ name: "Root Boolean 1", description: "Root boolean scorecard", isItFailCriteria: "No" }],
  variableScoreCard: [
    {
      name: "Root Variable 1",
      description: "Root variable scorecard",
      isItFailCriteria: "No",
      score1Desc: "Score 1",
      score2Desc: "Score 2",
      score3Desc: "Score 3",
      score4Desc: "Score 4",
      score5Desc: "Score 5",
    },
  ],
  nestedNodes: [
    {
      nodeName: "X1",
      nodeDescription: "Parent X1",
      customerInsights: [{ name: "X1 Insight", description: "X1 specific insight" }],
      customerObjection: [{ name: "X1 Objection", description: "X1 specific objection" }],
      booleanScoreCard: [{ name: "X1 Boolean", description: "X1 boolean scorecard", isItFailCriteria: "Yes", failWeight: "High" }],
      variableScoreCard: [
        {
          name: "X1 Variable",
          description: "X1 variable scorecard",
          isItFailCriteria: "Yes",
          failWeight: "Medium",
          score1Desc: "Poor",
          score2Desc: "Fair",
          score3Desc: "Good",
          score4Desc: "Very Good",
          score5Desc: "Excellent",
          failScore: 2,
        },
      ],
      nestedNodes: [
        {
          nodeName: "X2",
          nodeDescription: "Child X2 (leaf)",
          customerInsights: [{ name: "X2 Insight", description: "X2 specific insight" }],
          customerObjection: [],
          booleanScoreCard: [],
          variableScoreCard: [],
          nestedNodes: [], // This is a leaf
        },
        {
          nodeName: "X3",
          nodeDescription: "Child X3 (has children)",
          customerInsights: [{ name: "X3 Insight", description: "X3 specific insight" }],
          customerObjection: [{ name: "X3 Objection", description: "X3 specific objection" }],
          booleanScoreCard: [],
          variableScoreCard: [],
          nestedNodes: [
            {
              nodeName: "X4",
              nodeDescription: "Grandchild X4 (leaf)",
              customerInsights: [{ name: "X4 Insight", description: "X4 specific insight" }],
              customerObjection: [],
              booleanScoreCard: [],
              variableScoreCard: [],
              nestedNodes: [], // This is a leaf
            },
            {
              nodeName: "X5",
              nodeDescription: "Grandchild X5 (leaf)",
              customerInsights: [],
              customerObjection: [{ name: "X5 Objection", description: "X5 specific objection" }],
              booleanScoreCard: [],
              variableScoreCard: [],
              nestedNodes: [], // This is a leaf
            },
          ],
        },
      ],
    },
  ],
  businessInfo: {
    businessName: "Test Company",
    businessGoals: "Test goals",
    companyWebsite: "https://test.com",
  },
};

// Test the flattening function
console.log("Testing outcome flattening...");

const result = flattenBlueprintToCallOutcomes(testBlueprintData);

console.log("Flattened result:", JSON.stringify(result, null, 2));

// Verify the expected outcomes
console.log("\n=== VERIFICATION ===");
console.log(`Total call outcomes: ${result.totalOutcomes}`);
console.log("Expected outcomes: X2, X4, X5 (3 total)");

result.callOutcomes.forEach((outcome, index) => {
  console.log(`\nOutcome ${index + 1}: ${outcome.nodeName}`);
  console.log(`Path: ${outcome.path.join(" → ")}`);
  console.log(`Customer Insights: ${outcome.customerInsights.length} items`);
  console.log(`Customer Objections: ${outcome.customerObjection.length} items`);
  console.log(`Boolean Scorecards: ${outcome.booleanScoreCard.length} items`);
  console.log(`Variable Scorecards: ${outcome.variableScoreCard.length} items`);

  // Verify inheritance
  console.log(
    "Insight names:",
    outcome.customerInsights.map((i) => i.name)
  );
  console.log(
    "Objection names:",
    outcome.customerObjection.map((o) => o.name)
  );
});

export { testBlueprintData };
