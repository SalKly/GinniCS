import React from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextField } from "./InputTextField";
import { TextAreaField } from "./TextAreaField";
import { SelectField, SelectOption } from "./SelectField";

interface YesNoScorecardSectionProps {
  control: Control<any>;
  fieldName: string;
}

const failCriteriaOptions: SelectOption[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const failWeightOptions: SelectOption[] = [
  { label: "1/2 - Fails if 2 out of 2 criteria fail", value: "1/2" },
  { label: "1/3 - Fails if 3 out of 3 criteria fail", value: "1/3" },
  { label: "1/4 - Fails if 4 out of 4 criteria fail", value: "1/4" },
  { label: "1/5 - Fails if 5 out of 5 criteria fail", value: "1/5" },
];

// Conditional component for fail weight
function YesNoFailWeightField({ control, fieldName, index }: { control: Control<any>; fieldName: string; index: number }) {
  const isItFailCriteria = useWatch({
    control,
    name: `${fieldName}.${index}.isItFailCriteria`,
  });

  if (isItFailCriteria !== "Yes") {
    return null;
  }

  return (
    <SelectField
      control={control}
      field={`${fieldName}.${index}.failWeight`}
      label="Fail Weight"
      options={failWeightOptions}
      isRequired
      toolTip="Select how many fail criteria must fail together to fail the entire call"
    />
  );
}

export function YesNoScorecardSection({ control, fieldName }: YesNoScorecardSectionProps) {
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
    });
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
            <i className="fas fa-check-circle text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Playbook Checks (Yes/No)</h3>
            <p className="text-sm text-gray-600">Binary evaluation criteria with yes/no answers for call assessment</p>
          </div>
        </div>
        <Button type="button" label="Add Item" icon="fas fa-plus" className="p-button-sm p-button-outlined" onClick={addItem} />
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">{index + 1}</div>
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

            <div className="space-y-4">
              <InputTextField
                control={control}
                field={`${fieldName}.${index}.name`}
                label="Question"
                placeholder="e.g., Did the rep ask about budget?"
                isRequired
              />

              <TextAreaField
                control={control}
                field={`${fieldName}.${index}.description`}
                label="Description"
                placeholder="Additional context for AI evaluation"
                rows={3}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <SelectField
                control={control}
                field={`${fieldName}.${index}.isItFailCriteria`}
                label="Is it Fail Criteria?"
                options={failCriteriaOptions}
                isRequired
              />

              {/* Conditional Fail Weight Field */}
              <YesNoFailWeightField control={control} fieldName={fieldName} index={index} />
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-inbox text-3xl mb-3 block"></i>
          <p className="text-sm">No playbook checks added yet. Click "Add Item" to create yes/no evaluation criteria.</p>
        </div>
      )}
    </div>
  );
}
