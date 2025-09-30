import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import BlueprintFlow from "../../components/blueprint/BlueprintFlow";
import type { BlueprintData } from "../../models/blueprint";
import { fetchBlueprint } from "../../services/blueprints";
import { supabase } from "../../../utils/supabase";

export default function TreePage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BlueprintData | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        // Try to fetch from new forms table first
        const { data: formData, error: formError } = await supabase.from("forms").select("form_data").eq("id", id).single();

        if (!cancelled) {
          if (formData && !formError) {
            setData(formData.form_data);
          } else {
            // Fallback to legacy blueprints table
            try {
              const bp = await fetchBlueprint(id);
              if (bp) {
                setData(bp);
              } else {
                setError("Form not found");
              }
            } catch (legacyError: any) {
              setError("Form not found");
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tree visualization...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tree</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <BlueprintFlow blueprintData={data} onClose={() => router.push("/")} />;
}
