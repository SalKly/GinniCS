import React, { useState } from "react";
import { Control, Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { OutcomeSelector } from "../../form/OutcomeSelector";
import { StepProps, BlueprintData } from "../../../models/blueprint";

interface ObjectionsStepProps extends StepProps {
  control: Control<any>;
}

interface ObjectionWithOutcomes {
  name: string;
  description: string;
  outcomes: string[];
}

export function ObjectionsStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control }: ObjectionsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "objections",
  });

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  const objections = useWatch({
    control,
    name: "objections",
  }) as ObjectionWithOutcomes[] | undefined;

  const outcomes = useWatch({
    control,
    name: "nestedNodes",
  });

  const addObjection = () => {
    append({
      name: "",
      description: "",
      outcomes: ["ALL_OUTCOMES"],
    });
    // Expand the new card
    const newIndex = fields.length;
    setExpandedCards(new Set([...expandedCards, newIndex]));
  };

  const removeObjection = (index: number) => {
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
        <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-lg mb-3">
          <i className="fas fa-exclamation-triangle text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Objections Configuration</h2>
        <p className="text-gray-600">Define common objections that sales reps should be prepared to handle.</p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">About Customer Objections</h4>
            <p className="text-purple-800">
              Customer objections are concerns, hesitations, or pushback that prospects might raise during sales calls. Defining these helps your team
              prepare responses and improve their handling of common challenges. You can assign each objection to all outcomes or specific ones.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customer Objections ({fields.length})</h3>
          <Button type="button" label="Add Objection" icon="fas fa-plus" className="p-button-outlined" onClick={addObjection} />
        </div>

        {fields.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-exclamation-triangle"></i>
            <p>No objections created yet. Click "Add Objection" to define common customer concerns.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const isExpanded = expandedCards.has(index);
          const objection = objections?.[index];

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
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{objection?.name || `Objection ${index + 1}`}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        {objection?.outcomes?.includes("ALL_OUTCOMES") ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">All Outcomes</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">{objection?.outcomes?.length || 0} outcome(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeObjection(index)}
                    tooltip="Remove objection"
                  />
                </div>

                {/* Card Content */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    {/* Basic Info Section */}
                    <div className="bg-orange-50 rounded-lg p-4 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-shield-alt text-orange-600"></i>
                        Objection Details
                      </h5>
                      <InputTextField
                        control={control}
                        field={`objections.${index}.name`}
                        label="Objection Name"
                        placeholder="e.g., Price Too High, Not the Right Time, Happy with Current Solution"
                        isRequired
                        toolTip="A clear, concise name for this objection"
                      />

                      <TextAreaField
                        control={control}
                        field={`objections.${index}.description`}
                        label="Description & Handling Strategy"
                        placeholder="Describe the objection and provide guidance on how to address it effectively..."
                        rows={5}
                        isRequired
                        toolTip="Explain the objection and provide guidance on addressing it"
                      />
                    </div>

                    {/* Configuration Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <i className="fas fa-cog text-orange-600"></i>
                        Apply to Outcomes
                      </h5>
                      {/* Outcome Selector */}
                      <Controller
                        name={`objections.${index}.outcomes`}
                        control={control}
                        defaultValue={["ALL_OUTCOMES"]}
                        render={({ field }) => (
                          <OutcomeSelector
                            outcomes={outcomes || []}
                            selectedOutcomes={field.value || ["ALL_OUTCOMES"]}
                            onChange={field.onChange}
                            label="Select Call Outcomes"
                            placeholder="Select outcomes or 'All Outcomes'"
                            tooltip="Choose which outcomes this objection applies to"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="success-box">
        <div className="flex items-start gap-4">
          <div className="text-success-600 mt-1">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div>
            <h4 className="font-semibold text-success-900 mb-2">Almost Done!</h4>
            <p className="text-success-800">
              You've configured all evaluation criteria. Click "Complete Blueprint" to finalize and view your interactive blueprint tree.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
