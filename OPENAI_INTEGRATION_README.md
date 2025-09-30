# OpenAI Integration for Call Outcome Prompts

## Overview

This integration uses **Perplexity AI** (for web research) and **OpenAI's GPT-4** (for analysis) to generate enriched, context-aware prompts for call outcome analysis. The system creates prompts in a **two-stage approach**:

1. **Stage 1: Transcript Extraction** - One prompt with full business context for extracting call transcripts
2. **Stage 2: Analysis** - Individual focused prompts for analyzing the transcript

The AI reads your company information (from web search + uploaded documents) and call outcomes structure to create detailed prompts for multiple conversational intelligence agents.

## Features

### What Gets Generated

For each call outcome, the system generates prompts for **4 specialized agents**:

1. **Call Insights Agent**: Analyzes customer insights from calls

   - Extracts specific quotes and behavioral cues
   - Contextualizes findings with company goals
   - Provides relevance scoring and actionable recommendations

2. **Call Objections Agent**: Identifies and analyzes customer objections

   - Detects explicit and implied objections
   - Evaluates how well sales reps addressed objections
   - Provides recommended handling strategies

3. **Playbook Checks Agent**: Verifies adherence to sales playbook

   - Boolean (YES/NO) evaluation of required steps
   - Quality scoring with specific evidence
   - Gap analysis and coaching recommendations

4. **Variable Scorecard Agent**: Scores performance metrics on a 1-5 scale
   - Detailed justification for each score
   - Evidence-based evaluation
   - Specific improvement recommendations

### Company Context Enrichment

The AI analyzes your company information to provide:

- Industry and business type analysis
- Key value propositions
- Target customer profile
- Communication style and brand voice
- Quality standards from documentation
- Unique selling points

This context is used to enrich all generated prompts, making them specific to your business.

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

### 2. Configure the Environment

Create a `.env.local` file in the root directory:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Perplexity API Key (optional but recommended for web search)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: Never commit this file to version control. It's already in `.gitignore`.

**Note**: With the Perplexity integration, the system now performs real-time web searches to gather factual information about companies, making your prompts even more accurate and context-rich! See `PERPLEXITY_INTEGRATION_README.md` for details.

### 3. Restart the Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## How to Use

### Step 1: Create a Blueprint

1. Navigate to the form creation page
2. Fill in your business information:
   - Business Name
   - Company Website
   - Business Goals
   - Upload QA Manual (PDF) - Optional but recommended

### Step 2: Define Call Outcomes

1. Define your general outcome (root node)
2. Add nested outcomes with:
   - Customer insights (name & description)
   - Customer objections (name & description)
   - Boolean scorecard items (playbook checks)
   - Variable scorecard items (1-5 scoring criteria)

### Step 3: Generate AI Prompts

1. After completing the blueprint, click "Visualize Tree"
2. In the tree visualizer, you'll see two download buttons:

   - **Download Call Outcomes**: Downloads the raw JSON structure
   - **Download AI Prompts**: Generates and downloads AI-enriched prompts

3. Click "Download AI Prompts"
4. Wait for the AI to process (usually 10-30 seconds depending on complexity)
5. A JSON file will be downloaded with all generated prompts

## Output Structure

The generated JSON file contains:

