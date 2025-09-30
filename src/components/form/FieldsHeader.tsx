import { InfoIconTooltip } from "./InfoIconTooltip";
import ClearButton from "./ClearButton";
import { ControllerRenderProps, Path } from "react-hook-form";

const FieldsHeader = <T extends object>({
  field,
  label,
  toolTip,
  onChange,
  showClear,
  isRequired,
}: {
  field: ControllerRenderProps<T, Path<T>>;
  label?: string;
  toolTip?: string;
  onChange?: (val: unknown) => void;
  showClear?: boolean;
  isRequired?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      {label && label.trim() !== "" && (
        <div className="flex items-center gap-2">
          <label className={`field-label ${isRequired ? "field-required" : ""}`} htmlFor={"input-" + field.name.replace(/\s+/g, "-")}>
            {label}
          </label>
          {toolTip && <InfoIconTooltip className="text-gray-400 hover:text-gray-600 transition-colors" content={toolTip} />}
        </div>
      )}
      {showClear && <ClearButton field={field} externalChange={onChange} />}
    </div>
  );
};

export default FieldsHeader;
