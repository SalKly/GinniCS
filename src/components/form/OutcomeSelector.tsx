import React, { useMemo } from "react";
import { MultiSelect } from "primereact/multiselect";
import { NestedNode } from "../../models/blueprint";

interface OutcomeSelectorProps {
  outcomes: NestedNode[];
  selectedOutcomes: string[];
  onChange: (selectedOutcomes: string[]) => void;
  label?: string;
  placeholder?: string;
  tooltip?: string;
}

interface OutcomeOption {
  label: string;
  value: string;
  isNested?: boolean;
  parentValue?: string;
}

export function OutcomeSelector({
  outcomes,
  selectedOutcomes,
  onChange,
  label = "Apply to Call Outcomes",
  placeholder = "Select outcomes",
  tooltip = "Select which call outcomes this applies to",
}: OutcomeSelectorProps) {
  // Build options list with "All Outcomes" first, then main outcomes, then nested outcomes
  const options: OutcomeOption[] = useMemo(() => {
    const opts: OutcomeOption[] = [
      {
        label: "All Outcomes",
        value: "ALL_OUTCOMES",
      },
    ];

    outcomes.forEach((outcome, index) => {
      // Add main outcome
      opts.push({
        label: outcome.nodeName || `Outcome ${index + 1}`,
        value: `outcome-${index}`,
      });

      // Add nested outcomes if they exist
      if (outcome.nestedNodes && outcome.nestedNodes.length > 0) {
        outcome.nestedNodes.forEach((nested, nestedIndex) => {
          opts.push({
            label: `  ↳ ${nested.nodeName || `Nested ${nestedIndex + 1}`}`,
            value: `outcome-${index}-nested-${nestedIndex}`,
            isNested: true,
            parentValue: `outcome-${index}`,
          });
        });
      }
    });

    return opts;
  }, [outcomes]);

  // Custom template to show nested outcomes with indentation
  const itemTemplate = (option: OutcomeOption) => {
    if (option.value === "ALL_OUTCOMES") {
      return (
        <div className="flex items-center gap-2 font-semibold">
          <i className="fas fa-globe text-purple-700"></i>
          <span>{option.label}</span>
        </div>
      );
    }

    if (option.isNested) {
      return (
        <div className="flex items-center gap-2 pl-4 text-sm">
          <i className="fas fa-arrow-turn-down-right text-green-600"></i>
          <span>{option.label}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <i className="fas fa-flag text-purple-600"></i>
        <span>{option.label}</span>
      </div>
    );
  };

  return (
    <div className="field">
      <label htmlFor="outcome-selector" className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
        {tooltip && <i className="fas fa-info-circle ml-2 text-purple-700 cursor-help" title={tooltip} style={{ fontSize: "0.875rem" }}></i>}
      </label>
      <MultiSelect
        id="outcome-selector"
        value={selectedOutcomes}
        onChange={(e) => onChange(e.value)}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder={placeholder}
        className="w-full"
        display="chip"
        itemTemplate={itemTemplate}
        maxSelectedLabels={3}
        filter
        filterPlaceholder="Search outcomes"
      />
    </div>
  );
}
