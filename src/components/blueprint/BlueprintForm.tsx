import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { useRef } from "react";

import { BlueprintData, FormState, FormStep, RootNode, NestedNode } from "../../models/blueprint";
import { validateStep, validateBlueprintData } from "../../models/blueprintValidation";
import { BusinessInfoStep } from "./steps/BusinessInfoStep";
import { DefineOutcomesStep } from "./steps/DefineOutcomesStep";
import { ScorecardsStep } from "./steps/ScorecardsStep";
import { VisualizationStep } from "./steps/VisualizationStep";
import { InsightsStep } from "./steps/InsightsStep";
import { ObjectionsStep } from "./steps/ObjectionsStep";
import BlueprintFlow from "./BlueprintFlow";
import { saveBlueprint } from "../../services/blueprints";
import { createOrUpdateCompanyForm, saveFormProgress, loadFormProgress, type CompanyForm } from "../../services/companies";
import { useRouter } from "next/router";

const initialBlueprintData: any = {
  nodeName: "General Outcome",
  nodeDescription: "General criteria for all calls",
  customerInsights: [],
  customerObjection: [],
  booleanScoreCard: [],
  variableScoreCard: [],
  nestedNodes: [],
  scorecards: [],
  insights: [],
  objections: [],
  businessInfo: {
    businessName: "",
    businessGoals: "",
    companyWebsite: "",
    qaManualFile: null,
    qaManualFileName: "",
  },
};

interface BlueprintFormProps {
  mode?: "create" | "edit";
  companyName?: string;
  existingForm?: CompanyForm | null;
}

