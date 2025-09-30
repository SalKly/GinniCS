# Prompt Structure Documentation

## Overview

The AI prompt generation system creates **individual, focused prompts** for each item you define in your call outcomes. Instead of one large prompt per agent type, you get granular prompts for each specific insight, objection, check, or scorecard item.

## Output Structure

### Complete Response Format

```json
{
  "metadata": {
    "generatedAt": "2025-09-30T12:00:00.000Z",
    "businessName": "Acme Corp",
    "totalOutcomes": 3,
    "systemContext": "You work as an AI assistant in Ginni..."
  },
  "companyContext": "Detailed company analysis from web research + your docs...",
  "outcomePrompts": [
    {
      "outcomeName": "Sales Call",
      "outcomePath": ["Root", "Sales Call"],
      "callInsights": [...],
      "callObjections": [...],
      "playbookChecks": [...],
      "variableScorecard": [...]
    }
  ]
}
```

## Agent Types and Their Structures

### 1. Call Insights (`callInsights`)

**Purpose:** Detect specific customer insights from the call

**Structure:**

```json
"callInsights": [
  {
    "name": "Budget Discussion",
    "prompt": "You are analyzing a sales call for the outcome: \"Sales Call\" - Description\n\nCompany Context:\n[Web-researched company info]\n\nYour task is to identify and extract the following customer insight from the call:\n\nInsight Name: Budget Discussion\nDescription: Customer mentions their budget range or financial constraints\n\nInstructions:\n1. Listen carefully for information related to this specific insight\n2. Extract specific quotes, data points, and behavioral cues\n3. Contextualize findings with the company's business goals and value proposition\n...\n\nProvide:\n- Direct evidence from the call (quotes or paraphrases)\n- Relevance score (1-10) based on business goals\n- Actionable recommendations for follow-up\n- Whether this insight was found in the call (YES/NO)\n\nFormat your response as structured JSON."
  },
  {
    "name": "Decision Timeline",
    "prompt": "..."
  }
]
```

**Use Case:** Each conversational intelligence agent can process one insight at a time

### 2. Call Objections (`callObjections`)

**Purpose:** Detect and analyze specific customer objections

**Structure:**

```json
"callObjections": [
  {
    "name": "Price Too High",
    "prompt": "You are analyzing a sales call for the outcome: \"Sales Call\" - Description\n\nCompany Context:\n[Web-researched company info]\n\nYour task is to identify and analyze the following customer objection from the call:\n\nObjection Name: Price Too High\nDescription: Customer states that the price is above their budget or expectations\n\nInstructions:\n1. Detect if this objection was explicitly stated or implied\n2. Categorize the type of objection (price, timing, authority, need, competition)\n3. Assess the strength and urgency of this objection\n...\n\nProvide:\n- Whether this objection was raised (YES/NO)\n- Exact moment in call when objection was raised\n- Customer's exact wording or sentiment\n- Sales rep's response and effectiveness rating (1-10)\n- Recommended handling strategy\n- Likelihood of objection being overcome (percentage)\n\nFormat your response as structured JSON."
  },
  {
    "name": "Need More Features",
    "prompt": "..."
  }
]
```

**Use Case:** Track and analyze each objection type separately for targeted coaching

### 3. Playbook Checks (`playbookChecks`)

**Purpose:** Boolean (YES/NO) verification of required sales steps

**Structure:**

```json
"playbookChecks": [
  {
    "name": "Did rep introduce themselves?",
    "prompt": "You are evaluating a sales call for the outcome: \"Sales Call\" - Description\n\nCompany Context:\n[Web-researched company info]\n\nYour task is to verify the following playbook requirement (boolean check) from the call:\n\nCheck Name: Did rep introduce themselves?\nDescription: Sales rep should state their name and role in first 30 seconds\n\nInstructions:\n1. Determine if this criterion was met (YES) or not met (NO)\n2. Provide specific evidence or timestamp for your determination\n3. If not met, explain why and what was missing\n...\n\nProvide:\n- Status: YES or NO\n- Evidence: Specific call moment or quote\n- Quality Score: 1-10 (if met, otherwise N/A)\n- Gap Analysis: What was missing (if not met)\n- Impact Assessment: How this affects call success\n- Coaching Recommendation: Specific advice for improvement\n\nFormat your response as structured JSON."
  },
  {
    "name": "Did rep ask discovery questions?",
    "prompt": "..."
  }
]
```

**Use Case:** Ensure each playbook step is evaluated independently with clear pass/fail

### 4. Variable Scorecard (`variableScorecard`)

**Purpose:** Score performance on a 1-5 scale for specific metrics

**Structure:**

```json
"variableScorecard": [
  {
    "name": "Rapport Building",
    "prompt": "You are scoring a sales call for the outcome: \"Sales Call\" - Description\n\nCompany Context:\n[Web-researched company info]\n\nYour task is to score the following performance metric on a 1-5 scale:\n\nMetric Name: Rapport Building\nDescription: How well the rep builds connection with the customer\n\nScale Definition:\n1 = Cold and transactional\n2 = Minimal rapport building\n3 = Professional but basic\n4 = Good connection established\n5 = Excellent rapport, customer feels valued\n\nInstructions:\n1. Evaluate this metric carefully against the provided scale\n2. Consider company standards and industry best practices\n3. Provide specific evidence for your score\n...\n\nProvide:\n- Score: 1-5 based on the provided scale\n- Justification: Specific evidence from the call\n- Key Moments: Timestamps or quotes supporting your score\n- Strengths: What was done well\n- Improvement Areas: Specific recommendations\n- Impact on Outcome: How this metric affected the call result\n\nFormat your response as structured JSON."
  },
  {
    "name": "Product Knowledge",
    "prompt": "..."
  }
]
```

