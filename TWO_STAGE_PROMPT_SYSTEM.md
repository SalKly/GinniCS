# Two-Stage Prompt System

## Overview

The system now uses a **two-stage approach** for analyzing sales calls:

1. **Stage 1: Transcript Extraction** - One agent with full business context extracts the transcript
2. **Stage 2: Analysis** - Multiple specialized agents analyze the transcript for specific items

This eliminates redundancy and makes prompts more efficient.

---

## The Two-Stage Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: TRANSCRIPT EXTRACTION                             │
│  Agent: Transcription Agent                                  │
│  Input: Audio/Call Recording                                 │
│  Prompt: transcriptPrompt (includes FULL business context)   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ (outputs transcript)
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: ANALYSIS                                          │
│  Agents: Insights, Objections, Checks, Scorecard            │
│  Input: Transcript Text (from Stage 1)                      │
│  Prompts: Simplified, focused on extraction only            │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Transcript Extraction

### Purpose

Listen to the call audio and create a detailed, timestamped transcript.

### Input

- Audio recording or live call

### Prompt Includes

✅ **Full company context** (from Perplexity web search + your docs)  
✅ **Outcome type explanation** (what type of call this is)  
✅ **All items to watch for** (insights, objections, checks, scorecard)  
✅ **Transcription guidelines** (timestamps, speaker ID, tone notes)

### Example `transcriptPrompt`

```
You are a conversational intelligence agent working for Ginni. Your job is to listen to a sales call and extract a detailed transcript.

COMPANY CONTEXT (IMPORTANT - Read carefully):
[Web-researched company info about the business, industry, products, competitors, target market, etc.]

CALL OUTCOME BEING ANALYZED:
Outcome Name: Enterprise Sales Call
Description: High-value B2B sales conversation
Path: Root → Sales → Enterprise

YOUR TASK:
Listen to the sales call audio and create a detailed, accurate transcript. Include:
- All dialogue from both the sales representative and the customer
- Timestamps for key moments
- Speaker identification (Rep/Customer)
- Emotional cues and tone changes (e.g., [customer sounds hesitant], [rep enthusiastic])
- Pauses and interruptions

WHAT TO LOOK FOR IN THIS CALL:
This call is categorized as "Enterprise Sales Call" which means High-value B2B sales conversation.

Key areas to pay attention to:

Customer Insights to watch for:
- Budget Discussion: Customer mentions their budget range
- Decision Timeline: When they plan to make a decision
- Stakeholders Involved: Who else is involved in the decision

Potential Objections to note:
- Price Concern: Customer thinks price is too high
- Implementation Time: Worried about deployment complexity

Playbook Steps to identify:
- Did rep introduce themselves?
- Did rep ask discovery questions?
- Was a demo offered?

Performance Areas to observe:
- Rapport Building: How well rep connects with customer
- Product Knowledge: Rep's understanding of features
- Objection Handling: How rep addresses concerns

OUTPUT FORMAT:
Provide a clean, timestamped transcript in this format:

[00:00] Rep: [Opening statement]
[00:15] Customer: [Response]
[00:32] Rep: [Follow-up]
...

Include notes in [brackets] for important context, tone, or non-verbal cues.
```

### Output

A transcript like this:

```
[00:00] Rep: Hi, this is John from Acme Corp. Is this a good time to chat?
[00:15] Customer: Sure, I have about 20 minutes.
[00:23] Rep: Perfect. I understand you're looking into CRM solutions. Tell me about your current process. [friendly tone]
[00:45] Customer: Well, we're using spreadsheets right now, and it's getting messy. [sounds frustrated]
[01:10] Rep: I hear that a lot. How many people are on your sales team?
[01:18] Customer: About 15 reps across two offices.
[01:30] Customer: Before we go further, what's the pricing like? I have a budget of around $500/month. [cautious tone]
...
```

---

## Stage 2: Analysis

### Purpose

Read the transcript (from Stage 1) and extract specific insights, objections, checks, or scores.

### Input

- Transcript text (output from Stage 1)

### Prompts Are

✅ **Simplified** - No repeated business context  
✅ **Focused** - Just extract what's needed  
✅ **Fast** - Get straight to the point

---

### Example: Call Insight Prompt

