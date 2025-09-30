import { classNames } from "primereact/utils";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { InputTextarea } from "primereact/inputtextarea";

import FieldsHeader from "./FieldsHeader";

export function TextAreaField<T extends FieldValues>({
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
  rows = 4,
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
  rows?: number;
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
          <InputTextarea
            id={"textarea-" + field.name}
            autoComplete="off"
            value={field.value === null || field.value === undefined ? "" : field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
            ref={field.ref}
            readOnly={readOnly === true}
            disabled={disabled === true}
            placeholder={placeholder}
            rows={rows}
            className={classNames({ "w-full": true, "p-invalid border-red-500 border-2": fieldState.invalid })}
            onFocus={(e) => onFocus && onFocus(e.target.value)}
            onBlur={(e) => {
              field.onBlur();
              if (onBlur) onBlur(e.target.value);
            }}
          />
          {fieldState.error && <span className="FieldError">{fieldState.error.message}</span>}
        </>
      )}
    />
  );
}
