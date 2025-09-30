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
import { OutcomeDetailsStep } from "./steps/OutcomeDetailsStep";
import { GeneralTemplateStep } from "./steps/GeneralTemplateStep";
import BlueprintFlow from "./BlueprintFlow";
import { saveBlueprint } from "../../services/blueprints";
import { createOrUpdateCompanyForm, saveFormProgress, loadFormProgress, type CompanyForm } from "../../services/companies";
import { useRouter } from "next/router";

const initialBlueprintData: BlueprintData = {
  nodeName: "General Outcome",
  nodeDescription: "General criteria for all calls",
  customerInsights: [],
  customerObjection: [],
  booleanScoreCard: [],
  variableScoreCard: [],
  nestedNodes: [],
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

  // Initialize form data based on mode and existing data
  const getInitialFormData = (): BlueprintData => {
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
      data = existingForm.form_data;
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
            initialData = existingProgress;
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

  const getStepNumber = (step: FormStep): number => {
    switch (step) {
      case "business-info":
        return 1;
      case "outcomes":
        return 2;
      case "general":
        return 3;
      case "outcome-details":
        return 4;
      case "nested-outcomes":
        return 5;
      default:
        return 1;
    }
  };

  const getTotalSteps = (): number => {
    const baseSteps = 3; // business-info + outcomes + general
    const outcomeSteps = formState.blueprintData.nestedNodes.length;
    return baseSteps + outcomeSteps;
  };

  const getCurrentStepNumber = (): number => {
    if (formState.currentStep === "outcome-details") {
      return 3 + (formState.currentOutcomeIndex || 0) + 1;
    }
    return getStepNumber(formState.currentStep);
  };

  const handleNext = () => {
    const currentData = getValues();

    // Validate current step
    const validation = validateStep(formState.currentStep, currentData);
    if (!validation.success) {
      toast.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fix the errors before proceeding",
        life: 3000,
      });
      return;
    }

    if (formState.currentStep === "business-info") {
      const updatedBlueprintData = {
        ...formState.blueprintData,
        businessInfo: currentData.businessInfo || {
          businessName: "",
          businessGoals: "",
          companyWebsite: "",
          qaManualFile: null,
          qaManualFileName: "",
        },
      };

      updateFormState({
        currentStep: "outcomes",
        blueprintData: updatedBlueprintData,
      });
    } else if (formState.currentStep === "outcomes") {
      const updatedBlueprintData = {
        nodeName: currentData.nodeName || "General Outcome",
        nodeDescription: currentData.nodeDescription || "General criteria for all calls",
        customerInsights: currentData.customerInsights || [],
        customerObjection: currentData.customerObjection || [],
        booleanScoreCard: currentData.booleanScoreCard || [],
        variableScoreCard: currentData.variableScoreCard || [],
        nestedNodes: currentData.nestedNodes || [],
        businessInfo: formState.blueprintData.businessInfo,
      };

      updateFormState({
        currentStep: "general",
        blueprintData: updatedBlueprintData,
      });
    } else if (formState.currentStep === "general") {
      const updatedBlueprintData = {
        ...formState.blueprintData,
        customerInsights: currentData.customerInsights || [],
        customerObjection: currentData.customerObjection || [],
        booleanScoreCard: currentData.booleanScoreCard || [],
        variableScoreCard: currentData.variableScoreCard || [],
      };

      updateFormState({
        currentStep: "outcome-details",
        currentOutcomeIndex: 0,
        blueprintData: updatedBlueprintData,
      });
    } else if (formState.currentStep === "outcome-details") {
      const nextOutcomeIndex = (formState.currentOutcomeIndex || 0) + 1;
      if (nextOutcomeIndex < formState.blueprintData.nestedNodes.length) {
        updateFormState({ currentOutcomeIndex: nextOutcomeIndex });
      } else {
        // All outcomes completed
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (formState.currentStep === "outcomes") {
      updateFormState({ currentStep: "business-info" });
    } else if (formState.currentStep === "general") {
      updateFormState({ currentStep: "outcomes" });
    } else if (formState.currentStep === "outcome-details") {
      if (formState.currentOutcomeIndex === 0) {
        updateFormState({ currentStep: "general" });
      } else {
        const prevIndex = (formState.currentOutcomeIndex || 0) - 1;
        updateFormState({ currentOutcomeIndex: prevIndex });
      }
    }
  };

  const handleComplete = async () => {
    const formData = getValues();

    // Create the final flattened structure
    const finalData: BlueprintData = {
      nodeName: formData.nodeName || "General Outcome",
      nodeDescription: formData.nodeDescription || "General criteria for all calls",
      customerInsights: formData.customerInsights || [],
      customerObjection: formData.customerObjection || [],
      booleanScoreCard: formData.booleanScoreCard || [],
      variableScoreCard: formData.variableScoreCard || [],
      nestedNodes: formData.nestedNodes || [],
      businessInfo: formData.businessInfo,
    };

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
      case "general":
        return (
          <GeneralTemplateStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            control={control}
          />
        );
      case "outcome-details":
        return (
          <OutcomeDetailsStep
            formState={formState}
            onUpdateFormState={updateFormState}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            outcomeIndex={formState.currentOutcomeIndex || 0}
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
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
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
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg">
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
                          : formState.currentStep === "general"
                          ? "fa-sliders"
                          : "fa-tasks"
                      } text-blue-600`}
                    ></i>
                    {formState.currentStep === "business-info" && "Provide your business information"}
                    {formState.currentStep === "outcomes" && "Define your call outcomes"}
                    {formState.currentStep === "general" && "Configure General Outcome template"}
                    {formState.currentStep === "outcome-details" &&
                      `Configure "${formState.blueprintData.nestedNodes[formState.currentOutcomeIndex || 0]?.nodeName}" outcome`}
                  </p>
                </div>
              </div>
              <div className="text-right bg-blue-50 px-6 py-3 rounded-xl border border-blue-100">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {Math.round(progressValue)}%
                </div>
                <div className="text-sm font-medium text-blue-600">Progress Complete</div>
              </div>
            </div>
            <div className="relative">
              <ProgressBar value={progressValue} className="h-3 rounded-full overflow-hidden" showValue={false} />
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500 px-1">
                <span>Business Info</span>
                <span>Outcomes</span>
                <span>General Template</span>
                <span>Details</span>
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
                <span className="text-blue-600">Saving...</span>
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
                  {formState.currentStep === "outcome-details" &&
                  (formState.currentOutcomeIndex || 0) === formState.blueprintData.nestedNodes.length - 1 ? (
                    <>
                      <Button type="submit" label="Complete Blueprint" icon="fas fa-check" className="p-button-success w-full sm:w-auto" />
                    </>
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
