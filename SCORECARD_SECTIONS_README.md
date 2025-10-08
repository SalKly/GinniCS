# Scorecard Sections Feature

## Overview

This feature adds organizational sections to scorecards, allowing users to categorize scorecards into logical groups (e.g., "Opening Phase", "Discovery", "Closing").

## Database Storage

Scorecard sections are stored as part of the `form_data` JSONB field in the `forms` table.

### In the Form (Flat Structure):

```typescript
{
  scorecardSections: [
    {
      id: "section-1234567890",
      name: "Opening Phase",
      description: "Scorecards for call opening"
    }
  ],
  scorecards: [
    {
      name: "Greeting Quality",
      sectionId: "section-1234567890", // Reference to section
      outcomes: ["ALL_OUTCOMES"],
      outcomeConfigs: { ... }
    }
  ]
}
```

### In the Database (Hierarchical Structure):

```typescript
{
  scorecardSections: [
    {
      id: "section-1234567890",
      name: "Opening Phase",
      description: "Scorecards for call opening"
    }
  ],
  booleanScoreCard: [
    {
      name: "Greeting Quality",
      description: "...",
      callPhases: ["opening"],
      sectionId: "section-1234567890" // ✅ Preserved in individual scorecard items
    }
  ],
  variableScoreCard: [ ... ],
  nestedNodes: [
    {
      nodeName: "Sale",
      booleanScoreCard: [
        {
          name: "Product Features Explained",
          sectionId: "section-1234567890" // ✅ Also preserved in nested outcomes
        }
      ]
    }
  ]
}
```

## Data Flow

### 1. Form Input (ScorecardsStep.tsx)

- Users create sections first before adding scorecards
- Each scorecard must be assigned to a section via dropdown
- Sections cannot be deleted if they're in use by scorecards

### 2. Data Transformation (BlueprintForm.tsx)

**transformToFlat** (Database → Form):

- Preserves `scorecardSections` array when loading existing data
- Extracts `sectionId` from each individual scorecard item (booleanScoreCard/variableScoreCard)
- Groups scorecards by name and associates them with their section reference
- Creates flat structure with `scorecards` array that has `sectionId` property

**transformToHierarchical** (Form → Database):

- Includes `scorecardSections` array in the output for saving
- Adds `sectionId` to **each individual scorecard item** when converting from flat to hierarchical
- Ensures `sectionId` is preserved in:
  - Root `booleanScoreCard` and `variableScoreCard` arrays
  - Nested outcome `booleanScoreCard` and `variableScoreCard` arrays

### 3. Data Persistence (companies.ts & blueprints.ts)

- **sanitizeFormData**: Explicitly preserves `scorecardSections` while removing file objects
- **saveFormProgress**: Handles merging of `scorecardSections` from partial updates
- **deduplicateBlueprintData**: Preserves sections (no deduplication needed due to unique IDs)

## Key Features

✅ **Section Management**

- Add/remove sections with validation
- Expandable section cards with amber styling
- Required fields: name, optional description

✅ **Scorecard-Section Association**

- Required dropdown to select section
- Visual badge showing section name on scorecard cards
- Validation prevents adding scorecards without sections
- **`sectionId` is saved with each scorecard item in the database**

✅ **Delete Protection**

- Cannot delete sections in use by scorecards
- Clear error message with count of dependent scorecards

✅ **Database Persistence**

- Sections stored in JSONB `form_data` field
- `sectionId` stored on **every scorecard item** (YesNoScorecardItem and VariableScorecardItem)
- Preserved through all transformation and sanitization functions
- Properly merged during partial updates (auto-save)

## Updated Components

### Models

- `src/models/blueprint.ts`:
  - Added `ScorecardSection` interface
  - Added optional `sectionId?: string` to `YesNoScorecardItem`
  - Added optional `sectionId?: string` to `VariableScorecardItem`
  - Added optional `scorecardSections?: ScorecardSection[]` to `BlueprintData`
- `src/models/blueprintValidation.ts`: Added validation schema for sections

### Components

- `src/components/blueprint/steps/ScorecardsStep.tsx`: Section management UI
- `src/components/blueprint/BlueprintForm.tsx`:
  - Updated `transformToFlat` to extract `sectionId` from scorecard items
  - Updated `transformToHierarchical` to add `sectionId` to all scorecard items
- `src/components/form/YesNoScorecardSection.tsx`: Updated terminology

### Services

- `src/services/companies.ts`: Explicit preservation in all functions
- `src/services/blueprints.ts`: Updated sanitization function

## Terminology Update

"Yes/No" scorecards are now called **"Playbook Checks (Yes/No)"** to align with the main system terminology, explaining they are binary evaluation criteria.

## Critical Implementation Details

### ⚠️ Important: sectionId Storage

The `sectionId` is stored on **individual scorecard items**, not on the flat scorecard object. This means:

1. When saving (transformToHierarchical):
   - Take `scorecard.sectionId` from the flat structure
   - Add it to **each individual item** being created (boolean/variable)
2. When loading (transformToFlat):
   - Extract `item.sectionId` from each scorecard item
   - Store it on the grouped scorecard object

### Code References

**Saving sectionId:**

```typescript
// In transformToHierarchical
const item = {
  name: scorecard.name,
  description: config.description || "",
  callPhases: config.callPhases || [],
  sectionId: scorecard.sectionId, // ✅ Add to individual item
};
```

**Loading sectionId:**

```typescript
// In transformToFlat - addOrMergeScorecard helper
addOrMergeScorecard(item.name, outcomeKey, config, item.sectionId); // ✅ Pass sectionId
```

## Testing Checklist

- [ ] Create a new section
- [ ] Add a scorecard and assign it to the section
- [ ] Save the form (auto-save or manual)
- [ ] Check database: `form_data.booleanScoreCard[0].sectionId` should exist
- [ ] Check database: `form_data.scorecardSections` array should exist
- [ ] Reload the form and verify sections load correctly
- [ ] Verify scorecard shows correct section badge
- [ ] Try to delete a section in use (should be prevented)
- [ ] Delete an unused section (should work)
- [ ] Auto-save functionality preserves sections and sectionIds
- [ ] Manual save preserves sections and sectionIds
- [ ] Create scorecard for nested outcome, verify sectionId is saved
