import React from "react";
import { Control } from "react-hook-form";
import { ItemListField } from "../../form/ItemListField";
import { YesNoScorecardSection } from "../../form/YesNoScorecardSection";
import { VariableScorecardSection } from "../../form/VariableScorecardSection";
import { StepProps } from "../../../models/blueprint";

interface GeneralTemplateStepProps extends StepProps {
  control: Control<any>;
}

export function GeneralTemplateStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control }: GeneralTemplateStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg mb-3">
          <i className="fas fa-star text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">General Outcome Configuration</h2>
        <p className="text-gray-600">
          Configure the evaluation criteria for the General Outcome that applies to all calls. This will serve as the baseline for all call
          evaluations.
        </p>
      </div>

      {/* Customer Insights Section */}
      <ItemListField
        control={control}
        fieldName="customerInsights"
        title="Customer Insights"
        description="What insights should be captured about customers during calls"
        icon="fas fa-eye"
        color="bg-blue-500"
      />

      {/* Objections Section */}
      <ItemListField
        control={control}
        fieldName="customerObjection"
        title="Customer Objections"
        description="What objections are common during sales calls"
        icon="fas fa-exclamation-triangle"
        color="bg-orange-500"
      />

      {/* Yes/No Scorecard Section */}
      <YesNoScorecardSection control={control} fieldName="booleanScoreCard" />

      {/* Variable Scorecard Section */}
      <VariableScorecardSection control={control} fieldName="variableScoreCard" />

      <div className="info-box">
        <div className="flex items-start gap-4">
          <div className="text-info-600 mt-1">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-info-900 mb-2">General Outcome Usage</h4>
            <p className="text-info-800">
              This General Outcome configuration will be applied to every call evaluation. After this, you'll configure specific outcomes that build
              upon this foundation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
