import React, { useState } from "react";
import { Control, useFieldArray, useWatch, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputTextField } from "../form/InputTextField";
import { TextAreaField } from "../form/TextAreaField";
import { ItemListField } from "../form/ItemListField";
import { YesNoScorecardSection } from "../form/YesNoScorecardSection";
import { VariableScorecardSection } from "../form/VariableScorecardSection";

interface TreeOutcomeManagerProps {
  control: Control<any>;
  fieldName: string;
  parentOutcomeName: string;
  level?: number;
}

interface OutcomeNode {
  id: string;
  nodeName: string;
  nodeDescription: string;
  isScored?: boolean;
  customerInsights: any[];
  customerObjection: any[];
  booleanScoreCard: any[];
  variableScoreCard: any[];
  nestedNodes: OutcomeNode[];
}

export function TreeOutcomeManager({ control, fieldName, parentOutcomeName, level = 0 }: TreeOutcomeManagerProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  // Watch all fields at once to avoid hooks in loop
  const allFields = useWatch({
    control,
    name: fieldName,
  });

  const addSubOutcome = () => {
    append({
      nodeName: "",
      nodeDescription: "",
      isScored: true, // Default to true
      customerInsights: [],
      customerObjection: [],
      booleanScoreCard: [],
      variableScoreCard: [],
      nestedNodes: [],
    });
  };

  const removeSubOutcome = (index: number) => {
    remove(index);
    const newExpanded = new Set(expandedItems);
    const newExpandedDetails = new Set(expandedDetails);
    newExpanded.delete(index);
    newExpandedDetails.delete(index);
    setExpandedItems(newExpanded);
    setExpandedDetails(newExpandedDetails);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const toggleDetailsExpanded = (index: number) => {
    const newExpandedDetails = new Set(expandedDetails);
    if (newExpandedDetails.has(index)) {
      newExpandedDetails.delete(index);
    } else {
      newExpandedDetails.add(index);
    }
    setExpandedDetails(newExpandedDetails);
  };

  // Get visual indicators for hierarchy
  const getLevelIndicator = () => {
    if (level === 0) return "📁";
    if (level === 1) return "📄";
    if (level === 2) return "📋";
    return "•";
  };

  // Get background color based on level
  const getBackgroundColor = () => {
    if (level === 0) return "bg-purple-50 border-purple-200";
    if (level === 1) return "bg-green-50 border-green-200";
    if (level === 2) return "bg-purple-50 border-purple-200";
    return "bg-gray-50 border-gray-200";
  };

  // Get border color based on level
  const getBorderColor = () => {
    if (level === 0) return "border-l-purple-400";
    if (level === 1) return "border-l-green-400";
    if (level === 2) return "border-l-purple-400";
    return "border-l-gray-400";
  };

  // Get level badge color
  const getLevelBadgeColor = () => {
    if (level === 0) return "bg-purple-700";
    if (level === 1) return "bg-green-600";
    if (level === 2) return "bg-purple-600";
    return "bg-gray-600";
  };

  // Get level name
  const getLevelName = () => {
    if (level === 0) return "Sub-Outcomes";
    if (level === 1) return "Sub-Scenarios";
    if (level === 2) return "Sub-Cases";
    return `Level ${level + 1}`;
  };

  if (fields.length === 0) {
    return (
      <div className={`${getBackgroundColor()} border rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${getLevelBadgeColor()} text-white rounded-lg flex items-center justify-center text-sm font-semibold`}>
              {level + 1}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{getLevelName()}</h4>
              <p className="text-sm text-gray-600">Add specific scenarios within "{parentOutcomeName}"</p>
            </div>
          </div>
          <Button type="button" label="Add" icon="fas fa-plus" className="p-button-sm" onClick={addSubOutcome} />
        </div>

        <div className="text-center py-4 text-gray-500">
          <i className="fas fa-lightbulb text-2xl mb-2 block opacity-50"></i>
          <p className="text-sm">No {getLevelName().toLowerCase()} added yet. Click "Add" to create specific scenarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header for this level */}
      <div className={`${getBackgroundColor()} border rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${getLevelBadgeColor()} text-white rounded-lg flex items-center justify-center text-sm font-semibold`}>
              {level + 1}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{getLevelName()}</h4>
              <p className="text-sm text-gray-600">
                {fields.length} item{fields.length !== 1 ? "s" : ""} within "{parentOutcomeName}"
              </p>
            </div>
          </div>
          <Button type="button" label="Add" icon="fas fa-plus" className="p-button-sm" onClick={addSubOutcome} />
        </div>
      </div>

      {/* Tree Items */}
      {fields.map((field, index) => {
        const isExpanded = expandedItems.has(index);
        const isDetailsExpanded = expandedDetails.has(index);

        // Get current field values from the watched data
        const currentField = allFields?.[index];

        return (
          <div key={field.id} className="space-y-2">
            {/* Main Item Card */}
            <div className={`${getBackgroundColor()} border ${getBorderColor()} border-l-4 rounded-lg shadow-sm`}>
              {/* Item Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Expand/Collapse Button */}
                    <Button
                      type="button"
                      icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                      className="p-button-text p-button-sm"
                      onClick={() => toggleExpanded(index)}
                    />

                    {/* Level Indicator */}
                    <div className="w-6 h-6 bg-purple-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {currentField?.nodeName || `${level === 0 ? "Sub-Outcome" : "Outcome"} ${index + 1}`}
                      </h5>
                      <p className="text-sm text-gray-600">{currentField?.nodeDescription || "No description provided"}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      icon={isDetailsExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down"}
                      className="p-button-text p-button-sm"
                      onClick={() => toggleDetailsExpanded(index)}
                      tooltip={isDetailsExpanded ? "Hide details" : "Show details"}
                    />
                    <Button
                      type="button"
                      icon="fas fa-trash"
                      className="p-button-danger p-button-outlined p-button-sm"
                      onClick={() => removeSubOutcome(index)}
                      tooltip="Remove this outcome"
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <InputTextField
                        control={control}
                        field={`${fieldName}.${index}.nodeName`}
                        label="Outcome Name"
                        placeholder="e.g., No-Show, Reschedule Attempted, Follow-up Required"
                        isRequired
                      />

                      <TextAreaField
                        control={control}
                        field={`${fieldName}.${index}.nodeDescription`}
                        label="Description"
                        placeholder="Describe this specific scenario"
                        rows={3}
                        isRequired
                      />

                      {/* isScored Checkbox */}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Controller
                          name={`${fieldName}.${index}.isScored`}
                          control={control}
                          defaultValue={true}
                          render={({ field }) => (
                            <div className="flex items-center gap-3">
                              <Checkbox
                                inputId={`isScored-${fieldName}-${index}`}
                                checked={field.value !== false}
                                onChange={(e) => field.onChange(e.checked)}
                              />
                              <label htmlFor={`isScored-${fieldName}-${index}`} className="cursor-pointer">
                                <span className="font-medium text-gray-900">Include in Scoring</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  Uncheck if this outcome should be excluded from scoring (e.g., "No Shows")
                                </p>
                              </label>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Details Toggle */}
                    <div className="border-t border-gray-100 pt-4">
                      <Button
                        type="button"
                        label={isDetailsExpanded ? "Hide Detailed Configuration" : "Show Detailed Configuration"}
                        icon={isDetailsExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down"}
                        className="p-button-outlined p-button-sm w-full"
                        onClick={() => toggleDetailsExpanded(index)}
                      />
                    </div>

                    {/* Detailed Configuration */}
                    {isDetailsExpanded && (
                      <div className="space-y-6 pt-4 border-t border-gray-100">
                        {/* Customer Insights */}
                        <ItemListField
                          control={control}
                          fieldName={`${fieldName}.${index}.customerInsights`}
                          title="Customer Insights"
                          description="What insights are relevant for this scenario"
                          icon="fas fa-eye"
                          color="bg-purple-700"
                        />

                        {/* Objections */}
                        <ItemListField
                          control={control}
                          fieldName={`${fieldName}.${index}.customerObjection`}
                          title="Customer Objections"
                          description="What objections are common for this scenario"
                          icon="fas fa-exclamation-triangle"
                          color="bg-orange-500"
                        />

                        {/* Yes/No Scorecard */}
                        <YesNoScorecardSection control={control} fieldName={`${fieldName}.${index}.booleanScoreCard`} />

                        {/* Variable Scorecard */}
                        <VariableScorecardSection control={control} fieldName={`${fieldName}.${index}.variableScoreCard`} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recursive Children */}
            {isExpanded && (
              <TreeOutcomeManager
                control={control}
                fieldName={`${fieldName}.${index}.nestedNodes`}
                parentOutcomeName={currentField?.nodeName || `Outcome ${index + 1}`}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
