import React from "react";
import { Control } from "react-hook-form";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { ItemListField } from "../../form/ItemListField";
import { YesNoScorecardSection } from "../../form/YesNoScorecardSection";
import { VariableScorecardSection } from "../../form/VariableScorecardSection";
import { TreeOutcomeManager } from "../TreeOutcomeManager";
import { OutcomeFormProps } from "../../../models/blueprint";

interface OutcomeDetailsStepProps extends OutcomeFormProps {
  control: Control<any>;
}

export function OutcomeDetailsStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, outcomeIndex, control }: OutcomeDetailsStepProps) {
  const currentOutcome = formState.blueprintData.nestedNodes[outcomeIndex];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-700 text-white rounded-lg mb-3">
          <i className="fas fa-flag text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure "{currentOutcome?.nodeName || "Outcome"}"</h2>
        <p className="text-gray-600">Set up specific evaluation criteria and coaching guidelines for this call outcome.</p>
      </div>

      {/* Outcome Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-700 text-white rounded-lg flex items-center justify-center">
            <i className="fas fa-flag text-sm"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-600">Name and description for this call outcome</p>
          </div>
        </div>

        <div className="space-y-4">
          <InputTextField
            control={control}
            field={`nestedNodes.${outcomeIndex}.nodeName`}
            label="Outcome Name"
            placeholder="e.g., Demo Scheduled"
            isRequired
            toolTip="The name of this call outcome"
          />

          <TextAreaField
            control={control}
            field={`nestedNodes.${outcomeIndex}.nodeDescription`}
            label="Description"
            placeholder="Describe what this outcome means and when it occurs"
            rows={4}
            toolTip="Provide context about this outcome for better AI understanding"
          />
        </div>
      </div>

      {/* Customer Insights Section */}
      <ItemListField
        control={control}
        fieldName={`nestedNodes.${outcomeIndex}.customerInsights`}
        title="Customer Insights"
        description="What information should be gathered about customers for this outcome"
        icon="fas fa-eye"
        color="bg-purple-700"
      />

      {/* Objections Section */}
      <ItemListField
        control={control}
        fieldName={`nestedNodes.${outcomeIndex}.customerObjection`}
        title="Customer Objections"
        description="What objections or concerns are common for this outcome"
        icon="fas fa-exclamation-triangle"
        color="bg-orange-500"
      />

      {/* Yes/No Scorecard Section */}
      <YesNoScorecardSection control={control} fieldName={`nestedNodes.${outcomeIndex}.booleanScoreCard`} />

      {/* Variable Scorecard Section */}
      <VariableScorecardSection control={control} fieldName={`nestedNodes.${outcomeIndex}.variableScoreCard`} />

      {/* Sub-Outcomes Section */}
      <TreeOutcomeManager
        control={control}
        fieldName={`nestedNodes.${outcomeIndex}.nestedNodes`}
        parentOutcomeName={currentOutcome?.nodeName || "Outcome"}
        level={0}
      />

      <div className="success-box">
        <div className="flex items-start gap-4">
          <div className="text-success-600 mt-1">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div>
            <h4 className="font-semibold text-success-900 mb-2">Configuration Complete</h4>
            <p className="text-success-800">
              This call outcome is now configured with specific evaluation criteria.
              {outcomeIndex < formState.blueprintData.nestedNodes.length - 1
                ? ` Next, you'll configure the "${formState.blueprintData.nestedNodes[outcomeIndex + 1]?.nodeName}" outcome.`
                : " You can now complete the blueprint generation."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
