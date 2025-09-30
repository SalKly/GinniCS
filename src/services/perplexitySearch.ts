/**
 * Perplexity AI Search Service
 * Uses Perplexity's API to perform web searches with AI-powered analysis
 */

export interface PerplexitySearchResult {
  answer: string;
  citations: string[];
  rawResponse?: any;
}

export interface CompanySearchResult {
  companyDescription: string;
  industry: string;
  products: string;
  targetMarket: string;
  citations: string[];
}

/**
 * Search for company information using Perplexity AI
 * @param companyName - The name of the company to search for
 * @param companyWebsite - Optional website URL for more accurate results
 * @returns Detailed company information from web search
 */
export async function searchCompanyInfo(companyName: string, companyWebsite?: string): Promise<PerplexitySearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured in environment variables");
  }

  // Construct a detailed query
  const query = companyWebsite
    ? `What does ${companyName} (${companyWebsite}) do? Provide details about their business, products/services, industry, target market, and value proposition.`
    : `What does ${companyName} do? Provide details about their business, products/services, industry, target market, and value proposition.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar", // Fast online model with web search
        messages: [
          {
            role: "system",
            content:
              "You are a business research analyst. Provide comprehensive, factual information about companies based on current web data. Include specific details about their business model, products/services, industry position, and target customers.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2, // Low temperature for factual accuracy
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Extract the response and citations
    const answer = data.choices?.[0]?.message?.content || "No information found";
    const citations = data.citations || [];

    return {
      answer,
      citations,
      rawResponse: data,
    };
  } catch (error) {
    console.error("Error searching company info with Perplexity:", error);
    throw error;
  }
}

/**
 * Search for structured company information using Perplexity AI
 * Returns parsed, structured data about the company
 */
export async function searchStructuredCompanyInfo(companyName: string, companyWebsite?: string): Promise<CompanySearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured in environment variables");
  }

  const query = companyWebsite
    ? `Research ${companyName} (${companyWebsite}) and provide structured information in the following format:
    
1. Company Description: A brief overview of what the company does
2. Industry: The industry/sector they operate in
3. Products/Services: What they offer to customers
4. Target Market: Who their ideal customers are

Be specific and factual.`
    : `Research ${companyName} and provide structured information in the following format:
    
1. Company Description: A brief overview of what the company does
2. Industry: The industry/sector they operate in
3. Products/Services: What they offer to customers
4. Target Market: Who their ideal customers are

Be specific and factual.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a business research analyst. Provide comprehensive, factual, structured information about companies based on current web data.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No information found";
    const citations = data.citations || [];

    // Parse the structured response (basic parsing, can be enhanced)
    const lines = answer.split("\n");
    let companyDescription = "";
    let industry = "";
    let products = "";
    let targetMarket = "";

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("company description:") || lowerLine.includes("1.")) {
        companyDescription = line.split(/:\s*(.+)/)[1] || line;
      } else if (lowerLine.includes("industry:") || lowerLine.includes("2.")) {
        industry = line.split(/:\s*(.+)/)[1] || line;
      } else if (lowerLine.includes("products") || lowerLine.includes("3.")) {
        products = line.split(/:\s*(.+)/)[1] || line;
      } else if (lowerLine.includes("target market:") || lowerLine.includes("4.")) {
        targetMarket = line.split(/:\s*(.+)/)[1] || line;
      }
    }

    return {
      companyDescription: companyDescription || answer.substring(0, 200),
      industry: industry || "Not specified",
      products: products || "Not specified",
      targetMarket: targetMarket || "Not specified",
      citations,
    };
  } catch (error) {
    console.error("Error searching structured company info:", error);
    throw error;
  }
}

/**
 * Generic Perplexity search function
 * Can be used for any web search query
 */
export async function perplexitySearch(query: string): Promise<PerplexitySearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured in environment variables");
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      answer: data.choices?.[0]?.message?.content || "No information found",
      citations: data.citations || [],
      rawResponse: data,
    };
  } catch (error) {
    console.error("Error with Perplexity search:", error);
    throw error;
  }
}
