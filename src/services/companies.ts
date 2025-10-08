import { supabase } from "../../utils/supabase";
import type { BlueprintData } from "../models/blueprint";

export interface Company {
  id: string;
  name: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyForm {
  id: string;
  company_id: string;
  form_data: BlueprintData;
  tree_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithForm extends Company {
  form?: CompanyForm;
}

// Company CRUD operations
export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*").ilike("name", `%${searchTerm}%`).order("name");

  if (error) {
    throw error;
  }

  return data as Company[];
}

export async function getAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*").order("name");

  if (error) {
    throw error;
  }

  return data as Company[];
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error;
  }

  return data as Company;
}

export async function getCompanyByName(name: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("name", name).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error;
  }

  return data as Company;
}

export async function createCompany(name: string, website?: string): Promise<Company> {
  const { data, error } = await supabase.from("companies").insert({ name, website }).select().single();

  if (error) {
    throw error;
  }

  return data as Company;
}

export async function updateCompany(id: string, updates: { name?: string; website?: string }): Promise<Company> {
  const { data, error } = await supabase.from("companies").update(updates).eq("id", id).select().single();

  if (error) {
    throw error;
  }

  return data as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

// Form CRUD operations
export async function getCompanyForm(companyId: string): Promise<CompanyForm | null> {
  const { data, error } = await supabase.from("forms").select("*").eq("company_id", companyId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error;
  }

  return data as CompanyForm;
}

export async function createForm(companyId: string, formData: BlueprintData): Promise<CompanyForm> {
  // Generate tree URL based on form ID (will be updated after insert)
  const { data, error } = await supabase
    .from("forms")
    .insert({
      company_id: companyId,
      form_data: formData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update with tree URL
  const treeUrl = `/tree/${data.id}`;
  const { data: updatedData, error: updateError } = await supabase.from("forms").update({ tree_url: treeUrl }).eq("id", data.id).select().single();

  if (updateError) {
    throw updateError;
  }

  return updatedData as CompanyForm;
}

export async function updateForm(formId: string, formData: BlueprintData): Promise<CompanyForm> {
  const { data, error } = await supabase.from("forms").update({ form_data: formData }).eq("id", formId).select().single();

  if (error) {
    throw error;
  }

  return data as CompanyForm;
}

export async function deleteForm(formId: string): Promise<void> {
  const { error } = await supabase.from("forms").delete().eq("id", formId);

  if (error) {
    throw error;
  }
}

// Combined operations
export async function getCompanyWithForm(companyId: string): Promise<CompanyWithForm | null> {
  const company = await getCompanyById(companyId);
  if (!company) {
    return null;
  }

  const form = await getCompanyForm(companyId);

  return {
    ...company,
    form: form || undefined,
  };
}

export async function getCompaniesWithForms(): Promise<CompanyWithForm[]> {
  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      forms:forms(*)
    `
    )
    .order("name");

  if (error) {
    throw error;
  }

  return data.map((company) => ({
    ...company,
    form: company.forms?.[0] || undefined,
  })) as CompanyWithForm[];
}

// Utility function to remove duplicates from arrays based on name and description
function removeDuplicates<T extends { name: string; description: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  items.forEach((item) => {
    const key = `${item.name}|||${item.description}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  });
  return Array.from(seen.values());
}

// Utility function to remove duplicates from blueprint data
function deduplicateBlueprintData(formData: BlueprintData): BlueprintData {
  return {
    ...formData,
    booleanScoreCard: removeDuplicates(formData.booleanScoreCard || []),
    variableScoreCard: removeDuplicates(formData.variableScoreCard || []),
    customerInsights: removeDuplicates(formData.customerInsights || []),
    customerObjection: removeDuplicates(formData.customerObjection || []),
    scorecardSections: formData.scorecardSections || [], // Preserve scorecard sections (no deduplication needed as they have unique IDs)
    nestedNodes: (formData.nestedNodes || []).map((node) => ({
      ...node,
      booleanScoreCard: removeDuplicates(node.booleanScoreCard || []),
      variableScoreCard: removeDuplicates(node.variableScoreCard || []),
      customerInsights: removeDuplicates(node.customerInsights || []),
      customerObjection: removeDuplicates(node.customerObjection || []),
      nestedNodes: (node.nestedNodes || []).map((nested) => ({
        ...nested,
        booleanScoreCard: removeDuplicates(nested.booleanScoreCard || []),
        variableScoreCard: removeDuplicates(nested.variableScoreCard || []),
        customerInsights: removeDuplicates(nested.customerInsights || []),
        customerObjection: removeDuplicates(nested.customerObjection || []),
      })),
    })),
  };
}

// Utility function to sanitize form data before saving (remove file objects)
function sanitizeFormData(formData: BlueprintData): BlueprintData {
  const safeBusinessInfo = formData.businessInfo ? { ...formData.businessInfo, qaManualFile: null } : undefined;
  return {
    ...formData,
    businessInfo: safeBusinessInfo,
    scorecardSections: formData.scorecardSections || [], // Explicitly preserve scorecard sections
  };
}

// Create or update company and form together
export async function createOrUpdateCompanyForm(
  companyName: string,
  formData: BlueprintData,
  website?: string
): Promise<{ company: Company; form: CompanyForm }> {
  // Sanitize before saving (only remove file objects, no deduplication)
  const sanitizedFormData = sanitizeFormData(formData);

  // Check if company exists
  let company = await getCompanyByName(companyName);

  if (!company) {
    // Create new company
    company = await createCompany(companyName, website);
  }

  // Check if form exists for this company
  let form = await getCompanyForm(company.id);

  if (form) {
    // Update existing form
    form = await updateForm(form.id, sanitizedFormData);
  } else {
    // Create new form
    form = await createForm(company.id, sanitizedFormData);
  }

  return { company, form };
}

// Save partial form progress (for auto-save functionality)
export async function saveFormProgress(
  companyName: string,
  partialFormData: Partial<BlueprintData>,
  website?: string
): Promise<{ company: Company; form: CompanyForm }> {
  // Check if company exists
  let company = await getCompanyByName(companyName);

  if (!company) {
    // Create new company
    company = await createCompany(companyName, website);
  }

  // Check if form exists for this company
  let existingForm = await getCompanyForm(company.id);

  let mergedFormData: BlueprintData;

  if (existingForm) {
    // Merge with existing data
    mergedFormData = {
      ...existingForm.form_data,
      ...partialFormData,
      // Ensure business info is properly merged
      businessInfo: partialFormData.businessInfo
        ? {
            ...existingForm.form_data.businessInfo,
            ...partialFormData.businessInfo,
          }
        : existingForm.form_data.businessInfo,
      // Ensure scorecard sections are properly merged (prefer new data if provided)
      scorecardSections:
        partialFormData.scorecardSections !== undefined ? partialFormData.scorecardSections : existingForm.form_data.scorecardSections || [],
    };
  } else {
    // Create new form data with defaults
    mergedFormData = {
      nodeName: partialFormData.nodeName || "All outcomes",
      nodeDescription: partialFormData.nodeDescription || "General criteria for all calls",
      customerInsights: partialFormData.customerInsights || [],
      customerObjection: partialFormData.customerObjection || [],
      booleanScoreCard: partialFormData.booleanScoreCard || [],
      variableScoreCard: partialFormData.variableScoreCard || [],
      nestedNodes: partialFormData.nestedNodes || [],
      scorecardSections: partialFormData.scorecardSections || [], // Preserve scorecard sections
      businessInfo: {
        businessName: companyName,
        businessGoals: "",
        companyWebsite: "",
        qaManualFile: null,
        qaManualFileName: "",
        ...partialFormData.businessInfo,
      },
    };
  }

  // Sanitize before saving (only remove file objects, no deduplication)
  const sanitizedFormData = sanitizeFormData(mergedFormData);

  let form: CompanyForm;
  if (existingForm) {
    // Update existing form
    form = await updateForm(existingForm.id, sanitizedFormData);
  } else {
    // Create new form
    form = await createForm(company.id, sanitizedFormData);
  }

  return { company, form };
}

// Load form progress for a company
export async function loadFormProgress(companyName: string): Promise<BlueprintData | null> {
  const company = await getCompanyByName(companyName);
  if (!company) {
    return null;
  }

  const form = await getCompanyForm(company.id);
  return form?.form_data || null;
}
