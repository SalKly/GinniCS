# Perplexity AI Web Search Integration

## Overview

This integration uses **Perplexity AI** to perform real-time web searches about companies, enriching your AI-generated prompts with current, factual information from the web. When you create a blueprint, the system now:

1. **Searches the web** using Perplexity AI to find information about the company
2. **Combines web results** with your provided business information (goals, QA docs)
3. **Uses OpenAI** to synthesize everything into comprehensive, context-rich prompts

## Features

### Automatic Web Search

- When generating AI prompts, the system automatically searches for company information
- Uses company name and website URL for accurate results
- Retrieves real-time data about:
  - What the company does
  - Industry and market position
  - Products/services offered
  - Target customers
  - Competitive positioning

### Enhanced Context

Your generated prompts now include:

- **Real-world company data** from web sources
- **Citations and sources** for fact-checking
- **Market context** that you might not have provided
- **Accurate industry positioning**

### Two API Endpoints

#### 1. `/api/search-company` - Standalone Company Search

Use this to search for any company independently:

```typescript
POST /api/search-company
{
  "companyName": "Apple Inc",
  "companyWebsite": "https://apple.com",
  "structured": false  // Set to true for structured response
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Apple Inc. is a multinational technology company...",
    "citations": ["https://apple.com", "https://en.wikipedia.org/wiki/Apple_Inc."]
  }
}
```

#### 2. `/api/generate-prompts` - Enhanced Prompt Generation

Your existing endpoint now automatically includes web search:

```typescript
POST /api/generate-prompts
{
  "businessInfo": {
    "businessName": "Apple Inc",
    "companyWebsite": "https://apple.com",
    "businessGoals": "...",
    "documentTranscription": "..."
  },
  "callOutcomes": [...]
}
```

The prompts now include web-researched company context automatically!

## Setup

### 1. Environment Variable

Add your Perplexity API key to `.env.local`:

```bash
PERPLEXITY_API_KEY=pplx-your-api-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

### 2. Restart Development Server

```bash
npm run dev
```

That's it! The integration works automatically.

## How It Works

### The Flow

1. **User fills out business information** (company name, website, goals)
2. **User clicks "Download AI Prompts"** in the tree visualizer
3. **System searches Perplexity** for real-time company information
4. **Perplexity returns** comprehensive data with citations
5. **System combines** web results + business goals + QA docs
6. **OpenAI analyzes** everything and creates enriched context
7. **System generates** detailed prompts for all 4 agent types
8. **User downloads** JSON file with complete, web-enhanced prompts

### Example Workflow

```
Input:
- Company: "Slack Technologies"
- Website: "slack.com"
- Goals: "Improve sales conversion rates"

Perplexity Search:
→ Finds that Slack is a business communication platform
→ Industry: SaaS, Enterprise Software
→ Target: Businesses of all sizes
→ Competitors: Microsoft Teams, Discord

OpenAI Analysis:
→ Combines web data with your goals
→ Creates context about how sales calls should be evaluated
→ Considers industry-specific best practices

Result:
→ Prompts tailored to SaaS sales
→ Context about competitive landscape
→ Relevant customer objections (pricing, Teams comparison)
→ Industry-appropriate scoring criteria
```

## API Models Used

### Perplexity

- **Model**: `sonar`
- **Why**: Fast online model with web search, optimized for speed and cost-effectiveness
- **Temperature**: 0.2 (factual accuracy)
- **Max Tokens**: 1000

### OpenAI

- **Model**: `gpt-4o-mini`
- **Why**: Excellent at analysis and synthesis
- **Temperature**: 0.7 (balanced)
- **Max Tokens**: 1500 (increased for richer context)

## Cost Estimation

### Per Company Search

- **Perplexity**: ~$0.01-0.03 per search
- **OpenAI**: ~$0.05-0.10 for context generation
- **Total**: ~$0.06-0.13 per blueprint

### Example Monthly Usage

For 100 blueprints/month: **$6-13/month**

Much more affordable than manual research! 🎉

## Files Created/Modified

### New Files

1. `src/services/perplexitySearch.ts` - Perplexity API service
2. `src/pages/api/search-company.ts` - Standalone search endpoint
3. `PERPLEXITY_INTEGRATION_README.md` - This documentation

### Modified Files

1. `src/pages/api/generate-prompts.ts` - Added Perplexity integration

## Example Output Comparison

### Before (Without Web Search)

```
Company Context:
Based on the business name "TechCorp" and stated goals
of improving customer retention, this appears to be a
technology company...
```

### After (With Perplexity Search)

```
Company Context:
TechCorp is a leading SaaS provider specializing in
customer relationship management (CRM) software for
mid-market B2B companies. Founded in 2018, the company
serves over 5,000 customers across North America and
Europe. Their flagship product, TechCRM Pro, competes
with Salesforce and HubSpot in the $50B CRM market.

