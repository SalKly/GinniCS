import React, { useState } from "react";
import { Control, Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Editor } from "primereact/editor";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { SelectField } from "../../form/SelectField";
import { OutcomeSelector } from "../../form/OutcomeSelector";
import { StepProps, BlueprintData, ScorecardSection } from "../../../models/blueprint";

interface ScorecardsStepProps extends StepProps {
  control: Control<any>;
}

interface OutcomeConfig {
  description: string;
  callPhases: string[];
  type: "boolean" | "variable";
  // Variable fields
  score1Desc?: string;
  score2Desc?: string;
  score3Desc?: string;
  score4Desc?: string;
  score5Desc?: string;
}

interface ScorecardWithOutcomes {
  name: string;
  sectionId?: string; // Reference to the section this scorecard belongs to
  outcomes: string[];
  outcomeConfigs?: { [outcomeId: string]: OutcomeConfig }; // Complete config for each selected outcome
}

export function ScorecardsStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control }: ScorecardsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scorecards",
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "scorecardSections",
  });

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const scorecards = useWatch({
    control,
    name: "scorecards",
  }) as ScorecardWithOutcomes[] | undefined;

  const sections = useWatch({
    control,
    name: "scorecardSections",
  }) as ScorecardSection[] | undefined;

  const outcomes = useWatch({
    control,
    name: "nestedNodes",
  });

  const typeOptions = [
    { label: "Playbook Checks (Yes/No)", value: "boolean" },
    { label: "Variable (1-5)", value: "variable" },
  ];

  const callPhaseOptions = [
    { label: "Call Opening", value: "opening" },
    { label: "During Call", value: "during" },
    { label: "Call Ending", value: "ending" },
  ];

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    appendSection({
      id: newId,
      name: "",
      description: "",
    });
    // Expand the new section
    const newIndex = sectionFields.length;
    setExpandedSections(new Set([...expandedSections, newIndex]));
  };

  const removeSectionHandler = (index: number) => {
    const sectionToRemove = sections?.[index];
    if (sectionToRemove) {
      // Check if any scorecards are using this section
      const scorecardsUsingSection = scorecards?.filter((sc) => sc.sectionId === sectionToRemove.id);
      if (scorecardsUsingSection && scorecardsUsingSection.length > 0) {
        alert(
          `Cannot delete this section. It is being used by ${scorecardsUsingSection.length} scorecard(s). Please reassign or remove those scorecards first.`
        );
        return;
      }
    }
    removeSection(index);
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(index);
    setExpandedSections(newExpanded);
  };

  const toggleSectionExpanded = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const addScorecard = () => {
    append({
      name: "",
      sectionId: "", // Will be selected via dropdown
      outcomes: ["ALL_OUTCOMES"],
      outcomeConfigs: {
        ALL_OUTCOMES: {
          description: "",
          callPhases: [],
          type: "boolean",
          score1Desc: "",
          score2Desc: "",
          score3Desc: "",
          score4Desc: "",
          score5Desc: "",
        },
      },
    });
    // Expand the new card
    const newIndex = fields.length;
    setExpandedCards(new Set([...expandedCards, newIndex]));
  };

  const removeScorecard = (index: number) => {
    remove(index);
    const newExpanded = new Set(expandedCards);
    newExpanded.delete(index);
    setExpandedCards(newExpanded);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg mb-3">
          <i className="fas fa-clipboard-check text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scorecards Configuration</h2>
        <p className="text-gray-600">Create sections to organize your scorecards, then add scorecards to evaluate calls.</p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">About Scorecards</h4>
            <p className="text-purple-800">
              Scorecards are evaluation criteria used to assess calls. <strong>Playbook Checks (Yes/No)</strong> check for presence/absence of
              behaviors. <strong>Variable scorecards</strong> rate behaviors on a scale of 1-5. First, create sections to organize your scorecards,
              then add scorecards within those sections.
            </p>
          </div>
        </div>
      </div>

      {/* Sections Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <i className="fas fa-folder text-amber-600"></i>
            Scorecard Sections ({sectionFields.length})
          </h3>
          <Button type="button" label="Add Section" icon="fas fa-plus" className="p-button-outlined" onClick={addSection} />
        </div>

        {sectionFields.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <p>No sections created yet. Click "Add Section" to organize your scorecards into categories.</p>
          </div>
        )}

        {sectionFields.map((field, index) => {
          const isExpanded = expandedSections.has(index);
          const section = sections?.[index];

          return (
            <Card key={field.id} className="shadow-sm bg-amber-50 border-2 border-amber-200">
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                      className="p-button-text p-button-sm"
                      onClick={() => toggleSectionExpanded(index)}
                    />
                    <div className="w-8 h-8 bg-amber-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      <i className="fas fa-folder"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{section?.name || `Section ${index + 1}`}</h4>
                      <p className="text-xs text-gray-600 mt-1">{section?.description || "No description"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeSectionHandler(index)}
                    tooltip="Remove section"
                  />
                </div>

                {/* Section Content */}
                {isExpanded && (
                  <div className="space-y-4 pt-4 border-t border-amber-300">
                    <InputTextField
                      control={control}
                      field={`scorecardSections.${index}.name`}
                      label="Section Name"
                      placeholder="e.g., Opening Phase, Discovery, Closing"
                      isRequired
                      toolTip="A clear name for this scorecard category"
                    />
                    <TextAreaField
                      control={control}
                      field={`scorecardSections.${index}.description`}
                      label="Section Description (Optional)"
                      placeholder="Describe the purpose of this section..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Scorecards ({fields.length})</h3>
          <Button type="button" label="Add Scorecard" icon="fas fa-plus" className="p-button-outlined" onClick={addScorecard} />
        </div>

        {fields.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <p>No scorecards created yet. Click "Add Scorecard" to create your first evaluation criterion.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const isExpanded = expandedCards.has(index);
          const scorecard = scorecards?.[index];
          const scorecardSection = sections?.find((s) => s.id === scorecard?.sectionId);

          return (
            <Card key={field.id} className="shadow-sm">
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      icon={isExpanded ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                      className="p-button-text p-button-sm"
                      onClick={() => toggleExpanded(index)}
                    />
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{scorecard?.name || `Scorecard ${index + 1}`}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        {scorecardSection && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                            <i className="fas fa-folder text-xs"></i>
                            {scorecardSection.name}
                          </span>
                        )}
                        {scorecard?.outcomes?.includes("ALL_OUTCOMES") ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">All Outcomes</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">{scorecard?.outcomes?.length || 0} outcome(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    icon="fas fa-trash"
                    className="p-button-danger p-button-outlined p-button-sm"
                    onClick={() => removeScorecard(index)}
                    tooltip="Remove scorecard"
                  />
                </div>

                {/* Card Content */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    {/* Basic Info Section */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-info-circle text-blue-600"></i>
                        Basic Information
                      </h5>
                      <InputTextField
                        control={control}
                        field={`scorecards.${index}.name`}
                        label="Scorecard Name"
                        placeholder="e.g., Greeting Quality, Product Knowledge"
                        isRequired
                        toolTip="A clear name for this evaluation criterion"
                      />

                      {/* Section Dropdown */}
                      <Controller
                        name={`scorecards.${index}.sectionId`}
                        control={control}
                        rules={{ required: "Section is required" }}
                        render={({ field, fieldState }) => (
                          <div className="field">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Section <span className="text-red-500">*</span>
                              <i
                                className="fas fa-info-circle ml-2 text-blue-700 cursor-help"
                                title="Select which section this scorecard belongs to"
                                style={{ fontSize: "0.875rem" }}
                              ></i>
                            </label>
                            <Dropdown
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.value)}
                              options={sections?.map((s) => ({ label: s.name, value: s.id })) || []}
                              className="w-full"
                              placeholder={sections && sections.length > 0 ? "Select a section" : "Please create a section first"}
                              disabled={!sections || sections.length === 0}
                            />
                            {fieldState.error && <small className="p-error block mt-1">{fieldState.error.message}</small>}
                            {(!sections || sections.length === 0) && (
                              <small className="text-amber-600 block mt-1">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Create at least one section before adding scorecards
                              </small>
                            )}
                          </div>
                        )}
                      />

                      {/* Outcome Selector */}
                      <Controller
                        name={`scorecards.${index}.outcomes`}
                        control={control}
                        defaultValue={["ALL_OUTCOMES"]}
                        render={({ field }) => {
                          const handleOutcomeChange = (newOutcomes: string[]) => {
                            let finalOutcomes = newOutcomes;

                            // Make ALL_OUTCOMES exclusive
                            if (newOutcomes.includes("ALL_OUTCOMES")) {
                              if (newOutcomes.length > 1) {
                                const previousOutcomes = field.value || [];
                                if (!previousOutcomes.includes("ALL_OUTCOMES")) {
                                  finalOutcomes = ["ALL_OUTCOMES"];
                                } else {
                                  finalOutcomes = newOutcomes.filter((o) => o !== "ALL_OUTCOMES");
                                }
                              }
                            }

                            field.onChange(finalOutcomes);

                            // Initialize outcomeConfigs for new outcomes
                            const currentConfigs = scorecard?.outcomeConfigs || {};
                            const newConfigs: { [key: string]: OutcomeConfig } = {};

                            finalOutcomes.forEach((outcomeId) => {
                              newConfigs[outcomeId] = currentConfigs[outcomeId] || {
                                description: "",
                                callPhases: [],
                                type: "boolean",
                                score1Desc: "",
                                score2Desc: "",
                                score3Desc: "",
                                score4Desc: "",
                                score5Desc: "",
                              };
                            });

                            // Update the outcomeConfigs field
                            control._formValues.scorecards[index].outcomeConfigs = newConfigs;
                          };

                          return (
                            <OutcomeSelector
                              outcomes={outcomes || []}
                              selectedOutcomes={field.value || ["ALL_OUTCOMES"]}
                              onChange={handleOutcomeChange}
                              label="Apply to Call Outcomes"
                              placeholder="Select outcomes or 'All Outcomes'"
                              tooltip="Choose which outcomes this scorecard applies to"
                            />
                          );
                        }}
                      />
                    </div>

                    {/* Outcome-Specific Configuration Cards */}
                    {scorecard?.outcomes &&
                      scorecard.outcomes.length > 0 &&
                      scorecard.outcomes.map((outcomeId: string) => {
                        // Get the outcome label
                        const getOutcomeLabel = (id: string): string => {
                          if (id === "ALL_OUTCOMES") return "All Outcomes";
                          const parts = id.split("-");
                          if (parts[0] === "outcome") {
                            const outcomeIdx = parseInt(parts[1]);
                            if (parts.length === 2) {
                              return outcomes?.[outcomeIdx]?.nodeName || `Outcome ${outcomeIdx + 1}`;
                            } else if (parts[2] === "nested") {
                              const nestedIdx = parseInt(parts[3]);
                              const nestedOutcome = outcomes?.[outcomeIdx]?.nestedNodes?.[nestedIdx];
                              return nestedOutcome?.nodeName || `Nested ${nestedIdx + 1}`;
                            }
                          }
                          return id;
                        };

                        const outcomeConfig = scorecard?.outcomeConfigs?.[outcomeId];
                        const outcomeType = outcomeConfig?.type || "boolean";

                        return (
                          <div
                            key={outcomeId}
                            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-5 border-2 border-purple-200 shadow-sm"
                          >
                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <i className="fas fa-bullseye text-purple-600"></i>
                              {getOutcomeLabel(outcomeId)}
                            </h4>

                            <div className="space-y-4">
                              {/* Description */}
                              <Controller
                                name={`scorecards.${index}.outcomeConfigs.${outcomeId}.description`}
                                control={control}
                                defaultValue=""
                                rules={{ required: "Description is required" }}
                                render={({ field, fieldState }) => (
                                  <div className="field">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                      Description <span className="text-red-500">*</span>
                                      <i
                                        className="fas fa-info-circle ml-2 text-purple-700 cursor-help"
                                        title="Explain what this scorecard measures for this specific outcome"
                                        style={{ fontSize: "0.875rem" }}
                                      ></i>
                                    </label>
                                    <Editor
                                      value={field.value || ""}
                                      onTextChange={(e) => field.onChange(e.htmlValue)}
                                      style={{ height: "200px" }}
                                      placeholder={`Describe how this scorecard applies to ${getOutcomeLabel(outcomeId)}...`}
                                    />
                                    {fieldState.error && <small className="p-error block mt-1">{fieldState.error.message}</small>}
                                  </div>
                                )}
                              />

                              {/* Call Phases */}
                              <Controller
                                name={`scorecards.${index}.outcomeConfigs.${outcomeId}.callPhases`}
                                control={control}
                                defaultValue={[]}
                                render={({ field }) => (
                                  <div className="field">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                      Call Phase Focus
                                      <i
                                        className="fas fa-info-circle ml-2 text-purple-700 cursor-help"
                                        title="Select which phase(s) of the call this scorecard focuses on"
                                        style={{ fontSize: "0.875rem" }}
                                      ></i>
                                    </label>
                                    <MultiSelect
                                      value={field.value || []}
                                      onChange={(e) => field.onChange(e.value)}
                                      options={callPhaseOptions}
                                      optionLabel="label"
                                      optionValue="value"
                                      placeholder="Select call phase(s)"
                                      className="w-full"
                                      display="chip"
                                      maxSelectedLabels={3}
                                    />
                                  </div>
                                )}
                              />

                              {/* Scorecard Type */}
                              <Controller
                                name={`scorecards.${index}.outcomeConfigs.${outcomeId}.type`}
                                control={control}
                                defaultValue="boolean"
                                render={({ field }) => (
                                  <div className="field">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                      Scorecard Type
                                      <i
                                        className="fas fa-info-circle ml-2 text-purple-700 cursor-help"
                                        title="Choose Playbook Checks for binary yes/no questions, or Variable for 1-5 scale ratings"
                                        style={{ fontSize: "0.875rem" }}
                                      ></i>
                                    </label>
                                    <Dropdown
                                      value={field.value || "boolean"}
                                      onChange={(e) => field.onChange(e.value)}
                                      options={typeOptions}
                                      className="w-full"
                                      placeholder="Select scorecard type"
                                    />
                                  </div>
                                )}
                              />

                              {/* Type-specific fields */}
                              {outcomeType === "variable" && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <i className="fas fa-star text-blue-600"></i>
                                    Score Descriptions (1-5 Scale)
                                  </h5>
                                  <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <Controller
                                        key={score}
                                        name={`scorecards.${index}.outcomeConfigs.${outcomeId}.score${score}Desc`}
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: `Score ${score} description is required` }}
                                        render={({ field, fieldState }) => (
                                          <div className="field">
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                              Score {score} -{" "}
                                              {score === 1
                                                ? "Poor"
                                                : score === 2
                                                ? "Fair"
                                                : score === 3
                                                ? "Good"
                                                : score === 4
                                                ? "Very Good"
                                                : "Excellent"}{" "}
                                              <span className="text-red-500">*</span>
                                              <i
                                                className="fas fa-info-circle ml-2 text-blue-700 cursor-help"
                                                title={`What behavior/quality warrants a score of ${score}?`}
                                                style={{ fontSize: "0.875rem" }}
                                              ></i>
                                            </label>
                                            <Editor
                                              value={field.value || ""}
                                              onTextChange={(e) => field.onChange(e.htmlValue)}
                                              style={{ height: "150px" }}
                                              placeholder={`Describe what a score of ${score} means...`}
                                            />
                                            {fieldState.error && <small className="p-error block mt-1">{fieldState.error.message}</small>}
                                          </div>
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="warning-box">
        <div className="flex items-start gap-4">
          <div className="text-warning-600 mt-1">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-semibold text-warning-900 mb-2">Next Steps</h4>
            <p className="text-warning-800">After configuring scorecards, you'll set up insights and objections for your call outcomes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
