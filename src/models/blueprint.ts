// Core types for the Onboarding Blueprint Generator

export type FailureImpact = "IMMEDIATE" | "WITH_1" | "WITH_2" | "WITH_3" | "WITH_4" | "WITH_5";

export type FailCriteria = "Yes" | "No";

// Item-based structure for insights and objections
export interface InsightItem {
  name: string;
  description: string;
}

export interface ObjectionItem {
  name: string;
  description: string;
}

// Updated YesNoScorecardItem with conditional failWeight
export interface YesNoScorecardItem {
  name: string;
  description: string;
  isItFailCriteria: FailCriteria;
  failWeight?: string; // Only shown if isItFailCriteria is "Yes"
}

// Updated VariableScorecardItem with conditional failWeight and failScore
export interface VariableScorecardItem {
  name: string;
  description: string;
  isItFailCriteria: FailCriteria;
  failWeight?: string; // Only shown if isItFailCriteria is "Yes"
  score1Desc: string;
  score2Desc: string;
  score3Desc: string;
  score4Desc: string;
  score5Desc: string;
  failScore?: number; // Only shown if isItFailCriteria is "Yes"
}

// Node structure for the new data format
export interface Node {
  nodeName: string;
  nodeDescription: string;
  customerInsights: InsightItem[];
  customerObjection: ObjectionItem[];
  booleanScoreCard: YesNoScorecardItem[];
  variableScoreCard: VariableScorecardItem[];
}

// Root node structure (always present, cannot be removed)
export interface RootNode extends Node {
  // Root node is always "General Outcome"
}

// Nested node structure with recursive children
export interface NestedNode extends Node {
  nestedNodes?: NestedNode[];
}

// Business information interface
export interface BusinessInfo {
  businessName: string;
  businessGoals: string;
  companyWebsite: string;
  qaManualFile?: File | null;
  qaManualFileName?: string;
  documentTranscription?: string;
}

// New main blueprint data structure - flattened with rootNode properties spread
export interface BlueprintData extends RootNode {
  nestedNodes: NestedNode[];
  businessInfo?: BusinessInfo;
}

// Legacy interfaces for backward compatibility during transition
export interface GeneralTemplate {
  customerInsights: InsightItem[];
  objections: ObjectionItem[];
  yesNoScorecard: YesNoScorecardItem[];
  variableScorecard: VariableScorecardItem[];
}

export interface Outcome {
  name: string;
  description: string;
  customerInsights: InsightItem[];
  objections: ObjectionItem[];
  yesNoScorecard: YesNoScorecardItem[];
  variableScorecard: VariableScorecardItem[];
  children: Outcome[];
}

// Legacy BlueprintData for backward compatibility
export interface LegacyBlueprintData {
  outcomes: Array<{
    name: string;
    description: string;
  }>;
  generalTemplate: GeneralTemplate;
  outcomeTree: Outcome[];
}

// Form step types
export type FormStep = "business-info" | "outcomes" | "general" | "outcome-details" | "nested-outcomes" | "scorecards" | "insights" | "objections";

export interface FormState {
  currentStep: FormStep;
  currentOutcomeIndex?: number;
  currentNestedPath?: number[]; // Path to current nested outcome
  blueprintData: BlueprintData;
}

// Legacy FormState for backward compatibility
export interface LegacyFormState {
  currentStep: FormStep;
  currentOutcomeIndex?: number;
  currentNestedPath?: number[]; // Path to current nested outcome
  blueprintData: LegacyBlueprintData;
}

// Component props types
export interface StepProps {
  formState: FormState;
  onUpdateFormState: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export interface OutcomeFormProps extends StepProps {
  outcomeIndex: number;
  nestedPath?: number[];
}
