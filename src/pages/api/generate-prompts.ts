import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { searchCompanyInfo } from "../../services/perplexitySearch";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface GeneratePromptsRequest {
  businessInfo: {
    businessName: string;
    businessGoals: string;
    companyWebsite: string;
    documentTranscription?: string;
  };
  callOutcomes: Array<{
    nodeName: string;
    nodeDescription: string;
    path: string[];
    customerInsights: Array<{ name: string; description: string }>;
    customerObjection: Array<{ name: string; description: string }>;
    booleanScoreCard: Array<{ name: string; description: string }>;
    variableScoreCard: Array<{ name: string; description: string }>;
  }>;
}

interface PromptItem {
  name: string;
  prompt: string;
}

interface OutcomePrompt {
  outcomeName: string;
  outcomePath: string[];
  callInsights: PromptItem[];
  callObjections: PromptItem[];
  playbookChecks: PromptItem[];
  variableScorecard: PromptItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { businessInfo, callOutcomes }: GeneratePromptsRequest = req.body;

    if (!businessInfo || !callOutcomes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate context about the company using OpenAI
    const companyContext = await generateCompanyContext(businessInfo);

    // Generate GLOBAL transcript prompt (one for all outcomes)
    const transcriptPrompt = generateGlobalTranscriptPrompt(callOutcomes, companyContext);

    // Generate prompts for each call outcome
    const outcomePrompts: OutcomePrompt[] = [];

    for (const outcome of callOutcomes) {
      const prompt = generateOutcomePrompt(outcome);
      outcomePrompts.push(prompt);
    }

    // Structure the final response
    const response = {
      metadata: {
        generatedAt: new Date().toISOString(),
        businessName: businessInfo.businessName,
        totalOutcomes: outcomePrompts.length,
        systemContext:
          "You work as an AI assistant in Ginni and your job is to support other agents with the required data and prompt so they can do their job as conversational intelligence that listen to calls and return insightful data from them.",
      },
      companyContext,
      transcriptPrompt, // GLOBAL transcript prompt
      outcomePrompts,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error generating prompts:", error);
    return res.status(500).json({
      error: "Failed to generate prompts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function generateCompanyContext(businessInfo: any): Promise<string> {
  const { businessName, businessGoals, companyWebsite, documentTranscription } = businessInfo;

  // Step 1: Get real-time web information about the company using Perplexity
  let webSearchResults = "";
  let searchCitations: string[] = [];

  try {
    console.log(`Searching web for company: ${businessName}...`);
    const searchResult = await searchCompanyInfo(businessName, companyWebsite);
    webSearchResults = searchResult.answer;
    searchCitations = searchResult.citations;
    console.log(`Web search completed. Found ${searchCitations.length} citations.`);
  } catch (error) {
    console.warn("Perplexity search failed, continuing with available data:", error);
    webSearchResults = "Web search unavailable - using provided information only.";
  }

  // Step 2: Combine web search results with provided information for OpenAI analysis
  const contextPrompt = `Analyze the following company information and create a comprehensive context summary that will be used to enrich conversational intelligence prompts:

Company Name: ${businessName}
Website: ${companyWebsite || "Not provided"}
Business Goals: ${businessGoals}

WEB SEARCH RESULTS (Real-time information about this company):
${webSearchResults}
${searchCitations.length > 0 ? `\nSources: ${searchCitations.join(", ")}` : ""}

${documentTranscription ? `QA Manual/Documentation:\n${documentTranscription.substring(0, 4000)}` : "No QA documentation provided"}

Please synthesize all the above information and provide:
1. Industry and business type analysis
2. Key value propositions and offerings (combine web research with stated goals)
3. Target customer profile
4. Communication style and brand voice
5. Quality standards and expectations based on the documentation
6. Unique selling points and differentiators
7. Market position and competitive context (from web research)

Prioritize factual web research data, then supplement with provided business goals and documentation.
Keep the summary comprehensive but concise (400-600 words).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a business analyst expert in understanding company profiles and creating context for sales coaching systems. You synthesize web research data with internal company information to create comprehensive profiles.",
        },
        {
          role: "user",
          content: contextPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || "Unable to generate company context";
  } catch (error) {
    console.error("Error generating company context:", error);
    // Fallback: return web search results if OpenAI fails
    if (webSearchResults && webSearchResults !== "Web search unavailable - using provided information only.") {
      return `${webSearchResults}\n\nBusiness Goals: ${businessGoals}`;
    }
    return `Basic context: ${businessName} is focused on ${businessGoals}`;
  }
}

function generateOutcomePrompt(outcome: any): OutcomePrompt {
  // Generate individual prompts for each item (with brief context)
  const callInsights = generateCallInsightsPrompts(outcome);
  const callObjections = generateCallObjectionsPrompts(outcome);
  const playbookChecks = generatePlaybookChecksPrompts(outcome);
  const variableScorecard = generateVariableScorecardPrompts(outcome);

  return {
    outcomeName: outcome.nodeName,
    outcomePath: outcome.path,
    callInsights,
    callObjections,
    playbookChecks,
    variableScorecard,
  };
}

// STAGE 1: Generate GLOBAL transcript prompt (understands ALL outcomes)
function generateGlobalTranscriptPrompt(allOutcomes: any[], companyContext: string): string {
  // Build detailed outcome descriptions
  const outcomeDescriptions = allOutcomes
    .map((outcome) => {
      return `
## ${outcome.nodeName}
Path: ${outcome.path.join(" → ")}
Description: ${outcome.nodeDescription}

What to listen for in this type of call:
${outcome.customerInsights.length > 0 ? `- Customer Insights: ${outcome.customerInsights.map((i: any) => i.name).join(", ")}` : ""}
${outcome.customerObjection.length > 0 ? `- Objections: ${outcome.customerObjection.map((o: any) => o.name).join(", ")}` : ""}
${outcome.booleanScoreCard.length > 0 ? `- Playbook Checks: ${outcome.booleanScoreCard.map((c: any) => c.name).join(", ")}` : ""}
${outcome.variableScoreCard.length > 0 ? `- Performance Metrics: ${outcome.variableScoreCard.map((s: any) => s.name).join(", ")}` : ""}
`;
    })
    .join("\n");

  const prompt = `You are a conversational intelligence agent working for Ginni. Your job is to:
1. Listen to a sales call audio
2. Understand what TYPE of call this is (which outcome category it belongs to)
3. Create a detailed, accurate transcript

==================================================
COMPANY CONTEXT (CRITICAL - Read carefully):
==================================================
${companyContext}

==================================================
CALL OUTCOME TYPES (Learn these thoroughly):
==================================================
Below are ALL possible outcome types for this business. Each call will belong to ONE of these categories.
${outcomeDescriptions}

==================================================
YOUR TASK:
==================================================
1. **Listen to the call carefully**
2. **Determine which outcome type** this call belongs to based on the conversation
3. **Create a detailed transcript** with:
   - All dialogue from both sales representative and customer
   - Timestamps for key moments (e.g., [02:34])
   - Speaker identification (Rep/Customer)
   - Emotional cues and tone (e.g., [customer sounds hesitant], [rep enthusiastic])
   - Important pauses or interruptions

==================================================
OUTPUT FORMAT:
==================================================
First, state the outcome type:
OUTCOME: [Which outcome type from the list above]

Then provide the transcript:
[00:00] Rep: [Opening statement]
[00:15] Customer: [Response]
[00:32] Rep: [Follow-up]
...

Include [notes in brackets] for context, tone, or non-verbal cues.

REMEMBER: Understanding the business context and outcome types is CRITICAL for accurate categorization and transcription.`;

  return prompt;
}

// STAGE 2: Generate analysis prompts (receive transcript text + brief context)
function generateCallInsightsPrompts(outcome: any): PromptItem[] {
  if (outcome.customerInsights.length === 0) {
    return [];
  }

  const prompts: PromptItem[] = [];

  for (const insight of outcome.customerInsights) {
    const prompt = `CALL OUTCOME: ${outcome.nodeName} - ${outcome.nodeDescription}

You are analyzing a call transcript to extract a specific customer insight.

INSIGHT TO EXTRACT:
Name: ${insight.name}
Description: ${insight.description}

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
}`;

    prompts.push({
      name: insight.name,
      prompt,
    });
  }

  return prompts;
}

function generateCallObjectionsPrompts(outcome: any): PromptItem[] {
  if (outcome.customerObjection.length === 0) {
    return [];
  }

  const prompts: PromptItem[] = [];

  for (const objection of outcome.customerObjection) {
    const prompt = `CALL OUTCOME: ${outcome.nodeName} - ${outcome.nodeDescription}

You are analyzing a call transcript to identify a specific customer objection.

OBJECTION TO DETECT:
Name: ${objection.name}
Description: ${objection.description}

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
}`;

    prompts.push({
      name: objection.name,
      prompt,
    });
  }

  return prompts;
}

function generatePlaybookChecksPrompts(outcome: any): PromptItem[] {
  if (outcome.booleanScoreCard.length === 0) {
    return [];
  }

  const prompts: PromptItem[] = [];

  for (const check of outcome.booleanScoreCard) {
    const prompt = `CALL OUTCOME: ${outcome.nodeName} - ${outcome.nodeDescription}

You are evaluating a call transcript against a specific playbook requirement.

PLAYBOOK CHECK:
Name: ${check.name}
Description: ${check.description}

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
}`;

    prompts.push({
      name: check.name,
      prompt,
    });
  }

  return prompts;
}

function generateVariableScorecardPrompts(outcome: any): PromptItem[] {
  if (outcome.variableScoreCard.length === 0) {
    return [];
  }

  const prompts: PromptItem[] = [];

  for (const item of outcome.variableScoreCard) {
    const prompt = `CALL OUTCOME: ${outcome.nodeName} - ${outcome.nodeDescription}

You are scoring a call transcript on a specific performance metric.

METRIC TO SCORE:
Name: ${item.name}
Description: ${item.description}

SCORING SCALE (1-5):
1 = ${item.score1Desc || "Poor"}
2 = ${item.score2Desc || "Below Average"}
3 = ${item.score3Desc || "Average"}
4 = ${item.score4Desc || "Good"}
5 = ${item.score5Desc || "Excellent"}

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
}`;

    prompts.push({
      name: item.name,
      prompt,
    });
  }

  return prompts;
}