```
You are analyzing a call transcript to extract a specific customer insight.

INSIGHT TO EXTRACT:
Name: Budget Discussion
Description: Customer mentions their budget range or financial constraints

INSTRUCTIONS:
Read the transcript and identify if this insight appears in the conversation.

Extract:
1. Direct quotes or paraphrased evidence
2. Timestamp/location in transcript
3. Whether this insight was found (YES/NO)
4. Relevance score (1-10)
5. Key takeaways and recommended actions

OUTPUT FORMAT (JSON):
{
  "found": "YES/NO",
  "evidence": "Specific quotes or paraphrases",
  "timestamp": "When it occurred",
  "relevanceScore": 1-10,
  "keyTakeaways": "Summary of what this means",
  "recommendations": ["Action 1", "Action 2"]
}
```

**Agent receives:**

```
TRANSCRIPT:
[00:00] Rep: Hi, this is John from Acme Corp...
[01:30] Customer: Before we go further, what's the pricing like? I have a budget of around $500/month. [cautious tone]
...
```

**Agent outputs:**

```json
{
  "found": "YES",
  "evidence": "Customer stated: 'I have a budget of around $500/month'",
  "timestamp": "[01:30]",
  "relevanceScore": 9,
  "keyTakeaways": "Customer has defined budget constraint of $500/month, communicated early in call",
  "recommendations": [
    "Prepare pricing options around $500/month threshold",
    "Show ROI to justify any price above budget",
    "Ask about flexibility if value is demonstrated"
  ]
}
```

---

### Example: Objection Prompt

```
You are analyzing a call transcript to identify a specific customer objection.

OBJECTION TO DETECT:
Name: Price Concern
Description: Customer states that the price is above their budget or expectations

INSTRUCTIONS:
Read the transcript and determine if this objection was raised (explicitly or implied).

Analyze:
1. Was this objection raised? (YES/NO)
2. Customer's exact wording or sentiment
3. How did the sales rep respond?
4. How effective was the response? (1-10)
5. Was the objection overcome?

OUTPUT FORMAT (JSON):
{
  "raised": "YES/NO",
  "customerQuote": "What customer said",
  "timestamp": "When it occurred",
  "objectionType": "price/timing/authority/need/competition",
  "strength": "low/medium/high",
  "repResponse": "How rep handled it",
  "effectiveness": 1-10,
  "overcomeLikelihood": "percentage",
  "recommendedStrategy": "How to better handle this"
}
```

---

### Example: Playbook Check Prompt

```
You are evaluating a call transcript against a specific playbook requirement.

PLAYBOOK CHECK:
Name: Did rep introduce themselves?
Description: Sales rep should state their name and role in first 30 seconds

INSTRUCTIONS:
Read the transcript and determine if this requirement was met.

Evaluate:
1. Was this requirement met? (YES/NO)
2. Find evidence in the transcript
3. If met, how well was it executed? (1-10)
4. If not met, what was missing?

OUTPUT FORMAT (JSON):
{
  "status": "YES/NO",
  "evidence": "Quote or description from transcript",
  "timestamp": "When it occurred (or should have occurred)",
  "qualityScore": 1-10 (if YES, otherwise "N/A"),
  "gapAnalysis": "What was missing or could improve",
  "coachingTip": "Specific advice for the rep"
}
```

---

### Example: Scorecard Prompt

```
You are scoring a call transcript on a specific performance metric.

METRIC TO SCORE:
Name: Rapport Building
Description: How well the rep builds connection with the customer

SCORING SCALE (1-5):
1 = Cold and transactional
2 = Minimal rapport building
3 = Professional but basic
4 = Good connection established
5 = Excellent rapport, customer feels valued

INSTRUCTIONS:
Read the transcript and score this metric based on the scale above.

Provide:
1. Score (1-5)
2. Evidence from transcript
3. What was done well
4. What could improve

OUTPUT FORMAT (JSON):
{
  "score": 1-5,
  "justification": "Why this score was given",
  "evidence": "Quotes or moments from transcript",
  "strengths": ["What rep did well"],
  "improvements": ["Specific suggestions"],
  "impact": "How this affected the call outcome"
}
```

---

## Output Structure

### Complete JSON Response

