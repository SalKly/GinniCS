import { z } from "zod";

// Validation schemas for the blueprint form
export const failureImpactSchema = z.enum(["IMMEDIATE", "WITH_1", "WITH_2", "WITH_3", "WITH_4", "WITH_5"]);

export const failCriteriaSchema = z.enum(["Yes", "No"]);

export const yesNoScorecardItemSchema = z
  .object({
    name: z.string().min(1, "Question is required"),
    description: z.string().min(1, "Description is required"),
    isItFailCriteria: failCriteriaSchema,
    failWeight: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isItFailCriteria === "Yes") {
        return data.failWeight && data.failWeight.length > 0;
      }
      return true;
    },
    {
      message: "Fail weight is required when isItFailCriteria is Yes",
      path: ["failWeight"],
    }
  );

export const insightItemSchema = z.object({
  name: z.string().min(1, "Insight name is required"),
  description: z.string().min(1, "Insight description is required"),
});

export const objectionItemSchema = z.object({
  name: z.string().min(1, "Objection name is required"),
  description: z.string().min(1, "Objection description is required"),
});

export const variableScorecardItemSchema = z
  .object({
    name: z.string().min(1, "Question is required"),
    description: z.string().min(1, "Description is required"),
    isItFailCriteria: failCriteriaSchema,
    failWeight: z.string().optional(),
    score1Desc: z.string().min(1, "Score 1 description is required"),
    score2Desc: z.string().min(1, "Score 2 description is required"),
    score3Desc: z.string().min(1, "Score 3 description is required"),
    score4Desc: z.string().min(1, "Score 4 description is required"),
    score5Desc: z.string().min(1, "Score 5 description is required"),
    failScore: z.number().min(1).max(5).optional(),
  })
  .refine(
    (data) => {
      if (data.isItFailCriteria === "Yes") {
        return data.failWeight && data.failWeight.length > 0 && data.failScore !== undefined;
      }
      return true;
    },
    {
      message: "Fail weight and fail score are required when isItFailCriteria is Yes",
      path: ["failWeight"],
    }
  );

// Node schema for the new structure
export const nodeSchema = z.object({
  nodeName: z.string().min(1, "Node name is required"),
  nodeDescription: z.string().min(1, "Node description is required"),
  customerInsights: z.array(insightItemSchema),
  customerObjection: z.array(objectionItemSchema),
  booleanScoreCard: z.array(yesNoScorecardItemSchema),
  variableScoreCard: z.array(variableScorecardItemSchema),
});

// Recursive schema for nested nodes
export const nestedNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    nodeName: z.string().min(1, "Node name is required"),
    nodeDescription: z.string().min(1, "Node description is required"),
    customerInsights: z.array(insightItemSchema),
    customerObjection: z.array(objectionItemSchema),
    booleanScoreCard: z.array(yesNoScorecardItemSchema),
    variableScoreCard: z.array(variableScorecardItemSchema),
    nestedNodes: z.array(nestedNodeSchema).optional(),
  })
);

// Business info schema
export const businessInfoSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessGoals: z.string().min(1, "Business goals are required"),
  companyWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  qaManualFile: z.any().optional(),
  qaManualFileName: z.string().optional(),
});

export const blueprintDataSchema = nodeSchema.extend({
  nestedNodes: z.array(nestedNodeSchema),
  businessInfo: businessInfoSchema.optional(),
});

// Legacy schemas for backward compatibility
export const generalTemplateSchema = z.object({
  customerInsights: z.array(insightItemSchema),
  objections: z.array(objectionItemSchema),
  yesNoScorecard: z.array(yesNoScorecardItemSchema),
  variableScorecard: z.array(variableScorecardItemSchema),
});

export const outcomeSchema = z.object({
  name: z.string().min(1, "Outcome name is required"),
  description: z.string().min(1, "Outcome description is required"),
});

// Step-specific validation schemas
export const businessInfoStepSchema = z.object({
  businessInfo: businessInfoSchema,
});

export const defineOutcomesStepSchema = nodeSchema.extend({
  nestedNodes: z.array(nestedNodeSchema),
});

export const generalTemplateStepSchema = nodeSchema;

export const outcomeDetailsStepSchema = z.object({
  nestedNodes: z.array(nestedNodeSchema),
});

// Validation helper functions
export const validateStep = (step: string, data: any) => {
  switch (step) {
    case "business-info":
      return businessInfoStepSchema.safeParse(data);
    case "outcomes":
      return defineOutcomesStepSchema.safeParse(data);
    case "general":
      return generalTemplateStepSchema.safeParse(data);
    case "outcome-details":
      return outcomeDetailsStepSchema.safeParse(data);
    default:
      return { success: true, data };
  }
};

export const validateBlueprintData = (data: any) => {
  return blueprintDataSchema.safeParse(data);
};
