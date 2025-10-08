import React from "react";
import { Control, useFieldArray } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextField } from "./InputTextField";
import { TextAreaField } from "./TextAreaField";

interface ItemListFieldProps {
  control: Control<any>;
  fieldName: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export function ItemListField({ control, fieldName, title, description, icon, color }: ItemListFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const addItem = () => {
    append({ name: "", description: "" });
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center`}>
            <i className={`${icon} text-lg`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <Button type="button" className="p-button-sm p-button-outlined" onClick={addItem}>
          <i className="fas fa-plus mr-2"></i>
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
              </div>
              <Button
                type="button"
                className="p-button-danger p-button-outlined p-button-sm"
                onClick={() => removeItem(index)}
                tooltip="Remove this item"
              >
                <i className="fas fa-trash"></i>
              </Button>
            </div>

            <div className="space-y-4">
              <InputTextField control={control} field={`${fieldName}.${index}.name`} label="Name" placeholder="Enter item name" isRequired />

              <TextAreaField
                control={control}
                field={`${fieldName}.${index}.description`}
                label="Description"
                placeholder="Describe this item"
                rows={3}
                isRequired
              />
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-inbox text-3xl mb-3 block"></i>
          <p className="text-sm">No items added yet. Click "Add Item" to get started.</p>
        </div>
      )}
    </div>
  );
}
