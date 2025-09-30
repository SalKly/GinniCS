import React from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextField } from "./InputTextField";
import { TextAreaField } from "./TextAreaField";
import { SelectField, SelectOption } from "./SelectField";

interface VariableScorecardSectionProps {
  control: Control<any>;
  fieldName: string;
}

const failWeightOptions: SelectOption[] = [
  { label: "1/2 - Fails if 2 out of 2 criteria fail", value: "1/2" },
  { label: "1/3 - Fails if 3 out of 3 criteria fail", value: "1/3" },
  { label: "1/4 - Fails if 4 out of 4 criteria fail", value: "1/4" },
  { label: "1/5 - Fails if 5 out of 5 criteria fail", value: "1/5" },
];

// Conditional component for variable fail criteria fields
function VariableFailCriteriaFields({ control, fieldName, index }: { control: Control<any>; fieldName: string; index: number }) {
  const isItFailCriteria = useWatch({
    control,
    name: `${fieldName}.${index}.isItFailCriteria`,
  });

  if (isItFailCriteria !== "Yes") {
    return null;
  }

  return (
    <div className="space-y-4">
      <SelectField
        control={control}
        field={`${fieldName}.${index}.failWeight`}
        label="Fail Weight"
        options={failWeightOptions}
        isRequired
        toolTip="Select how many fail criteria must fail together to fail the entire call"
      />

      <SelectField
        control={control}
        field={`${fieldName}.${index}.failScore`}
        label="Fail Score"
        options={[
          { label: "Score 1", value: 1 },
          { label: "Score 2", value: 2 },
          { label: "Score 3", value: 3 },
          { label: "Score 4", value: 4 },
          { label: "Score 5", value: 5 },
        ]}
        isRequired
        toolTip="The score that constitutes failure for this criteria"
      />
    </div>
  );
}

export function VariableScorecardSection({ control, fieldName }: VariableScorecardSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const addItem = () => {
    append({
      name: "",
      description: "",
      isItFailCriteria: "No",
      failWeight: "",
      score1Desc: "",
      score2Desc: "",
      score3Desc: "",
      score4Desc: "",
      score5Desc: "",
      failScore: 2,
    });
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
            <i className="fas fa-star text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Variable Scorecard</h3>
            <p className="text-sm text-gray-600">Scaled evaluation criteria (1-5 rating) for detailed call assessment</p>
          </div>
        </div>
        <Button type="button" label="Add Item" icon="fas fa-plus" className="p-button-sm p-button-outlined" onClick={addItem} />
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-100 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
              </div>
              <Button
                type="button"
                icon="fas fa-trash"
                className="p-button-danger p-button-outlined p-button-sm"
                onClick={() => removeItem(index)}
                tooltip="Remove this item"
              />
            </div>

            {/* Question */}
            <div className="mb-6">
              <InputTextField
                control={control}
                field={`${fieldName}.${index}.name`}
                label="Question"
                placeholder="e.g., How well did the rep handle objections?"
                isRequired
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <TextAreaField
                control={control}
                field={`${fieldName}.${index}.description`}
                label="Description"
                placeholder="Additional context for AI evaluation"
                rows={3}
                isRequired
              />
            </div>

            {/* Score Descriptions */}
            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 mb-4">Score Descriptions (1-5)</h5>
              <div className="space-y-4">
                {[
                  { score: 1, field: "score1Desc" },
                  { score: 2, field: "score2Desc" },
                  { score: 3, field: "score3Desc" },
                  { score: 4, field: "score4Desc" },
                  { score: 5, field: "score5Desc" },
                ].map(({ score, field }) => (
                  <div key={score} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                      {score}
                    </div>
                    <div className="flex-1">
                      <TextAreaField
                        control={control}
                        field={`${fieldName}.${index}.${field}`}
                        label={`Score ${score} Description`}
                        placeholder={`What does a score of ${score} look like?`}
                        rows={2}
                        isRequired
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fail Criteria Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={control}
                  field={`${fieldName}.${index}.isItFailCriteria`}
                  label="Is it Fail Criteria?"
                  options={[
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                  ]}
                  isRequired
                />

                {/* Conditional Fail Criteria Fields */}
                <VariableFailCriteriaFields control={control} fieldName={fieldName} index={index} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-inbox text-3xl mb-3 block"></i>
          <p className="text-sm">No Variable items added yet. Click "Add Item" to create evaluation criteria.</p>
        </div>
      )}
    </div>
  );
}
