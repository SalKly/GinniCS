import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../utils/supabase";

// Generate a random alphanumeric token
function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate a secure-looking password (8 characters: 4 letters + 4 numbers)
function generatePassword(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let password = "";

  // Add 4 random letters
  for (let i = 0; i < 4; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Add 4 random numbers
  for (let i = 0; i < 4; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { companyName } = req.body;

    console.log("Generate view link request for company:", companyName);

    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }

    // Verify that the company exists
    const { data: companyData, error: companyError } = await supabase.from("companies").select("name").eq("name", companyName).single();

    if (companyError) {
      console.error("Company lookup error:", companyError);
      return res.status(404).json({
        error: `Company not found: ${companyName}. Please make sure the blueprint is saved first.`,
      });
    }

    if (!companyData) {
      console.error("Company not found:", companyName);
      return res.status(404).json({
        error: `Company "${companyName}" not found. Please save the blueprint first before generating a view link.`,
      });
    }

    // Generate unique token and password
    const token = generateToken(32);
    const password = generatePassword();

    console.log("Creating view link with token:", token);

    // Insert into view_links table
    const { data, error } = await supabase
      .from("view_links")
      .insert({
        token,
        password,
        company_name: companyName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating view link:", error);
      return res.status(500).json({
        error: `Failed to create view link: ${error.message}`,
      });
    }

    // Generate the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    const viewUrl = `${baseUrl}/view/${token}`;

    console.log("View link created successfully:", viewUrl);

    return res.status(200).json({
      success: true,
      token,
      password,
      viewUrl,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Error in generate-view-link API:", error);
    return res.status(500).json({
      error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
