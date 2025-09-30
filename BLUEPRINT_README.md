# Onboarding Blueprint Generator

A comprehensive multi-step form for creating structured evaluation frameworks for sales call analysis and coaching.

## Features

### ✅ **Step 1: Define Call Outcomes**

- Add multiple call outcomes (e.g., "Demo Scheduled", "Not Interested")
- Each outcome includes name and description
- Dynamic form with add/remove functionality

### ✅ **Step 2: General Template**

- **Customer Insights**: Define what information to capture about customers
- **Objections**: List common objections to address
- **Yes/No Scorecard**: Binary evaluation criteria with:
  - Question and optional description
  - Fail criteria (Yes/No)
  - Failure impact (Immediate to "with 5 other fails")
- **Variable Scorecard**: 1-5 scale evaluation criteria with:
  - Question and optional description
  - Score descriptions for each level (1-5)
  - Configurable fail criteria (select which scores fail)
  - Failure impact settings

### ✅ **Step 3+: Outcome-Specific Configuration**

- Individual pages for each defined outcome
- Same structure as General Template but customized per outcome
- **Nested Outcomes**: Add sub-outcomes within any outcome
  - Example: "Demo Scheduled" → "No-Show" → "Reschedule Attempted"
  - Recursive nesting support

## Technical Implementation

### **Tech Stack**

- **Next.js 15** with TypeScript
- **React Hook Form** for form management
- **Zod** for validation
- **PrimeReact** for UI components
- **Tailwind CSS** for styling
- **FontAwesome** for icons

### **Data Structure**

The form generates a hierarchical JSON structure:

```json
{
  "outcomes": [
    { "name": "Demo Scheduled", "description": "Customer booked a demo" }
  ],
  "generalTemplate": {
    "customerInsights": "...",
    "objections": "...",
    "yesNoScorecard": [...],
    "variableScorecard": [...]
  },
  "outcomeTree": [
    {
      "name": "Demo Scheduled",
      "description": "Customer booked a demo",
      "customerInsights": "...",
      "objections": "...",
      "yesNoScorecard": [...],
      "variableScorecard": [...],
      "children": [
        {
          "name": "No-Show",
          "description": "Customer didn't attend",
          "customerInsights": "...",
          "objections": "...",
          "yesNoScorecard": [...],
          "variableScorecard": [...],
          "children": []
        }
      ]
    }
  ]
}
```

### **Validation**

- Step-by-step validation using Zod schemas
- Real-time form validation
- Toast notifications for errors and success
- Prevents progression with invalid data

### **UI/UX Features**

- **Progress Bar**: Shows completion percentage
- **Step Navigation**: Previous/Next buttons with smart state management
- **Responsive Design**: Works on desktop and mobile
- **Card-based Layout**: Clean, organized sections
- **Color-coded Sections**: Different colors for different types of content
- **Tooltips**: Helpful guidance throughout the form
- **Dynamic Forms**: Add/remove items as needed

## Usage

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000)

3. **Create your blueprint**:

   - Define your call outcomes
   - Configure the general template
   - Customize each outcome individually
   - Add nested outcomes as needed

4. **Complete and export**:
   - The final data structure is logged to the console
   - Ready for integration with AI systems

## Design System

- **Primary Color**: `rgb(84, 22, 123)` (Purple)
- **Background**: White cards on light gray background
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins
- **Icons**: FontAwesome icons for visual clarity

## Future Enhancements

- **Database Integration**: Save blueprints to Supabase
- **Export Options**: JSON, CSV, PDF export
- **Template Library**: Pre-built templates for common use cases
- **Collaboration**: Multi-user editing and sharing
- **Version Control**: Track changes and revisions
- **AI Integration**: Direct connection to coaching AI systems

## File Structure

```
src/
├── components/
│   ├── blueprint/
│   │   ├── BlueprintForm.tsx          # Main form component
│   │   └── steps/
│   │       ├── DefineOutcomesStep.tsx # Step 1
│   │       ├── GeneralTemplateStep.tsx # Step 2
│   │       └── OutcomeDetailsStep.tsx # Step 3+
│   └── form/
│       ├── InputTextField.tsx         # Text input component
│       ├── TextAreaField.tsx          # Textarea component
│       ├── SelectField.tsx            # Dropdown component
│       ├── CheckboxField.tsx          # Checkbox component
│       ├── FieldsHeader.tsx           # Field header with label/tooltip
│       ├── InfoIconTooltip.tsx        # Tooltip component
│       └── ClearButton.tsx            # Clear field button
├── models/
│   ├── blueprint.ts                   # TypeScript types
│   └── blueprintValidation.ts         # Zod validation schemas
└── pages/
    └── index.tsx                      # Main page
```

## Getting Started

The application is ready to use! Simply run `npm run dev` and start creating your onboarding blueprints. The form will guide you through each step and validate your input to ensure you create a complete, structured framework for sales call evaluation and coaching.