Key differentiators include:
- AI-powered sales forecasting
- Deep integration with enterprise tools
- Focus on mid-market (50-500 employees)

Their stated goal of improving customer retention aligns
with their recent pivot to emphasizing customer success
and onboarding improvements.

Sources: techcorp.com, crunchbase.com, g2.com
```

## Testing the Integration

### Test the Search Endpoint

You can test the search functionality independently:

```bash
# Using curl
curl -X POST http://localhost:3000/api/search-company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Salesforce",
    "companyWebsite": "salesforce.com"
  }'
```

### Test Full Integration

1. Go to your form creation page
2. Fill in business information with a real company (e.g., "Shopify")
3. Define some call outcomes
4. Click "Download AI Prompts"
5. Check the console logs - you'll see:
   - "Searching web for company: Shopify..."
   - "Web search completed. Found X citations."
6. Open the downloaded JSON and see the enriched context!

## Troubleshooting

### Error: "PERPLEXITY_API_KEY is not configured"

- Make sure you added the key to `.env.local`
- Restart your development server
- Check the key doesn't have extra spaces

### Error: "Perplexity API error: 401"

- Your API key is invalid or expired
- Get a new key from Perplexity dashboard
- Verify you copied the entire key

### Web search is slow

- Perplexity searches take 3-8 seconds (normal)
- It's doing real-time web searches
- The wait is worth it for accurate data!

### Citations are empty

- Some searches may not return citations
- The answer text is still valuable
- This is normal behavior

### "Web search unavailable" in output

- Perplexity API call failed
- System continues with available data (graceful fallback)
- Check your API key and internet connection

## Benefits of This Integration

### 1. Accuracy

- Real-time data instead of assumptions
- Factual information with sources
- Up-to-date market context

### 2. Time Savings

- No manual company research needed
- Automatic context enrichment
- One-click comprehensive analysis

### 3. Better Prompts

- Industry-specific insights
- Competitive context
- Realistic customer objections
- Appropriate scoring criteria

### 4. Transparency

- Citations included for verification
- Clear source attribution
- Audit trail for compliance

## Advanced Usage

### Custom Search Queries

You can use the service directly in your code:

```typescript
import { perplexitySearch } from "@/services/perplexitySearch";

// Generic search
const result = await perplexitySearch("What are common objections in SaaS sales?");

// Company-specific search
const companyInfo = await searchCompanyInfo("Microsoft", "microsoft.com");
```

### Structured Data

Request structured responses:

```typescript
const result = await searchStructuredCompanyInfo("Amazon", "amazon.com");

console.log(result.industry); // "E-commerce, Cloud Computing"
console.log(result.products); // "Online retail, AWS, Prime..."
console.log(result.targetMarket); // "Consumers and businesses..."
```

## Security Best Practices

1. **Never commit API keys** - Always use `.env.local`
2. **Monitor usage** - Check Perplexity dashboard regularly
3. **Set spending limits** - Configure in your Perplexity account
4. **Rate limiting** - Be mindful of API call frequency
5. **Error handling** - System gracefully degrades if search fails

## Future Enhancements

Potential improvements:

1. **Caching** - Cache search results to reduce API calls
2. **Batch searches** - Search multiple companies at once
3. **Industry templates** - Pre-configured prompts by industry
4. **Competitor analysis** - Automatic competitive intelligence
5. **Real-time updates** - Periodic refresh of company data
6. **Custom search depth** - Control how much context to gather

## Support

### Check Logs

- Browser console for frontend errors
- Server console for API errors
- Look for "Searching web for company..." messages

### Verify Setup

```bash
# Check environment variables are loaded
cat .env.local | grep PERPLEXITY

# Test the endpoint directly
curl http://localhost:3000/api/search-company
```

### Common Issues

- **404 on API route**: Server needs restart
- **CORS errors**: Check Next.js config
- **Timeout**: Perplexity search can take up to 10 seconds

## Conclusion

Perplexity integration transforms your prompt generation from generic templates to web-informed, context-rich intelligence. Your AI agents now understand not just what you tell them about the company, but what the market knows about them too.

**Happy prompting! 🚀**
