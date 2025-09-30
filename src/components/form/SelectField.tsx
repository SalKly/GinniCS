import { classNames } from "primereact/utils";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";

import FieldsHeader from "./FieldsHeader";

export interface SelectOption {
  label: string;
  value: string | number;
}

export function SelectField<T extends FieldValues>({
  control,
  field,
  label,
  toolTip,
  readOnly = false,
  disabled = false,
  onBlur,
  onFocus,
  onChange,
  placeholder,
  showClear,
  isRequired,
  options,
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
  placeholder?: string;
  showClear?: boolean;
  isRequired?: boolean;
  options: SelectOption[];
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
          <Dropdown
            id={"select-" + field.name}
            value={field.value}
            options={options}
            onChange={(e) => {
              field.onChange(e.value);
              if (onChange) onChange(e.value);
            }}
            ref={field.ref}
            readOnly={readOnly === true}
            disabled={disabled === true}
            placeholder={placeholder}
            className={classNames({ "w-full": true, "p-invalid border-red-500 border-2": fieldState.invalid })}
            onFocus={(e) => onFocus && onFocus(e.value)}
            onBlur={(e) => {
              field.onBlur();
              if (onBlur) onBlur(e.value);
            }}
          />
          {fieldState.error && <span className="FieldError">{fieldState.error.message}</span>}
        </>
      )}
    />
  );
}
