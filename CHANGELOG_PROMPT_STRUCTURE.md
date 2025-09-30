# Changelog: Prompt Structure Refactoring

## Date: September 30, 2025

## Summary

Refactored the AI prompt generation system to create **individual prompts** for each item instead of combined prompts per agent type.

## What Changed

### Before (Old Structure)

```json
{
  "outcomeName": "Sales Call",
  "callInsightsAgent": "One big prompt for ALL insights combined...",
  "callObjectionsAgent": "One big prompt for ALL objections combined...",
  "playbookChecksAgent": "One big prompt for ALL checks combined...",
  "variableScorecardAgent": "One big prompt for ALL scorecard items combined..."
}
```

### After (New Structure)

```json
{
  "outcomeName": "Sales Call",
  "callInsights": [
    { "name": "Budget Discussion", "prompt": "Focused prompt for this insight..." },
    { "name": "Timeline", "prompt": "Focused prompt for this insight..." }
  ],
  "callObjections": [
    { "name": "Price Concern", "prompt": "Focused prompt for this objection..." },
    { "name": "Competitor", "prompt": "Focused prompt for this objection..." }
  ],
  "playbookChecks": [
    { "name": "Did rep introduce?", "prompt": "Focused prompt for this check..." },
    { "name": "Asked discovery?", "prompt": "Focused prompt for this check..." }
  ],
  "variableScorecard": [
    { "name": "Rapport", "prompt": "Focused prompt for this score..." },
    { "name": "Knowledge", "prompt": "Focused prompt for this score..." }
  ]
}
```

## Technical Changes

### Files Modified

1. **`src/pages/api/generate-prompts.ts`**

   - Added new `PromptItem` interface
   - Updated `OutcomePrompt` interface structure
   - Renamed functions (plural):
     - `generateCallInsightsPrompt()` → `generateCallInsightsPrompts()`
     - `generateCallObjectionsPrompt()` → `generateCallObjectionsPrompts()`
     - `generatePlaybookChecksPrompt()` → `generatePlaybookChecksPrompts()`
     - `generateVariableScorecardPrompt()` → `generateVariableScorecardPrompts()`
   - Each function now returns `PromptItem[]` instead of `string`
   - Loops through each item to create individual prompts

2. **`OPENAI_INTEGRATION_README.md`**

   - Updated output structure documentation
   - Added array examples for each agent type

3. **`PROMPT_STRUCTURE_README.md`** (NEW)

   - Comprehensive documentation of new structure
   - Examples of how agents will use the prompts
   - Migration guide from old format

4. **`CHANGELOG_PROMPT_STRUCTURE.md`** (NEW - this file)
   - Change tracking and history

### Type Definitions

```typescript
interface PromptItem {
  name: string; // The item name (e.g., "Budget Discussion")
  prompt: string; // The full AI prompt for analyzing this item
}

interface OutcomePrompt {
  outcomeName: string;
  outcomePath: string[];
  callInsights: PromptItem[]; // Array of individual insight prompts
  callObjections: PromptItem[]; // Array of individual objection prompts
  playbookChecks: PromptItem[]; // Array of individual check prompts
  variableScorecard: PromptItem[]; // Array of individual score prompts
}
```

## Benefits

### 1. Granular Analysis

- Each item gets focused attention
- Better accuracy per item
- Clearer attribution of results

### 2. Flexibility

- Add/remove items without affecting others
- Easy to enable/disable specific items
- Parallel processing possible

### 3. Better UX for Agents

- Show progress per item
- Display results in organized groups
- Item-specific feedback

### 4. Easier Maintenance

- Test individual prompts
- A/B test variations
- Debug specific items

### 5. Scalability

- Handle any number of items per outcome
- No prompt length limitations
- Clean separation of concerns

## Example Output

### Sample Generated Prompt

