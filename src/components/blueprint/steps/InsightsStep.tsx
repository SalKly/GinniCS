import React, { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { StepProps, BlueprintData } from "../../../models/blueprint";

interface InsightsStepProps extends StepProps {
  control: Control<any>;
}

interface InsightWithOutcomes {
  name: string;
  description: string;
}

export function InsightsStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control }: InsightsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "insights",
  });

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  const insights = useWatch({
    control,
    name: "insights",
  }) as InsightWithOutcomes[] | undefined;

  const addInsight = () => {
    append({
      name: "",
      description: "",
      outcomes: ["ALL_OUTCOMES"], // Always apply to all outcomes
    });
    // Expand the new card
    const newIndex = fields.length;
    setExpandedCards(new Set([...expandedCards, newIndex]));
  };

  const removeInsight = (index: number) => {
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
        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-700 text-white rounded-lg mb-3">
          <i className="fas fa-eye text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Insights Configuration</h2>
        <p className="text-gray-600">Define customer insights that should be captured during calls.</p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">About Customer Insights</h4>
            <p className="text-purple-800">
              Customer insights are key pieces of information that should be gathered or observed during sales calls. These help your team understand
              customer needs, preferences, pain points, and decision-making factors.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customer Insights ({fields.length})</h3>
          <Button type="button" label="Add Insight" icon="fas fa-plus" className="p-button-outlined" onClick={addInsight} />
        </div>

        {fields.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-eye"></i>
            <p>No insights created yet. Click "Add Insight" to define what customer information should be captured.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const isExpanded = expandedCards.has(index);
          const insight = insights?.[index];

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
                    <div className="w-8 h-8 bg-purple-700 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{insight?.name || `Insight ${index + 1}`}</h4>
                    </div>
                  </div>
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeInsight(index)}
                    tooltip="Remove insight"
                  />
                </div>

                {/* Card Content */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    {/* Basic Info Section */}
                    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-lightbulb text-purple-600"></i>
                        Insight Details
                      </h5>
                      <InputTextField
                        control={control}
                        field={`insights.${index}.name`}
                        label="Insight Name"
                        placeholder="e.g., Budget Range, Decision Timeline, Pain Points"
                        isRequired
                        toolTip="A clear, concise name for this customer insight"
                      />

                      <TextAreaField
                        control={control}
                        field={`insights.${index}.description`}
                        label="Description"
                        placeholder="Describe what information should be gathered or observed and why it matters..."
                        rows={4}
                        isRequired
                        toolTip="Explain what this insight represents and why it's important"
                      />
                    </div>
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
            <p className="text-warning-800">After configuring insights, you'll set up objections that sales reps should be prepared to handle.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
