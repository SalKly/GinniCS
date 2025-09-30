import type { NextApiRequest, NextApiResponse } from "next";
import { searchCompanyInfo, searchStructuredCompanyInfo } from "../../services/perplexitySearch";

interface SearchCompanyRequest {
  companyName: string;
  companyWebsite?: string;
  structured?: boolean; // Whether to return structured data
}

interface SearchCompanyResponse {
  success: boolean;
  data?: {
    answer: string;
    citations: string[];
    structured?: {
      companyDescription: string;
      industry: string;
      products: string;
      targetMarket: string;
    };
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SearchCompanyResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { companyName, companyWebsite, structured = false }: SearchCompanyRequest = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: "Company name is required" });
    }

    if (structured) {
      // Get structured company information
      const result = await searchStructuredCompanyInfo(companyName, companyWebsite);

      return res.status(200).json({
        success: true,
        data: {
          answer: `Company Description: ${result.companyDescription}\nIndustry: ${result.industry}\nProducts/Services: ${result.products}\nTarget Market: ${result.targetMarket}`,
          citations: result.citations,
          structured: {
            companyDescription: result.companyDescription,
            industry: result.industry,
            products: result.products,
            targetMarket: result.targetMarket,
          },
        },
      });
    } else {
      // Get general company information
      const result = await searchCompanyInfo(companyName, companyWebsite);

      return res.status(200).json({
        success: true,
        data: {
          answer: result.answer,
          citations: result.citations,
        },
      });
    }
  } catch (error) {
    console.error("Error searching company:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to search company information",
    });
  }
}