```json
{
  "metadata": { "..." },
  "companyContext": "...",
  "outcomePrompts": [
    {
      "outcomeName": "Enterprise Sales Call",
      "outcomePath": ["Root", "Sales", "Enterprise"],

      "transcriptPrompt": "STAGE 1 PROMPT: Full context, transcription task...",

      "callInsights": [
        { "name": "Budget Discussion", "prompt": "STAGE 2: Extract budget from transcript..." },
        { "name": "Decision Timeline", "prompt": "STAGE 2: Extract timeline from transcript..." }
      ],

      "callObjections": [
        { "name": "Price Concern", "prompt": "STAGE 2: Detect price objection in transcript..." }
      ],

      "playbookChecks": [
        { "name": "Did rep introduce?", "prompt": "STAGE 2: Check introduction in transcript..." }
      ],

      "variableScorecard": [
        { "name": "Rapport Building", "prompt": "STAGE 2: Score rapport from transcript..." }
      ]
    }
  ]
}
```

---

## Benefits of Two-Stage Approach

### 1. **Efficiency**

- ✅ Business context only included once (Stage 1)
- ✅ Stage 2 prompts are shorter and faster
- ✅ Less redundancy = lower API costs

### 2. **Separation of Concerns**

- ✅ Transcription agent: Focus on audio → text
- ✅ Analysis agents: Focus on text → insights
- ✅ Each agent does ONE thing well

### 3. **Reusability**

- ✅ Same transcript can be analyzed multiple times
- ✅ Add new analysis without re-transcribing
- ✅ Cache transcripts for efficiency

### 4. **Scalability**

- ✅ Stage 2 agents can run in parallel
- ✅ Easy to add new analysis types
- ✅ No limit on number of items per outcome

### 5. **Clarity**

- ✅ Clear handoff between stages
- ✅ Easier to debug (which stage failed?)
- ✅ Stage 2 prompts are simpler

---

## Implementation in Your System

### Your Agent Processing Flow

```javascript
// Step 1: Extract transcript from call
const transcriptAgent = new TranscriptionAgent(outcome.transcriptPrompt);
const transcript = await transcriptAgent.listen(audioFile);

// Step 2: Analyze transcript with multiple agents in parallel
const results = await Promise.all([
  // Insights
  ...outcome.callInsights.map((insight) => new InsightAgent(insight.prompt).analyze(transcript)),

  // Objections
  ...outcome.callObjections.map((objection) => new ObjectionAgent(objection.prompt).analyze(transcript)),

  // Playbook Checks
  ...outcome.playbookChecks.map((check) => new PlaybookAgent(check.prompt).analyze(transcript)),

  // Scorecard
  ...outcome.variableScorecard.map((metric) => new ScorecardAgent(metric.prompt).analyze(transcript)),
]);
```

---

## Key Differences from Before

### Before (Single-Stage)

```
❌ Every prompt repeated full business context
❌ Each agent had to "understand the company"
❌ Long prompts = slower + more expensive
❌ Transcription and analysis mixed together
```

### After (Two-Stage)

```
✅ Business context only in Stage 1 (transcriptPrompt)
✅ Stage 2 prompts focus on extraction only
✅ Shorter prompts = faster + cheaper
✅ Clean separation: audio → text → insights
```

---

## When to Use Each Stage

### Use `transcriptPrompt` when:

- Converting audio to text
- Need full business context
- Setting up the call for analysis
- One-time operation per call

### Use `callInsights`, `callObjections`, etc. when:

- Analyzing existing transcript
- Extracting specific information
- Running multiple analyses
- Can run in parallel

---

## Cost Comparison

### Example: 20-minute call, 5 insights, 3 objections, 5 checks, 4 scores

**Before (Single-Stage):**

```
- 5 insight prompts × 500 tokens (with context) = 2,500 tokens
- 3 objection prompts × 500 tokens = 1,500 tokens
- 5 check prompts × 500 tokens = 2,500 tokens
- 4 score prompts × 500 tokens = 2,000 tokens
Total: 8,500 tokens in prompts
```

**After (Two-Stage):**

```
- 1 transcript prompt × 800 tokens (full context) = 800 tokens
- 17 analysis prompts × 150 tokens (simplified) = 2,550 tokens
Total: 3,350 tokens in prompts
```

**Savings: ~60% fewer tokens!** 🎉

---

## Summary

The two-stage system is:

1. **More Efficient** - Business context once, not repeated
2. **More Organized** - Clear Stage 1 → Stage 2 flow
3. **More Scalable** - Easy to add new analysis items
4. **More Cost-Effective** - Shorter prompts = lower costs
5. **More Flexible** - Transcript can be reused

Each agent now has a clear, focused job:

- **Transcription Agent**: Audio → Text (with full context)
- **Analysis Agents**: Text → Insights (focused extraction)

🚀 **This is production-ready!**