**Use Case:** Score each metric independently with its own scale and justification

## Benefits of This Structure

### 1. **Granular Analysis**

Each item gets its own dedicated prompt, allowing for:

- More focused analysis
- Better accuracy per item
- Easier debugging and refinement

### 2. **Scalability**

- Add new insights/objections without affecting others
- Each agent can process items in parallel
- Easy to enable/disable specific items

### 3. **Clear Attribution**

```json
{
  "name": "Budget Discussion",
  "result": {
    "found": "YES",
    "evidence": "Customer said: 'We have $50k allocated for this quarter'",
    "relevanceScore": 9
  }
}
```

You know exactly which prompt generated which result.

### 4. **Easier Prompt Engineering**

- Test and refine individual prompts
- A/B test different versions
- Track performance per item type

### 5. **Better User Experience**

Your conversational intelligence agents can:

- Show progress per item
- Display results in organized categories
- Provide item-specific feedback

## Example: Complete Outcome

```json
{
  "outcomeName": "Enterprise Sales Call",
  "outcomePath": ["Root", "Sales", "Enterprise"],

  "callInsights": [
    { "name": "Budget Range", "prompt": "..." },
    { "name": "Decision Makers", "prompt": "..." },
    { "name": "Competitor Mentions", "prompt": "..." }
  ],

  "callObjections": [
    { "name": "Price Concern", "prompt": "..." },
    { "name": "Implementation Time", "prompt": "..." }
  ],

  "playbookChecks": [
    { "name": "Introduction Done", "prompt": "..." },
    { "name": "Discovery Questions Asked", "prompt": "..." },
    { "name": "Demo Scheduled", "prompt": "..." }
  ],

  "variableScorecard": [
    { "name": "Rapport Building", "prompt": "..." },
    { "name": "Product Knowledge", "prompt": "..." },
    { "name": "Objection Handling", "prompt": "..." },
    { "name": "Closing Technique", "prompt": "..." }
  ]
}
```

## How Your Agents Will Use This

### Agent Processing Flow

1. **Receive the JSON file** with all prompts
2. **For each call outcome**, process its items:

```javascript
// Pseudo-code for your conversational intelligence system
for (const outcome of outcomePrompts) {
  // Process call insights
  for (const insight of outcome.callInsights) {
    const result = await analyzeCall(callTranscript, insight.prompt);
    results.insights.push({
      name: insight.name,
      ...result,
    });
  }

  // Process objections
  for (const objection of outcome.callObjections) {
    const result = await analyzeCall(callTranscript, objection.prompt);
    results.objections.push({
      name: objection.name,
      ...result,
    });
  }

  // Process playbook checks
  for (const check of outcome.playbookChecks) {
    const result = await analyzeCall(callTranscript, check.prompt);
    results.checks.push({
      name: check.name,
      ...result,
    });
  }

  // Process scorecard
  for (const metric of outcome.variableScorecard) {
    const result = await analyzeCall(callTranscript, metric.prompt);
    results.scores.push({
      name: metric.name,
      ...result,
    });
  }
}
```

### Result Display

```json
{
  "callId": "call-12345",
  "outcome": "Enterprise Sales Call",
  "results": {
    "insights": [
      {
        "name": "Budget Range",
        "found": true,
        "evidence": "$50k-$75k quarterly budget",
        "relevanceScore": 9,
        "recommendations": ["Follow up with ROI calculator", "Share case study"]
      }
    ],
    "objections": [
      {
        "name": "Price Concern",
        "raised": true,
        "moment": "12:34",
        "customerQuote": "That's above our initial budget",
        "repResponse": "Discussed payment plans and ROI",
        "effectiveness": 7,
        "overcomeLikelihood": "65%"
      }
    ],
    "checks": [
      {
        "name": "Introduction Done",
        "status": "YES",
        "evidence": "Rep introduced at 0:15 - 'Hi, I'm John from Acme'",
        "qualityScore": 8
      }
    ],
    "scores": [
      {
        "name": "Rapport Building",
        "score": 4,
        "justification": "Rep used customer's name, showed genuine interest...",
        "strengths": ["Active listening", "Empathy shown"],
        "improvements": ["Could use more humor", "Mirror customer's energy"]
      }
    ]
  }
}
```

## Migration from Old Format

### Old Format (Combined Prompts)

```json
{
  "callInsightsAgent": "One big prompt for all insights...",
  "callObjectionsAgent": "One big prompt for all objections...",
  "playbookChecksAgent": "One big prompt for all checks...",
  "variableScorecardAgent": "One big prompt for all scores..."
}
```

### New Format (Individual Prompts)

```json
{
  "callInsights": [
    { "name": "Insight 1", "prompt": "..." },
    { "name": "Insight 2", "prompt": "..." }
  ],
  "callObjections": [
    { "name": "Objection 1", "prompt": "..." },
    { "name": "Objection 2", "prompt": "..." }
  ],
  "playbookChecks": [
    { "name": "Check 1", "prompt": "..." },
    { "name": "Check 2", "prompt": "..." }
  ],
  "variableScorecard": [
    { "name": "Score 1", "prompt": "..." },
    { "name": "Score 2", "prompt": "..." }
  ]
}
```

## Summary

The new structure gives you:

- ✅ **Individual prompts** for each item
- ✅ **Clear naming** for easy identification
- ✅ **Structured output** ready for your agents
- ✅ **Better accuracy** with focused analysis
- ✅ **Easier management** and testing

Each prompt is tailored to its specific purpose, enriched with web-researched company context, and ready to be used by your conversational intelligence agents! 🚀