export function BlueprintForm({ mode = "create", companyName = "", existingForm = null }: BlueprintFormProps) {
  const router = useRouter();

  // Helper function to transform hierarchical structure (from Supabase) to flat structure (for form)
  const transformToFlat = (hierarchicalData: BlueprintData): any => {
    const scorecards: any[] = [];
    const insights: any[] = [];
    const objections: any[] = [];

    // Helper to create outcome key
    const createOutcomeKey = (parentIdx: number, nestedIdx?: number): string => {
      if (nestedIdx !== undefined) {
        return `outcome-${parentIdx}-nested-${nestedIdx}`;
      }
      return `outcome-${parentIdx}`;
    };

    // Process root node (General Outcome) scorecards
    if (hierarchicalData.booleanScoreCard && hierarchicalData.booleanScoreCard.length > 0) {
      hierarchicalData.booleanScoreCard.forEach((item) => {
        scorecards.push({
          name: item.name,
          description: item.description,
          type: "boolean",
          outcomes: ["ALL_OUTCOMES"],
          isItFailCriteria: item.isItFailCriteria || "No",
          failWeight: item.failWeight || "",
        });
      });
    }

    if (hierarchicalData.variableScoreCard && hierarchicalData.variableScoreCard.length > 0) {
      hierarchicalData.variableScoreCard.forEach((item) => {
        scorecards.push({
          name: item.name,
          description: item.description,
          type: "variable",
          outcomes: ["ALL_OUTCOMES"],
          isItFailCriteria: item.isItFailCriteria || "No",
          failWeight: item.failWeight || "",
          score1Desc: item.score1Desc,
          score2Desc: item.score2Desc,
          score3Desc: item.score3Desc,
          score4Desc: item.score4Desc,
          score5Desc: item.score5Desc,
          failScore: item.failScore,
        });
      });
    }

    // Process root node insights
    if (hierarchicalData.customerInsights && hierarchicalData.customerInsights.length > 0) {
      hierarchicalData.customerInsights.forEach((item) => {
        insights.push({
          name: item.name,
          description: item.description,
          outcomes: ["ALL_OUTCOMES"],
        });
      });
    }

    // Process root node objections
    if (hierarchicalData.customerObjection && hierarchicalData.customerObjection.length > 0) {
      hierarchicalData.customerObjection.forEach((item) => {
        objections.push({
          name: item.name,
          description: item.description,
          outcomes: ["ALL_OUTCOMES"],
        });
      });
    }

    // Process outcome-specific items
    if (hierarchicalData.nestedNodes && hierarchicalData.nestedNodes.length > 0) {
      hierarchicalData.nestedNodes.forEach((outcome, parentIdx) => {
        // Process parent outcome scorecards
        if (outcome.booleanScoreCard && outcome.booleanScoreCard.length > 0) {
          outcome.booleanScoreCard.forEach((item) => {
            scorecards.push({
              name: item.name,
              description: item.description,
              type: "boolean",
              outcomes: [createOutcomeKey(parentIdx)],
              isItFailCriteria: item.isItFailCriteria || "No",
              failWeight: item.failWeight || "",
            });
          });
        }

        if (outcome.variableScoreCard && outcome.variableScoreCard.length > 0) {
          outcome.variableScoreCard.forEach((item) => {
            scorecards.push({
              name: item.name,
              description: item.description,
              type: "variable",
              outcomes: [createOutcomeKey(parentIdx)],
              isItFailCriteria: item.isItFailCriteria || "No",
              failWeight: item.failWeight || "",
              score1Desc: item.score1Desc,
              score2Desc: item.score2Desc,
              score3Desc: item.score3Desc,
              score4Desc: item.score4Desc,
              score5Desc: item.score5Desc,
              failScore: item.failScore,
            });
          });
        }

        // Process parent outcome insights
        if (outcome.customerInsights && outcome.customerInsights.length > 0) {
          outcome.customerInsights.forEach((item) => {
            insights.push({
              name: item.name,
              description: item.description,
              outcomes: [createOutcomeKey(parentIdx)],
            });
          });
        }

        // Process parent outcome objections
        if (outcome.customerObjection && outcome.customerObjection.length > 0) {
          outcome.customerObjection.forEach((item) => {
            objections.push({
              name: item.name,
              description: item.description,
              outcomes: [createOutcomeKey(parentIdx)],
            });
          });
        }

        // Process nested outcomes
        if (outcome.nestedNodes && outcome.nestedNodes.length > 0) {
          outcome.nestedNodes.forEach((nestedOutcome, nestedIdx) => {
            // Process nested outcome scorecards
            if (nestedOutcome.booleanScoreCard && nestedOutcome.booleanScoreCard.length > 0) {
              nestedOutcome.booleanScoreCard.forEach((item) => {
                scorecards.push({
                  name: item.name,
                  description: item.description,
                  type: "boolean",
                  outcomes: [createOutcomeKey(parentIdx, nestedIdx)],
                  isItFailCriteria: item.isItFailCriteria || "No",
                  failWeight: item.failWeight || "",
                });
              });
            }

            if (nestedOutcome.variableScoreCard && nestedOutcome.variableScoreCard.length > 0) {
              nestedOutcome.variableScoreCard.forEach((item) => {
                scorecards.push({
                  name: item.name,
                  description: item.description,
                  type: "variable",
                  outcomes: [createOutcomeKey(parentIdx, nestedIdx)],
                  isItFailCriteria: item.isItFailCriteria || "No",
                  failWeight: item.failWeight || "",
                  score1Desc: item.score1Desc,
                  score2Desc: item.score2Desc,
                  score3Desc: item.score3Desc,
                  score4Desc: item.score4Desc,
                  score5Desc: item.score5Desc,
                  failScore: item.failScore,
                });
              });
            }

            // Process nested outcome insights
            if (nestedOutcome.customerInsights && nestedOutcome.customerInsights.length > 0) {
              nestedOutcome.customerInsights.forEach((item) => {
                insights.push({
                  name: item.name,
                  description: item.description,
                  outcomes: [createOutcomeKey(parentIdx, nestedIdx)],
                });
              });
            }

            // Process nested outcome objections
            if (nestedOutcome.customerObjection && nestedOutcome.customerObjection.length > 0) {
              nestedOutcome.customerObjection.forEach((item) => {
                objections.push({
                  name: item.name,
                  description: item.description,
                  outcomes: [createOutcomeKey(parentIdx, nestedIdx)],
                });
              });
            }
          });
        }
      });
    }

    return {
      ...hierarchicalData,
      scorecards,
      insights,
      objections,
    };
  };

  // Initialize form data based on mode and existing data
  const getInitialFormData = (): any => {
    let data = { ...initialBlueprintData };

    // Set company name if provided
    if (companyName) {
      data.businessInfo = {
        ...data.businessInfo!,
        businessName: companyName,
      };
    }

    // Load existing form data if in edit mode
    if (mode === "edit" && existingForm) {
      // Transform hierarchical data from Supabase to flat format for the form
      const hierarchicalData = existingForm.form_data;
      data = transformToFlat(hierarchicalData);
    }

    return data;
  };

  const [formState, setFormState] = useState<FormState>({
    currentStep: "business-info",
    blueprintData: getInitialFormData(),
  });
  const [showFlow, setShowFlow] = useState(false);
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentCompanyName, setCurrentCompanyName] = useState(companyName);

  const toast = useRef<Toast>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    trigger,
    reset,
  } = useForm({
    defaultValues: getInitialFormData(),
    mode: "onChange",
  });

  // Update form when props change and load existing progress
  useEffect(() => {
    const loadExistingProgress = async () => {
      let initialData = getInitialFormData();

      if (companyName && mode === "edit") {
        try {
          const existingProgress = await loadFormProgress(companyName);
          if (existingProgress) {
            // Transform hierarchical data from Supabase to flat format for the form
            initialData = transformToFlat(existingProgress);
          }
        } catch (error) {
          console.error("Error loading existing progress:", error);
        }
      }

      reset(initialData);
      setFormState({
        currentStep: "business-info",
        blueprintData: initialData,
      });
    };

    loadExistingProgress();
  }, [companyName, existingForm, mode, router.query]);

  // Auto-save functionality
  const autoSave = async (currentData: BlueprintData) => {
    const companyNameToUse = currentData.businessInfo?.businessName || currentCompanyName;

    if (!companyNameToUse) {
      return; // Can't save without a company name
    }

    try {
      setIsSaving(true);
      const website = currentData.businessInfo?.companyWebsite;

      await saveFormProgress(companyNameToUse, currentData, website);

      setLastSaved(new Date());
      setCurrentCompanyName(companyNameToUse);

      // Update URL if company name changed
      if (mode === "create" && companyNameToUse !== companyName) {
        const newUrl = `/form/edit/${encodeURIComponent(companyNameToUse)}`;
        router.replace(newUrl, undefined, { shallow: true });
      }
    } catch (error: any) {
      console.error("Auto-save failed:", error);
      toast.current?.show({
        severity: "warn",
        summary: "Auto-save Failed",
        detail: "Your progress couldn't be saved automatically. Please try again.",
        life: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save function - saves all current form data
  const handleManualSave = async () => {
    const currentData = getValues();

    // Get the company name from current data or existing state
    const companyNameToUse = currentData.businessInfo?.businessName || currentCompanyName;

    if (!companyNameToUse) {
      toast.current?.show({
        severity: "warn",
        summary: "Company Name Required",
        detail: "Please enter a company name before saving.",
        life: 3000,
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create comprehensive form data with all current values
      const completeFormData: BlueprintData = {
        nodeName: currentData.nodeName || "General Outcome",
        nodeDescription: currentData.nodeDescription || "General criteria for all calls",
        customerInsights: currentData.customerInsights || [],
        customerObjection: currentData.customerObjection || [],
        booleanScoreCard: currentData.booleanScoreCard || [],
        variableScoreCard: currentData.variableScoreCard || [],
        nestedNodes: currentData.nestedNodes || [],
        businessInfo: currentData.businessInfo || {
          businessName: companyNameToUse,
          businessGoals: "",
          companyWebsite: "",
          qaManualFile: null,
          qaManualFileName: "",
        },
      };

      const website = completeFormData.businessInfo?.companyWebsite;

      await saveFormProgress(companyNameToUse, completeFormData, website);

      setLastSaved(new Date());
      setCurrentCompanyName(companyNameToUse);

      // Update URL if company name changed and we're in create mode
      if (mode === "create" && companyNameToUse !== companyName) {
        const newUrl = `/form/edit/${encodeURIComponent(companyNameToUse)}`;
        router.replace(newUrl, undefined, { shallow: true });
      }

      toast.current?.show({
        severity: "success",
        summary: "Progress Saved",
        detail: "Your form progress has been saved successfully.",
        life: 3000,
      });
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.current?.show({
        severity: "error",
        summary: "Save Failed",
        detail: error.message || "Failed to save progress. Please try again.",
        life: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const getStepNumber = (step: FormStep | string): number => {
    switch (step) {
      case "business-info":
        return 1;
      case "outcomes":
        return 2;
      case "scorecards":
        return 3;
      case "visualization":
        return 4;
      case "insights":
        return 5;
      case "objections":
        return 6;
      default:
        return 1;
    }
  };

  const getTotalSteps = (): number => {
    return 6; // business-info + outcomes + scorecards + visualization + insights + objections
  };

  const getCurrentStepNumber = (): number => {
    return getStepNumber(formState.currentStep);
  };

  const handleNext = () => {
    const currentData = getValues();

    if (formState.currentStep === "business-info") {
      updateFormState({
        currentStep: "outcomes" as any,
      });
    } else if (formState.currentStep === "outcomes") {
      updateFormState({
        currentStep: "scorecards" as any,
      });
    } else if ((formState.currentStep as any) === "scorecards") {
      updateFormState({
        currentStep: "visualization" as any,
      });
    } else if ((formState.currentStep as any) === "visualization") {
      updateFormState({
        currentStep: "insights" as any,
      });
    } else if ((formState.currentStep as any) === "insights") {
      updateFormState({
        currentStep: "objections" as any,
      });
    } else if ((formState.currentStep as any) === "objections") {
      // Complete the blueprint
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (formState.currentStep === "outcomes") {
      updateFormState({ currentStep: "business-info" });
    } else if ((formState.currentStep as any) === "scorecards") {
      updateFormState({ currentStep: "outcomes" as any });
    } else if ((formState.currentStep as any) === "visualization") {
      updateFormState({ currentStep: "scorecards" as any });
    } else if ((formState.currentStep as any) === "insights") {
      updateFormState({ currentStep: "visualization" as any });
    } else if ((formState.currentStep as any) === "objections") {
      updateFormState({ currentStep: "insights" as any });
    }
  };

  // Helper function to transform flat structure to hierarchical
  const transformToHierarchical = (formData: any): BlueprintData => {
    const scorecards = formData.scorecards || [];
    const insights = formData.insights || [];
    const objections = formData.objections || [];
    const outcomes = formData.nestedNodes || [];

    // Initialize root node (General Outcome) arrays
    const rootBooleanScoreCards: any[] = [];
    const rootVariableScoreCards: any[] = [];
    const rootInsights: any[] = [];
    const rootObjections: any[] = [];

    // Initialize outcome nodes with empty arrays
    const processedOutcomes = JSON.parse(JSON.stringify(outcomes));

    // Helper to get all outcome indices that should receive an item
    const getTargetIndices = (selectedOutcomes: string[]): { isRoot: boolean; indices: number[][] } => {
      if (selectedOutcomes.includes("ALL_OUTCOMES")) {
        return { isRoot: true, indices: [] };
      }

      const indices: number[][] = [];
      selectedOutcomes.forEach((outcomeKey) => {
        const match = outcomeKey.match(/^outcome-(\d+)(?:-nested-(\d+))?$/);
        if (match) {
          const parentIndex = parseInt(match[1]);
          const nestedIndex = match[2] ? parseInt(match[2]) : null;

          if (nestedIndex !== null) {
            // Specific nested outcome
            indices.push([parentIndex, nestedIndex]);
          } else {
            // Parent outcome - applies to parent AND all nested
            indices.push([parentIndex]);
            // Add all nested outcomes too
            const parent = outcomes[parentIndex];
            if (parent?.nestedNodes) {
              parent.nestedNodes.forEach((_: any, nIdx: number) => {
                indices.push([parentIndex, nIdx]);
              });
            }
          }
        }
      });

      return { isRoot: false, indices };
    };

    // Helper to add item to outcome node
    const addToOutcome = (indices: number[][], item: any, arrayName: string) => {
      indices.forEach((idx) => {
        if (idx.length === 1) {
          // Main outcome
          const [parentIdx] = idx;
          if (!processedOutcomes[parentIdx][arrayName]) {
            processedOutcomes[parentIdx][arrayName] = [];
          }
          processedOutcomes[parentIdx][arrayName].push(item);
        } else if (idx.length === 2) {
          // Nested outcome
          const [parentIdx, nestedIdx] = idx;
          if (!processedOutcomes[parentIdx].nestedNodes[nestedIdx][arrayName]) {
            processedOutcomes[parentIdx].nestedNodes[nestedIdx][arrayName] = [];
          }
          processedOutcomes[parentIdx].nestedNodes[nestedIdx][arrayName].push(item);
        }
      });
    };

    // Process scorecards
    scorecards.forEach((scorecard: any) => {
      const { isRoot, indices } = getTargetIndices(scorecard.outcomes || []);

      if (scorecard.type === "boolean") {
        const item = {
          name: scorecard.name,
          description: scorecard.description,
          isItFailCriteria: scorecard.isItFailCriteria || "No",
          ...(scorecard.isItFailCriteria === "Yes" && { failWeight: scorecard.failWeight }),
        };

        if (isRoot) {
          rootBooleanScoreCards.push(item);
        } else {
          addToOutcome(indices, item, "booleanScoreCard");
        }
      } else {
        const item = {
          name: scorecard.name,
          description: scorecard.description,
          isItFailCriteria: scorecard.isItFailCriteria || "No",
          score1Desc: scorecard.score1Desc,
          score2Desc: scorecard.score2Desc,
          score3Desc: scorecard.score3Desc,
          score4Desc: scorecard.score4Desc,
          score5Desc: scorecard.score5Desc,
          ...(scorecard.isItFailCriteria === "Yes" && {
            failWeight: scorecard.failWeight,
            failScore: scorecard.failScore,
          }),
        };

        if (isRoot) {
          rootVariableScoreCards.push(item);
        } else {
          addToOutcome(indices, item, "variableScoreCard");
        }
      }
    });

    // Process insights
    insights.forEach((insight: any) => {
      const { isRoot, indices } = getTargetIndices(insight.outcomes || []);
      const item = {
        name: insight.name,
        description: insight.description,
      };

      if (isRoot) {
        rootInsights.push(item);
      } else {
        addToOutcome(indices, item, "customerInsights");
      }
    });

    // Process objections
    objections.forEach((objection: any) => {
      const { isRoot, indices } = getTargetIndices(objection.outcomes || []);
      const item = {
        name: objection.name,
        description: objection.description,
      };

      if (isRoot) {
        rootObjections.push(item);
      } else {
        addToOutcome(indices, item, "customerObjection");
      }
    });

    return {
      nodeName: "General Outcome",
      nodeDescription: "General criteria for all calls",
      customerInsights: rootInsights,
      customerObjection: rootObjections,
      booleanScoreCard: rootBooleanScoreCards,
      variableScoreCard: rootVariableScoreCards,
      nestedNodes: processedOutcomes,
      businessInfo: formData.businessInfo,
    };
  };

  const handleComplete = async () => {
    const formData = getValues();

    // Transform the data structure
    const finalData: BlueprintData = transformToHierarchical(formData);

    // Final validation
    const validation = validateBlueprintData(finalData);
    if (!validation.success) {
      toast.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fix all errors before completing the blueprint",
        life: 3000,
      });
      return;
    }

    try {
      // Save to database using company service
      const companyNameToUse = finalData.businessInfo?.businessName || companyName || "Unnamed Company";
      const website = finalData.businessInfo?.companyWebsite;

      const result = await createOrUpdateCompanyForm(companyNameToUse, finalData, website);

      // Update the form state with final data
      setFormState((prev) => ({
        ...prev,
        blueprintData: finalData,
      }));

      // Mark form as completed
      setIsFormCompleted(true);

      console.log("Blueprint completed and saved:", result);

      toast.current?.show({
        severity: "success",
        summary: "Form Saved Successfully!",
        detail: `Your form for ${companyNameToUse} has been saved. You can now view the tree visualization.`,
        life: 5000,
      });

      // Redirect to the tree view after a short delay
      setTimeout(() => {
        if (result.form.tree_url) {
          router.push(result.form.tree_url);
        } else {
          router.push(`/tree/${result.form.id}`);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error saving form:", error);
      toast.current?.show({
        severity: "error",
        summary: "Save Error",
        detail: error.message || "Failed to save the form. Please try again.",
        life: 5000,
      });
    }
  };

  const handleVisualize = async () => {
    try {
      const id = await saveBlueprint(formState.blueprintData);
      await router.push(`/tree/${id}`);
    } catch (err: any) {
      console.error("Failed to save blueprint:", err);
      toast.current?.show({
        severity: "error",
        summary: "Save failed",
        detail: err?.message || "Could not save blueprint. Please try again.",
        life: 4000,
      });
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showFlow) {
        setShowFlow(false);
      }
    };

    if (showFlow) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showFlow]);

  const renderCurrentStep = () => {
    switch (formState.currentStep) {
      case "business-info":
        return (
          <BusinessInfoStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
            setValue={setValue}
          />
        );
      case "outcomes":
        return (
          <DefineOutcomesStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
            setValue={setValue}
          />
        );
      case "scorecards":
        return (
          <ScorecardsStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
          />
        );
      case "visualization":
        return <VisualizationStep control={control} formData={transformToHierarchical(getValues())} />;
      case "insights":
        return (
          <InsightsStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
          />
        );
      case "objections":
        return (
          <ObjectionsStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
          />
        );
      default:
        return null;
    }
  };

  const progressValue = (getCurrentStepNumber() / getTotalSteps()) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast ref={toast} />

      <div className="form-container py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent mb-4">
              Onboarding Blueprint Generator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Build a structured framework for analyzing and coaching sales calls with AI-ready evaluation criteria
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-700 to-purple-800 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg">
                    {getCurrentStepNumber()}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <i className="fas fa-check text-xs text-white"></i>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Step {getCurrentStepNumber()} of {getTotalSteps()}
                  </h3>
                  <p className="text-base text-gray-600 flex items-center gap-2">
                    <i
                      className={`fas ${
                        formState.currentStep === "business-info"
                          ? "fa-building"
                          : formState.currentStep === "outcomes"
                          ? "fa-list-check"
                          : (formState.currentStep as any) === "scorecards"
                          ? "fa-clipboard-check"
                          : (formState.currentStep as any) === "visualization"
                          ? "fa-project-diagram"
                          : (formState.currentStep as any) === "insights"
                          ? "fa-eye"
                          : "fa-exclamation-triangle"
                      } text-purple-700`}
                    ></i>
                    {formState.currentStep === "business-info" && "Provide your business information"}
                    {formState.currentStep === "outcomes" && "Define your call outcomes"}
                    {(formState.currentStep as any) === "scorecards" && "Configure scorecards"}
                    {(formState.currentStep as any) === "visualization" && "Visualize your blueprint tree"}
                    {(formState.currentStep as any) === "insights" && "Configure customer insights"}
                    {(formState.currentStep as any) === "objections" && "Configure customer objections"}
                  </p>
                </div>
              </div>
              <div className="text-right bg-purple-50 px-6 py-3 rounded-xl border border-purple-100">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                  {Math.round(progressValue)}%
                </div>
                <div className="text-sm font-medium text-purple-700">Progress Complete</div>
              </div>
            </div>
            <div className="relative">
              <ProgressBar value={progressValue} className="h-3 rounded-full overflow-hidden" showValue={false} />
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500 px-1">
                <span>Business</span>
                <span>Outcomes</span>
                <span>Scorecards</span>
                <span>Visualize</span>
                <span>Insights</span>
                <span>Objections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Save Button - Positioned outside form container */}
        <div className="fixed top-20 right-6 z-50">
          <div className="flex flex-col items-end gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <Button
              type="button"
              label="Save Progress"
              icon="fas fa-save"
              className="p-button-outlined p-button-secondary"
              onClick={handleManualSave}
              disabled={isSaving}
              loading={isSaving}
              size="small"
            />

            {/* Save Status */}
            <div className="text-xs text-center">
              {isSaving ? (
                <span className="text-purple-700">Saving...</span>
              ) : lastSaved ? (
                <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span className="text-gray-500">Not saved</span>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit(handleNext)}>
            <div className="p-6">{renderCurrentStep()}</div>

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {formState.currentStep === "business-info" ? (
                  <Button
                    type="button"
                    label="Create Company"
                    icon="fas fa-plus"
                    className="p-button-outlined p-button-secondary w-full sm:w-auto"
                    onClick={() => router.push("/")}
                    tooltip="Go back to create a new company"
                    tooltipOptions={{ position: "top" }}
                  />
                ) : (
                  <Button
                    type="button"
                    label="Previous"
                    icon="fas fa-arrow-left"
                    className="p-button-outlined w-full sm:w-auto"
                    onClick={handlePrevious}
                  />
                )}

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {(formState.currentStep as any) === "objections" ? (
                    <Button type="submit" label="Complete Blueprint" icon="fas fa-check" className="p-button-success w-full sm:w-auto" />
                  ) : (
                    <Button type="submit" label="Next Step" icon="fas fa-arrow-right" iconPos="right" className="w-full sm:w-auto" />
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">Powered by Ginni.ai - AI-driven sales coaching</p>
        </div>
      </div>

      {/* Visualize Tree Button - Only shown after form completion */}
      {isFormCompleted && (
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
                <i className="fas fa-check text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Blueprint Complete!</h3>
              <p className="text-gray-600">
                Your onboarding blueprint has been generated successfully. You can now visualize it as an interactive tree.
              </p>
            </div>
            <Button
              type="button"
              label="Visualize Tree"
              icon="fas fa-sitemap"
              className="p-button-info shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleVisualize}
            />
          </div>
        </div>
      )}

      {/* Flow Visualization Overlay */}
      {showFlow && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-end animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFlow(false);
            }
          }}
        >
          <div className="w-full h-full max-w-none bg-white shadow-2xl transform transition-all duration-300 ease-in-out animate-slideInRight">
            <BlueprintFlow blueprintData={formState.blueprintData} onClose={() => setShowFlow(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