```json
{
  "name": "Budget Discussion",
  "prompt": "You are analyzing a sales call for the outcome: \"Enterprise Sales Call\" - High-value B2B sales

Company Context:
Acme Corp is a leading SaaS provider in the CRM space, competing with Salesforce...

Your task is to identify and extract the following customer insight from the call:

Insight Name: Budget Discussion
Description: Customer mentions their budget range, constraints, or approval process

Instructions:
1. Listen carefully for information related to this specific insight
2. Extract specific quotes, data points, and behavioral cues
3. Contextualize findings with the company's business goals and value proposition
4. Identify patterns that align with or deviate from the expected customer profile
5. Note any emotional indicators or sentiment shifts related to this insight
6. Flag any competitive mentions or market positioning discussions

Provide:
- Direct evidence from the call (quotes or paraphrases)
- Relevance score (1-10) based on business goals
- Actionable recommendations for follow-up
- Whether this insight was found in the call (YES/NO)

Format your response as structured JSON."
}
```

## Backward Compatibility

⚠️ **Breaking Change**: The API response structure has changed.

### If You Have Existing Integrations:

Your code that expects:

```javascript
const insight = outcome.callInsightsAgent; // Old: single string
```

Must be updated to:

```javascript
const insights = outcome.callInsights; // New: array of objects
for (const insight of insights) {
  console.log(insight.name, insight.prompt);
}
```

## Testing

### How to Test:

1. Create a blueprint with multiple items in each category:

   - 3+ customer insights
   - 3+ customer objections
   - 3+ playbook checks
   - 3+ scorecard items

2. Click "Download AI Prompts"

3. Open the downloaded JSON file

4. Verify structure:

   ```javascript
   // Each outcome should have arrays
   outcome.callInsights.length > 0;
   outcome.callObjections.length > 0;
   outcome.playbookChecks.length > 0;
   outcome.variableScorecard.length > 0;

   // Each item should have name and prompt
   outcome.callInsights[0].name; // string
   outcome.callInsights[0].prompt; // string
   ```

### Expected Results:

- ✅ Each insight gets its own prompt
- ✅ Each objection gets its own prompt
- ✅ Each check gets its own prompt
- ✅ Each scorecard item gets its own prompt
- ✅ Company context is included in every prompt
- ✅ Web search data is included in every prompt

## Performance Impact

### Before:

- 4 AI calls per outcome (one per agent type)
- Combined processing for all items

### After:

- Still 0 additional AI calls (prompts are just strings)
- Individual processing per item (happens in your agents)

**Note:** The API still makes the same number of calls. The difference is in how the prompts are structured for YOUR conversational intelligence agents to use.

## Next Steps

1. ✅ Code refactored
2. ✅ Types updated
3. ✅ Documentation updated
4. ✅ No linter errors
5. 🔄 Test with real data
6. 🔄 Update any consuming applications

## Questions or Issues?

If you encounter any problems with the new structure:

1. Check the `PROMPT_STRUCTURE_README.md` for detailed examples
2. Verify your downloaded JSON matches the new structure
3. Test with a simple blueprint first
4. Check browser console for any errors

## Migration Example

### Old Way (If You Had Custom Code):

```javascript
async function analyzeCall(transcript, outcome) {
  // Send ONE request with combined prompt
  const insightsResult = await ai.analyze(
    transcript,
    outcome.callInsightsAgent // Big combined prompt
  );

  // Parse out individual insights from result
  // (hard to attribute which came from where)
}
```

### New Way:

```javascript
async function analyzeCall(transcript, outcome) {
  const results = {
    insights: [],
    objections: [],
    checks: [],
    scores: [],
  };

  // Process each insight individually
  for (const insight of outcome.callInsights) {
    const result = await ai.analyze(transcript, insight.prompt);
    results.insights.push({
      name: insight.name, // Clear attribution!
      ...result,
    });
  }

  // Same for objections, checks, scores...
  return results;
}
```

## Success Metrics

The refactoring is successful if:

- ✅ No linter/type errors
- ✅ API returns arrays instead of strings
- ✅ Each item has name + prompt
- ✅ Prompts are focused and specific
- ✅ Company context included in all prompts
- ✅ Documentation is clear and comprehensive

---

**Refactored by:** AI Assistant  
**Requested by:** User  
**Date:** September 30, 2025  
**Status:** ✅ Complete
