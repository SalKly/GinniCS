import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { BlueprintForm } from "../../../components/blueprint/BlueprintForm";
import { getCompanyByName, getCompanyForm } from "../../../services/companies";
import type { CompanyForm } from "../../../services/companies";

export default function EditFormPage() {
  const router = useRouter();
  const { companyName } = router.query as { companyName?: string };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingForm, setExistingForm] = useState<CompanyForm | null>(null);

  useEffect(() => {
    if (!companyName) return;

    loadExistingForm();
  }, [companyName]);

  const loadExistingForm = async () => {
    try {
      setLoading(true);
      setError(null);

      const company = await getCompanyByName(decodeURIComponent(companyName!));
      if (!company) {
        setError("Company not found");
        return;
      }

      const form = await getCompanyForm(company.id);
      setExistingForm(form);
    } catch (err: any) {
      console.error("Error loading form:", err);
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Form</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <BlueprintForm mode="edit" companyName={decodeURIComponent(companyName!)} existingForm={existingForm} />;
}
