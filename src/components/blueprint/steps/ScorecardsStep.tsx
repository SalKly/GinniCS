import React, { useState } from "react";
import { Control, Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { SelectField } from "../../form/SelectField";
import { OutcomeSelector } from "../../form/OutcomeSelector";
import { StepProps, BlueprintData } from "../../../models/blueprint";

interface ScorecardsStepProps extends StepProps {
  control: Control<any>;
}

interface ScorecardWithOutcomes {
  name: string;
  description: string;
  outcomes: string[];
  type: "boolean" | "variable";
  // Boolean fields
  isItFailCriteria?: string;
  failWeight?: string;
  // Variable fields
  score1Desc?: string;
  score2Desc?: string;
  score3Desc?: string;
  score4Desc?: string;
  score5Desc?: string;
  failScore?: number;
}

export function ScorecardsStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control }: ScorecardsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scorecards",
  });

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  const scorecards = useWatch({
    control,
    name: "scorecards",
  }) as ScorecardWithOutcomes[] | undefined;

  const outcomes = useWatch({
    control,
    name: "nestedNodes",
  });

  const typeOptions = [
    { label: "Yes/No", value: "boolean" },
    { label: "Variable (1-5)", value: "variable" },
  ];

  const failCriteriaOptions = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ];

  const addScorecard = () => {
    append({
      name: "",
      description: "",
      outcomes: ["ALL_OUTCOMES"],
      type: "boolean",
      isItFailCriteria: "No",
      failWeight: "",
      score1Desc: "",
      score2Desc: "",
      score3Desc: "",
      score4Desc: "",
      score5Desc: "",
      failScore: 1,
    });
    // Expand the new card
    const newIndex = fields.length;
    setExpandedCards(new Set([...expandedCards, newIndex]));
  };

  const removeScorecard = (index: number) => {
    remove(index);
    const newExpanded = new Set(expandedCards);
    newExpanded.delete(index);
    setExpandedCards(newExpanded);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg mb-3">
          <i className="fas fa-clipboard-check text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scorecards Configuration</h2>
        <p className="text-gray-600">Create scorecards that can be applied to all outcomes or specific outcomes.</p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">About Scorecards</h4>
            <p className="text-purple-800">
              Scorecards are evaluation criteria used to assess calls. <strong>Yes/No scorecards</strong> check for presence/absence of behaviors.{" "}
              <strong>Variable scorecards</strong> rate behaviors on a scale of 1-5. You can assign each scorecard to all outcomes or specific ones.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Scorecards ({fields.length})</h3>
          <Button type="button" label="Add Scorecard" icon="fas fa-plus" className="p-button-outlined" onClick={addScorecard} />
        </div>

        {fields.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <p>No scorecards created yet. Click "Add Scorecard" to create your first evaluation criterion.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const isExpanded = expandedCards.has(index);
          const scorecard = scorecards?.[index];
          const isFailCriteria = scorecard?.isItFailCriteria === "Yes";

          return (
            <Card key={field.id} className="shadow-sm">
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                      className="p-button-text p-button-sm"
                      onClick={() => toggleExpanded(index)}
                    />
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{scorecard?.name || `Scorecard ${index + 1}`}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {scorecard?.type === "boolean" ? "Yes/No" : "Variable"}
                        </span>
                        {scorecard?.outcomes?.includes("ALL_OUTCOMES") ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">All Outcomes</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">{scorecard?.outcomes?.length || 0} outcome(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeScorecard(index)}
                    tooltip="Remove scorecard"
                  />
                </div>

                {/* Card Content */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    {/* Basic Info Section */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-info-circle text-blue-600"></i>
                        Basic Information
                      </h5>
                      <InputTextField
                        control={control}
                        field={`scorecards.${index}.name`}
                        label="Scorecard Name"
                        placeholder="e.g., Greeting Quality, Product Knowledge"
                        isRequired
                        toolTip="A clear name for this evaluation criterion"
                      />

                      <TextAreaField
                        control={control}
                        field={`scorecards.${index}.description`}
                        label="Description"
                        placeholder="Describe what this scorecard evaluates and why it matters..."
                        rows={4}
                        isRequired
                        toolTip="Explain what behavior or quality this scorecard measures"
                      />
                    </div>

                    {/* Configuration Section */}
                    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-cog text-purple-600"></i>
                        Configuration
                      </h5>

                      {/* Outcome Selector */}
                      <Controller
                        name={`scorecards.${index}.outcomes`}
                        control={control}
                        defaultValue={["ALL_OUTCOMES"]}
                        render={({ field }) => (
                          <OutcomeSelector
                            outcomes={outcomes || []}
                            selectedOutcomes={field.value || ["ALL_OUTCOMES"]}
                            onChange={field.onChange}
                            label="Apply to Call Outcomes"
                            placeholder="Select outcomes or 'All Outcomes'"
                            tooltip="Choose which outcomes this scorecard applies to"
                          />
                        )}
                      />

                      {/* Type Selector */}
                      <Controller
                        name={`scorecards.${index}.type`}
                        control={control}
                        defaultValue="boolean"
                        render={({ field }) => (
                          <div className="field">
                            <label htmlFor={`scorecard-type-${index}`} className="block text-sm font-semibold text-gray-900 mb-2">
                              Scorecard Type
                              <i
                                className="fas fa-info-circle ml-2 text-purple-700 cursor-help"
                                title="Choose Yes/No for binary checks, or Variable for 1-5 scale ratings"
                                style={{ fontSize: "0.875rem" }}
                              ></i>
                            </label>
                            <Dropdown
                              id={`scorecard-type-${index}`}
                              value={field.value || "boolean"}
                              onChange={(e) => field.onChange(e.value)}
                              options={typeOptions}
                              className="w-full"
                              placeholder="Select scorecard type"
                            />
                          </div>
                        )}
                      />
                    </div>

                    {/* Type-specific fields */}
                    {scorecard?.type === "boolean" ? (
                      <div className="bg-green-50 rounded-lg p-4 space-y-4">
                        <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <i className="fas fa-check-circle text-green-600"></i>
                          Yes/No Scorecard Settings
                        </h5>
                        <SelectField
                          control={control}
                          field={`scorecards.${index}.isItFailCriteria`}
                          label="Is this a Fail Criteria?"
                          options={failCriteriaOptions}
                          toolTip="If Yes, failing this scorecard means the call automatically fails"
                        />

                        {isFailCriteria && (
                          <InputTextField
                            control={control}
                            field={`scorecards.${index}.failWeight`}
                            label="Fail Weight"
                            placeholder="e.g., IMMEDIATE, WITH_1"
                            isRequired
                            toolTip="The weight/severity of failing this criterion"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Fail Criteria */}
                        <div className="bg-orange-50 rounded-lg p-4 space-y-4">
                          <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-orange-600"></i>
                            Fail Criteria Settings
                          </h5>
                          <SelectField
                            control={control}
                            field={`scorecards.${index}.isItFailCriteria`}
                            label="Is this a Fail Criteria?"
                            options={failCriteriaOptions}
                            toolTip="If Yes, scoring below the fail threshold means the call automatically fails"
                          />

                          {isFailCriteria && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InputTextField
                                control={control}
                                field={`scorecards.${index}.failWeight`}
                                label="Fail Weight"
                                placeholder="e.g., IMMEDIATE, WITH_1"
                                isRequired
                                toolTip="The weight/severity of failing this criterion"
                              />

                              <SelectField
                                control={control}
                                field={`scorecards.${index}.failScore`}
                                label="Fail Score Threshold"
                                options={[
                                  { label: "1 or below", value: "1" },
                                  { label: "2 or below", value: "2" },
                                  { label: "3 or below", value: "3" },
                                  { label: "4 or below", value: "4" },
                                ]}
                                toolTip="Scores at or below this threshold will trigger a fail"
                              />
                            </div>
                          )}
                        </div>

                        {/* Score Descriptions */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <i className="fas fa-star text-blue-600"></i>
                            Score Descriptions (1-5 Scale)
                          </h5>
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <TextAreaField
                                key={score}
                                control={control}
                                field={`scorecards.${index}.score${score}Desc`}
                                label={`Score ${score} - ${
                                  score === 1 ? "Poor" : score === 2 ? "Fair" : score === 3 ? "Good" : score === 4 ? "Very Good" : "Excellent"
                                }`}
                                placeholder={`Describe what a score of ${score} means...`}
                                rows={2}
                                isRequired
                                toolTip={`What behavior/quality warrants a score of ${score}?`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="warning-box">
        <div className="flex items-start gap-4">
          <div className="text-warning-600 mt-1">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-semibold text-warning-900 mb-2">Next Steps</h4>
            <p className="text-warning-800">After configuring scorecards, you'll set up insights and objections for your call outcomes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
