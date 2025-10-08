import { BlueprintData, NestedNode, InsightItem, ObjectionItem, YesNoScorecardItem, VariableScorecardItem } from "../models/blueprint";

/**
 * Interface for a flattened outcome (leaf node with inherited attributes)
 */
export interface FlattenedOutcome {
  nodeName: string;
  nodeDescription: string;
  isScored?: boolean; // Indicates if this outcome should be scored
  path: string[]; // Path from root to this leaf (e.g., ["Root", "Parent1", "Parent2", "Leaf"])
  customerInsights: InsightItem[];
  customerObjection: ObjectionItem[];
  booleanScoreCard: YesNoScorecardItem[];
  variableScoreCard: VariableScorecardItem[];
}

/**
 * Interface for the final flattened structure
 */
export interface FlattenedOutcomes {
  businessInfo?: {
    businessName: string;
    businessGoals: string;
    companyWebsite: string;
    qaManualFileName?: string;
  };
  callOutcomes: FlattenedOutcome[];
  generatedAt: string;
  totalOutcomes: number;
}

/**
 * Utility function to merge arrays of items, avoiding duplicates based on name
 */
function mergeItems<T extends { name: string }>(parentItems: T[], childItems: T[]): T[] {
  const merged = [...parentItems];
  const existingNames = new Set(parentItems.map((item) => item.name));

  for (const item of childItems) {
    if (!existingNames.has(item.name)) {
      merged.push(item);
      existingNames.add(item.name);
    }
  }

  return merged;
}

/**
 * Recursively traverse the nested structure and collect leaf nodes with inherited attributes
 */
function collectLeafNodes(
  node: NestedNode,
  parentPath: string[],
  inheritedInsights: InsightItem[] = [],
  inheritedObjections: ObjectionItem[] = [],
  inheritedBooleanScoreCard: YesNoScorecardItem[] = [],
  inheritedVariableScoreCard: VariableScorecardItem[] = []
): FlattenedOutcome[] {
  const currentPath = [...parentPath, node.nodeName];

  // Merge current node's attributes with inherited ones
  const mergedInsights = mergeItems(inheritedInsights, node.customerInsights || []);
  const mergedObjections = mergeItems(inheritedObjections, node.customerObjection || []);
  const mergedBooleanScoreCard = mergeItems(inheritedBooleanScoreCard, node.booleanScoreCard || []);
  const mergedVariableScoreCard = mergeItems(inheritedVariableScoreCard, node.variableScoreCard || []);

  // If this node has no children (nested nodes), it's a leaf
  if (!node.nestedNodes || node.nestedNodes.length === 0) {
    return [
      {
        nodeName: node.nodeName,
        nodeDescription: node.nodeDescription,
        isScored: node.isScored !== false, // Default to true if not specified
        path: currentPath,
        customerInsights: mergedInsights,
        customerObjection: mergedObjections,
        booleanScoreCard: mergedBooleanScoreCard,
        variableScoreCard: mergedVariableScoreCard,
      },
    ];
  }

  // If this node has children, recursively collect from all children
  const leafNodes: FlattenedOutcome[] = [];
  for (const childNode of node.nestedNodes) {
    const childLeaves = collectLeafNodes(childNode, currentPath, mergedInsights, mergedObjections, mergedBooleanScoreCard, mergedVariableScoreCard);
    leafNodes.push(...childLeaves);
  }

  return leafNodes;
}

/**
 * Main function to flatten the blueprint data structure
 * Transforms nested outcomes into a flat structure where leaf nodes inherit all parent attributes
 */
export function flattenBlueprintToCallOutcomes(blueprintData: BlueprintData): FlattenedOutcomes {
  const callOutcomes: FlattenedOutcome[] = [];

  // Start with root node attributes
  const rootInsights = blueprintData.customerInsights || [];
  const rootObjections = blueprintData.customerObjection || [];
  const rootBooleanScoreCard = blueprintData.booleanScoreCard || [];
  const rootVariableScoreCard = blueprintData.variableScoreCard || [];

  // If there are no nested nodes, the root itself is a leaf
  if (!blueprintData.nestedNodes || blueprintData.nestedNodes.length === 0) {
    callOutcomes.push({
      nodeName: blueprintData.nodeName || "Root Outcome",
      nodeDescription: blueprintData.nodeDescription || "",
      isScored: blueprintData.isScored !== false, // Default to true if not specified
      path: [blueprintData.nodeName || "Root Outcome"],
      customerInsights: rootInsights,
      customerObjection: rootObjections,
      booleanScoreCard: rootBooleanScoreCard,
      variableScoreCard: rootVariableScoreCard,
    });
  } else {
    // Process each top-level nested node
    for (const nestedNode of blueprintData.nestedNodes) {
      const leafNodes = collectLeafNodes(
        nestedNode,
        [blueprintData.nodeName || "Root Outcome"], // Start path with root
        rootInsights,
        rootObjections,
        rootBooleanScoreCard,
        rootVariableScoreCard
      );
      callOutcomes.push(...leafNodes);
    }
  }

  return {
    businessInfo: blueprintData.businessInfo
      ? {
          businessName: blueprintData.businessInfo.businessName,
          businessGoals: blueprintData.businessInfo.businessGoals,
          companyWebsite: blueprintData.businessInfo.companyWebsite,
          qaManualFileName: blueprintData.businessInfo.qaManualFileName,
        }
      : undefined,
    callOutcomes,
    generatedAt: new Date().toISOString(),
    totalOutcomes: callOutcomes.length,
  };
}

/**
 * Utility function to download the flattened data as JSON
 */
export function downloadFlattenedOutcomes(blueprintData: BlueprintData, filename?: string): void {
  const flattenedData = flattenBlueprintToCallOutcomes(blueprintData);

  const jsonString = JSON.stringify(flattenedData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `call-outcomes-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