```json
{
  "metadata": {
    "generatedAt": "2025-09-30T...",
    "businessName": "Your Company",
    "totalOutcomes": 5,
    "systemContext": "You work as an AI assistant in Ginni..."
  },
  "companyContext": "AI-generated company analysis...",
  "outcomePrompts": [
    {
      "outcomeName": "Sales Inquiry",
      "outcomePath": ["Root", "Sales", "Inquiry"],

      "transcriptPrompt": "STAGE 1: Agent listens to call and extracts transcript. Includes full business context, outcome details, and what to watch for...",

      "callInsights": [
        {
          "name": "Budget Discussion",
          "prompt": "STAGE 2: Read transcript and extract budget discussion..."
        },
        {
          "name": "Timeline Urgency",
          "prompt": "STAGE 2: Read transcript and extract timeline urgency..."
        }
      ],
      "callObjections": [
        {
          "name": "Price Concern",
          "prompt": "STAGE 2: Read transcript and detect price objections..."
        },
        {
          "name": "Competitor Comparison",
          "prompt": "STAGE 2: Read transcript and analyze competitor mentions..."
        }
      ],
      "playbookChecks": [
        {
          "name": "Did rep introduce themselves?",
          "prompt": "STAGE 2: Read transcript and check if introduction occurred..."
        },
        {
          "name": "Did rep ask discovery questions?",
          "prompt": "STAGE 2: Read transcript and check discovery questions..."
        }
      ],
      "variableScorecard": [
        {
          "name": "Rapport Building",
          "prompt": "STAGE 2: Read transcript and score rapport building..."
        },
        {
          "name": "Product Knowledge",
          "prompt": "STAGE 2: Read transcript and score product knowledge..."
        }
      ]
    }
    // ... more outcomes
  ]
}
```

## Technical Details

### API Endpoint

**Location**: `/api/generate-prompts`

**Method**: POST

**Request Body**:

```typescript
{
  businessInfo: {
    businessName: string;
    businessGoals: string;
    companyWebsite: string;
    documentTranscription?: string;
  },
  callOutcomes: Array<{
    nodeName: string;
    nodeDescription: string;
    path: string[];
    customerInsights: Array<{ name: string; description: string }>;
    customerObjection: Array<{ name: string; description: string }>;
    booleanScoreCard: Array<{ name: string; description: string }>;
    variableScoreCard: Array<{ name: string; description: string }>;
  }>
}
```

### AI Model

- **Model**: GPT-4o-mini (cost-effective and fast)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 1000 for company context

### Cost Estimation

For a typical blueprint with:

- 5 call outcomes
- 3-5 items per category
- 2000 words of QA documentation

Estimated cost: **$0.05 - $0.15** per generation

## Files Modified/Created

### New Files

1. `src/pages/api/generate-prompts.ts` - API endpoint for OpenAI integration
2. `src/services/promptGenerator.ts` - Service layer for prompt generation
3. `OPENAI_INTEGRATION_README.md` - This documentation

### Modified Files

1. `src/components/blueprint/BlueprintFlow.tsx` - Added "Download AI Prompts" button
2. `package.json` - Added OpenAI SDK dependency

## Troubleshooting

### Error: "Missing required fields"

- Ensure your blueprint has business information filled out
- Check that call outcomes are properly defined

### Error: "Failed to generate prompts"

- Verify your OpenAI API key is correct in `.env.local`
- Check that you have API credits in your OpenAI account
- Ensure the development server was restarted after adding the API key

### Error: "Rate limit exceeded"

- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan if this happens frequently

### The button is disabled/loading forever

- Check the browser console for errors
- Verify the API endpoint is accessible at `http://localhost:3000/api/generate-prompts`
- Check your internet connection

## Security Best Practices

1. **Never commit API keys**: The `.env.local` file should never be in version control
2. **Use environment variables**: Always use environment variables for sensitive data
3. **Monitor usage**: Regularly check your OpenAI usage dashboard
4. **Set spending limits**: Configure spending limits in your OpenAI account

## Future Enhancements

Potential improvements for this integration:

1. **Streaming responses**: Show real-time progress as prompts are generated
2. **Prompt customization**: Allow users to adjust prompt templates
3. **Multiple AI models**: Support for different AI providers (Anthropic, Cohere, etc.)
4. **Caching**: Cache company context to reduce API calls
5. **Batch processing**: Generate prompts for multiple blueprints at once
6. **Prompt versioning**: Track and compare different versions of generated prompts

## Support

For issues or questions about this integration:

1. Check the browser console for error messages
2. Review the API endpoint logs
3. Verify your OpenAI API key and account status
4. Check the OpenAI status page for any service outages

## System Context

All agents operate under this main context:

> "You work as an AI assistant in Ginni and your job is to support other agents with the required data and prompt so they can do their job as conversational intelligence that listen to calls and return insightful data from them."

This ensures all generated prompts are aligned with the Ginni platform's purpose and provide consistent, actionable intelligence for sales coaching.
