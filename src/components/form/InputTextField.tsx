import { classNames } from "primereact/utils";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { KeyFilterType } from "primereact/keyfilter";

import FieldsHeader from "./FieldsHeader";

export function InputTextField<T extends FieldValues>({
  control,
  field,
  label,
  toolTip,
  readOnly = false,
  disabled = false,
  keyfilter,
  type,
  onBlur,
  onFocus,
  onChange,
  placeholder,
  showClear,
  isRequired,
}: {
  control: Control<T>;
  field: string;
  label?: string;
  toolTip?: string;
  readOnly?: boolean;
  disabled?: boolean;
  keyfilter?: KeyFilterType;
  onBlur?: (e: string) => void;
  onFocus?: (e: string) => void;
  onChange?: (e: string) => void;
  placeholder?: string;
  mask?: string;
  type?: string;
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
          <InputText
            id={"input-" + field}
            type={type || "text"}
            keyfilter={keyfilter}
            autoComplete="off"
            value={field.value === null || field.value === undefined ? "" : field.value}
            onChange={(e) => {
              field.onChange(e.target.value); // First, ensure react-hook-form's onChange is called
              if (onChange) onChange(e.target.value); // Then call the external onChange if provided
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.preventDefault()}
            ref={field.ref}
            readOnly={readOnly === true}
            disabled={disabled === true}
            placeholder={placeholder}
            className={classNames({ "w-full": true, "p-invalid border-red-500 border-2": fieldState.invalid })}
            onFocus={(e) => onFocus && onFocus(e.target.value)}
            onBlur={(e) => {
              field.onBlur(); // Ensure react-hook-form's onBlur is called
              if (onBlur) onBlur(e.target.value);
            }}
          />
          {fieldState.error && <span className="FieldError">{fieldState.error.message}</span>}
        </>
      )}
    />
  );
}
