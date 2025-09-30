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

interface OutcomePrompt {
  outcomeName: string;
  outcomePath: string[];
  callInsightsAgent: string;
  callObjectionsAgent: string;
  playbookChecksAgent: string;
  variableScorecardAgent: string;
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

    // Generate prompts for each call outcome
    const outcomePrompts: OutcomePrompt[] = [];

    for (const outcome of callOutcomes) {
      const prompt = await generateOutcomePrompt(outcome, companyContext);
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

async function generateOutcomePrompt(outcome: any, companyContext: string): Promise<OutcomePrompt> {
  // Generate Call Insights Agent Prompt
  const callInsightsPrompt = await generateCallInsightsPrompt(outcome, companyContext);

  // Generate Call Objections Agent Prompt
  const callObjectionsPrompt = await generateCallObjectionsPrompt(outcome, companyContext);

  // Generate Playbook Checks Agent Prompt
  const playbookChecksPrompt = await generatePlaybookChecksPrompt(outcome, companyContext);

  // Generate Variable Scorecard Agent Prompt
  const variableScorecardPrompt = await generateVariableScorecardPrompt(outcome, companyContext);

  return {
    outcomeName: outcome.nodeName,
    outcomePath: outcome.path,
    callInsightsAgent: callInsightsPrompt,
    callObjectionsAgent: callObjectionsPrompt,
    playbookChecksAgent: playbookChecksPrompt,
    variableScorecardAgent: variableScorecardPrompt,
  };
}

async function generateCallInsightsPrompt(outcome: any, companyContext: string): Promise<string> {
  if (outcome.customerInsights.length === 0) {
    return "No customer insights defined for this outcome.";
  }

  const insightsText = outcome.customerInsights.map((insight: any) => `- ${insight.name}: ${insight.description}`).join("\n");

  const prompt = `You are analyzing a sales call for the outcome: "${outcome.nodeName}" - ${outcome.nodeDescription}

Company Context:
${companyContext}

Your task is to identify and extract the following customer insights from the call:
${insightsText}

Instructions:
1. Listen carefully for information related to each insight category
2. Extract specific quotes, data points, and behavioral cues
3. Contextualize findings with the company's business goals and value proposition
4. Identify patterns that align with or deviate from the expected customer profile
5. Note any emotional indicators or sentiment shifts
6. Flag any competitive mentions or market positioning discussions

For each insight, provide:
- Direct evidence from the call (quotes or paraphrases)
- Relevance score (1-10) based on business goals
- Actionable recommendations for follow-up

Format your response as structured JSON with clear categorization.`;

  return prompt;
}

async function generateCallObjectionsPrompt(outcome: any, companyContext: string): Promise<string> {
  if (outcome.customerObjection.length === 0) {
    return "No customer objections defined for this outcome.";
  }

  const objectionsText = outcome.customerObjection.map((objection: any) => `- ${objection.name}: ${objection.description}`).join("\n");

  const prompt = `You are analyzing a sales call for the outcome: "${outcome.nodeName}" - ${outcome.nodeDescription}

Company Context:
${companyContext}

Your task is to identify and analyze the following customer objections from the call:
${objectionsText}

Instructions:
1. Detect objections explicitly stated or implied through customer responses
2. Categorize the type of objection (price, timing, authority, need, competition)
3. Assess the strength and urgency of each objection
4. Evaluate how well the sales representative addressed the objection
5. Reference company value propositions that could counter each objection
6. Identify any unaddressed concerns or hesitations

For each objection detected, provide:
- Exact moment in call when objection was raised
- Customer's exact wording or sentiment
- Sales rep's response and effectiveness rating
- Recommended handling strategy based on company positioning
- Likelihood of objection being overcome (percentage)

Format your response as structured JSON with actionable insights.`;

  return prompt;
}

async function generatePlaybookChecksPrompt(outcome: any, companyContext: string): Promise<string> {
  if (outcome.booleanScoreCard.length === 0) {
    return "No playbook checks defined for this outcome.";
  }

  const checksText = outcome.booleanScoreCard.map((check: any) => `- ${check.name}: ${check.description}`).join("\n");

  const prompt = `You are evaluating a sales call for the outcome: "${outcome.nodeName}" - ${outcome.nodeDescription}

Company Context:
${companyContext}

Your task is to verify the following playbook requirements (boolean checks) from the call:
${checksText}

Instructions:
1. For each criterion, determine if it was met (YES) or not met (NO)
2. Provide specific evidence or timestamp for your determination
3. If not met, explain why and what was missing
4. Rate the quality of execution if the criterion was met
5. Consider company standards and quality expectations
6. Identify any deviations from expected procedures

For each playbook check, provide:
- Status: YES or NO
- Evidence: Specific call moment or quote
- Quality Score: 1-10 (if met)
- Gap Analysis: What was missing (if not met)
- Impact Assessment: How this affects call success
- Coaching Recommendation: Specific advice for improvement

Format your response as structured JSON with clear pass/fail indicators.`;

  return prompt;
}

async function generateVariableScorecardPrompt(outcome: any, companyContext: string): Promise<string> {
  if (outcome.variableScoreCard.length === 0) {
    return "No variable scorecard items defined for this outcome.";
  }

  const scorecardText = outcome.variableScoreCard
    .map((item: any) => {
      return `- ${item.name}: ${item.description}
  Scale: 1-5 where:
  1 = ${item.score1Desc || "Poor"}
  2 = ${item.score2Desc || "Below Average"}
  3 = ${item.score3Desc || "Average"}
  4 = ${item.score4Desc || "Good"}
  5 = ${item.score5Desc || "Excellent"}`;
    })
    .join("\n\n");

  const prompt = `You are scoring a sales call for the outcome: "${outcome.nodeName}" - ${outcome.nodeDescription}

Company Context:
${companyContext}

Your task is to score the following performance metrics on a 1-5 scale:
${scorecardText}

Instructions:
1. Evaluate each metric carefully against the provided scale
2. Consider company standards and industry best practices
3. Provide specific evidence for your score
4. Be objective and consistent in your evaluation
5. Consider the context of the call outcome and customer situation
6. Reference quality standards from company documentation

For each metric, provide:
- Score: 1-5 based on the provided scale
- Justification: Specific evidence from the call
- Key Moments: Timestamps or quotes supporting your score
- Strengths: What was done well
- Improvement Areas: Specific recommendations
- Impact on Outcome: How this metric affected the call result

Format your response as structured JSON with detailed scoring rationale.`;

  return prompt;
}
