import React, { useState } from "react";
import { Control, useFieldArray, useWatch, UseFormSetValue } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { StepProps, BlueprintData } from "../../../models/blueprint";

interface DefineOutcomesStepProps extends StepProps {
  control: Control<any>;
  setValue: UseFormSetValue<BlueprintData>;
}

export function DefineOutcomesStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control, setValue }: DefineOutcomesStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "nestedNodes",
  });

  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<number>>(new Set());
  const [expandedNestedOutcomes, setExpandedNestedOutcomes] = useState<Set<string>>(new Set());

  // Watch all fields to get current values
  const allFields = useWatch({
    control,
    name: "nestedNodes",
  });

  const addOutcome = () => {
    append({
      nodeName: "",
      nodeDescription: "",
      customerInsights: [],
      customerObjection: [],
      booleanScoreCard: [],
      variableScoreCard: [],
      nestedNodes: [],
    });
  };

  const removeOutcome = (index: number) => {
    remove(index);
    // Clean up expanded state
    const newExpanded = new Set(expandedOutcomes);
    newExpanded.delete(index);
    setExpandedOutcomes(newExpanded);

    // Clean up nested expanded state for this outcome
    const newNestedExpanded = new Set(expandedNestedOutcomes);
    Array.from(newNestedExpanded).forEach((key) => {
      if (key.startsWith(`${index}-`)) {
        newNestedExpanded.delete(key);
      }
    });
    setExpandedNestedOutcomes(newNestedExpanded);
  };

  const toggleOutcomeExpanded = (index: number) => {
    const newExpanded = new Set(expandedOutcomes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedOutcomes(newExpanded);
  };

  const addNestedOutcome = (parentIndex: number) => {
    const currentNestedNodes = allFields?.[parentIndex]?.nestedNodes || [];
    const newNestedNode = {
      nodeName: "",
      nodeDescription: "",
      customerInsights: [],
      customerObjection: [],
      booleanScoreCard: [],
      variableScoreCard: [],
      nestedNodes: [],
    };

    // Update the nested nodes array
    const updatedNestedNodes = [...currentNestedNodes, newNestedNode];

    // Use setValue to update the specific nested nodes array
    setValue(`nestedNodes.${parentIndex}.nestedNodes`, updatedNestedNodes);
  };

  const removeNestedOutcome = (parentIndex: number, nestedIndex: number) => {
    const currentNestedNodes = allFields?.[parentIndex]?.nestedNodes || [];
    const updatedNestedNodes = currentNestedNodes.filter((_: any, index: number) => index !== nestedIndex);

    // Use setValue to update the specific nested nodes array
    setValue(`nestedNodes.${parentIndex}.nestedNodes`, updatedNestedNodes);

    // Clean up expanded state for this nested outcome
    const newNestedExpanded = new Set(expandedNestedOutcomes);
    newNestedExpanded.delete(`${parentIndex}-${nestedIndex}`);
    setExpandedNestedOutcomes(newNestedExpanded);
  };

  const toggleNestedOutcomeExpanded = (parentIndex: number, nestedIndex: number) => {
    const key = `${parentIndex}-${nestedIndex}`;
    const newNestedExpanded = new Set(expandedNestedOutcomes);
    if (newNestedExpanded.has(key)) {
      newNestedExpanded.delete(key);
    } else {
      newNestedExpanded.add(key);
    }
    setExpandedNestedOutcomes(newNestedExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-700 text-white rounded-lg mb-3">
          <i className="fas fa-flag text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Call Outcomes</h2>
        <p className="text-gray-600">
          Add specific call outcomes that can occur. You can also add nested outcomes within each outcome to create more specific scenarios.
        </p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">What are Call Outcomes?</h4>
            <p className="text-purple-800">
              Call outcomes are the different results that can happen at the end of a sales call. Examples include "Demo Scheduled", "Not Interested",
              "Needs Follow-up", etc. You can also add nested outcomes within each outcome to create more specific scenarios. In the next steps,
              you'll configure evaluation criteria that can apply to all outcomes or specific outcomes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Specific Outcomes</h3>
          <Button type="button" label="Add Another Outcome" icon="fas fa-plus" className="p-button-outlined" onClick={addOutcome} />
        </div>

        {fields.map((field, index) => {
          const isExpanded = expandedOutcomes.has(index);
          const currentField = allFields?.[index];
          const nestedOutcomes = currentField?.nestedNodes || [];

          return (
            <div key={field.id} className="blueprint-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                    className="p-button-text p-button-sm"
                    onClick={() => toggleOutcomeExpanded(index)}
                  />
                  <div className="w-6 h-6 bg-purple-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Outcome {index + 1}</h3>
                  {nestedOutcomes.length > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">{nestedOutcomes.length} nested</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    label="Add Nested"
                    icon="fas fa-plus"
                    className="p-button-outlined p-button-sm"
                    onClick={() => addNestedOutcome(index)}
                    tooltip="Add a nested outcome within this outcome"
                  />
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeOutcome(index)}
                    tooltip="Remove this outcome"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputTextField
                  control={control}
                  field={`nestedNodes.${index}.nodeName`}
                  label="Outcome Name"
                  placeholder="e.g., Demo Scheduled, Not Interested"
                  isRequired
                  toolTip="A clear, concise name for this call outcome"
                />

                <TextAreaField
                  control={control}
                  field={`nestedNodes.${index}.nodeDescription`}
                  label="Description"
                  placeholder="Describe what this outcome means and when it occurs"
                  rows={3}
                  toolTip="Provide context about this outcome for better AI understanding"
                />
              </div>

              {/* Nested Outcomes Section */}
              {isExpanded && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        <i className="fas fa-sitemap text-xs"></i>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Nested Outcomes</h4>
                      <span className="text-sm text-gray-600">
                        {nestedOutcomes.length} nested outcome{nestedOutcomes.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      label="Add Nested Outcome"
                      icon="fas fa-plus"
                      className="p-button-outlined p-button-sm"
                      onClick={() => addNestedOutcome(index)}
                    />
                  </div>

                  {nestedOutcomes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                      <i className="fas fa-lightbulb text-2xl mb-2 block opacity-50"></i>
                      <p className="text-sm">
                        No nested outcomes added yet. Click "Add Nested Outcome" to create specific scenarios within this outcome.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nestedOutcomes.map((nestedOutcome: any, nestedIndex: number) => {
                        const isNestedExpanded = expandedNestedOutcomes.has(`${index}-${nestedIndex}`);

                        return (
                          <div key={nestedIndex} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  icon={isNestedExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                                  className="p-button-text p-button-sm"
                                  onClick={() => toggleNestedOutcomeExpanded(index, nestedIndex)}
                                />
                                <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                  {nestedIndex + 1}
                                </div>
                                <h5 className="font-medium text-gray-900">{nestedOutcome?.nodeName || `Nested Outcome ${nestedIndex + 1}`}</h5>
                              </div>
                              <Button
                                type="button"
                                icon="fas fa-trash"
                                className="p-button-danger p-button-outlined p-button-sm"
                                onClick={() => removeNestedOutcome(index, nestedIndex)}
                                tooltip="Remove this nested outcome"
                              />
                            </div>

                            {isNestedExpanded && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InputTextField
                                    control={control}
                                    field={`nestedNodes.${index}.nestedNodes.${nestedIndex}.nodeName`}
                                    label="Nested Outcome Name"
                                    placeholder="e.g., No-Show, Reschedule Attempted"
                                    isRequired
                                    toolTip="A clear name for this nested scenario"
                                  />

                                  <TextAreaField
                                    control={control}
                                    field={`nestedNodes.${index}.nestedNodes.${nestedIndex}.nodeDescription`}
                                    label="Description"
                                    placeholder="Describe this specific scenario"
                                    rows={3}
                                    toolTip="Provide context about this nested scenario"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fields.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No specific outcomes defined yet. Click "Add Another Outcome" to create specific call outcomes.</p>
        </div>
      )}

      <div className="warning-box">
        <div className="flex items-start gap-4">
          <div className="text-warning-600 mt-1">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-semibold text-warning-900 mb-2">Next Steps</h4>
            <p className="text-warning-800">
              After defining your outcomes, you'll configure scorecards, insights, and objections. Each can be assigned to all outcomes or specific
              outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
