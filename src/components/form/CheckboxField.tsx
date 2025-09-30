import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Checkbox } from "primereact/checkbox";

import FieldsHeader from "./FieldsHeader";

export function CheckboxField<T extends FieldValues>({
  control,
  field,
  label,
  toolTip,
  readOnly = false,
  disabled = false,
  onBlur,
  onFocus,
  onChange,
  showClear,
  isRequired,
}: {
  control: Control<T>;
  field: string;
  label?: string;
  toolTip?: string;
  readOnly?: boolean;
  disabled?: boolean;
  onBlur?: (e: string) => void;
  onFocus?: (e: string) => void;
  onChange?: (e: string) => void;
  showClear?: boolean;
  isRequired?: boolean;
}) {
  return (
    <Controller
      name={field as unknown as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <>
          <FieldsHeader
            field={field}
            label={label}
            toolTip={toolTip}
            onChange={onChange as (val: unknown) => void}
            showClear={showClear}
            isRequired={isRequired}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={"checkbox-" + field.name}
              checked={field.value || false}
              onChange={(e) => {
                field.onChange(e.checked);
                if (onChange) onChange(e.checked);
              }}
              ref={field.ref}
              readOnly={readOnly === true}
              disabled={disabled === true}
            />
            <label htmlFor={"checkbox-" + field.name} className="text-sm text-gray-700">
              {label}
            </label>
          </div>
          {fieldState.error && <span className="FieldError">{fieldState.error.message}</span>}
        </>
      )}
    />
  );
}
