import { faEraser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ControllerRenderProps, Path } from "react-hook-form";

const ClearButton = <T extends object>({
  field,
  externalChange,
}: {
  field?: ControllerRenderProps<T, Path<T>>;
  externalChange?: (val: unknown) => void;
}) => {
  const defaultClear = () => {
    field?.onChange(null);
    externalChange && externalChange(null);
  };
  return <FontAwesomeIcon className="  cursor-pointer text-lg px-1   text-primaryShade " icon={faEraser} onClick={defaultClear} />;
};

export default ClearButton;
