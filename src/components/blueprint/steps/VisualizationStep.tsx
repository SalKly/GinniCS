import React, { useState } from "react";
import { Control, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import BlueprintFlow from "../BlueprintFlow";
import { BlueprintData } from "../../../models/blueprint";
import { generateAndDownloadBlueprintPDF } from "../../../services/pdfGenerator";

interface VisualizationStepProps {
  control: Control<any>;
  formData: BlueprintData;
}

export function VisualizationStep({ control, formData }: VisualizationStepProps) {
  const [showTreeFullScreen, setShowTreeFullScreen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [viewLinkData, setViewLinkData] = useState<{
    viewUrl: string;
    password: string;
  } | null>(null);
  const toast = useRef<Toast>(null);

  // Watch the entire form data to get flat structure (scorecards, insights, objections)
  const flatFormData = useWatch({ control });

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    toast.current?.show({
      severity: "info",
      summary: "Generating PDF",
      detail: "Please wait while we generate your blueprint PDF...",
      life: 3000,
    });

    try {
      await generateAndDownloadBlueprintPDF(formData, flatFormData);

      toast.current?.show({
        severity: "success",
        summary: "PDF Downloaded",
        detail: "Your blueprint PDF has been downloaded successfully!",
        life: 3000,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.current?.show({
        severity: "error",
        summary: "PDF Generation Failed",
        detail: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        life: 5000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateViewLink = async () => {
    setIsGeneratingLink(true);
    toast.current?.show({
      severity: "info",
      summary: "Generating Link",
      detail: "Creating your client view link...",
      life: 3000,
    });

    try {
      const response = await fetch("/api/generate-view-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.businessInfo?.businessName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate view link");
      }

      setViewLinkData({
        viewUrl: data.viewUrl,
        password: data.password,
      });

      toast.current?.show({
        severity: "success",
        summary: "Link Generated",
        detail: "Your client view link has been created successfully!",
        life: 3000,
      });
    } catch (error) {
      console.error("View link generation failed:", error);
      toast.current?.show({
        severity: "error",
        summary: "Generation Failed",
        detail: error instanceof Error ? error.message : "Failed to generate view link. Please try again.",
        life: 5000,
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.current?.show({
      severity: "success",
      summary: "Copied!",
      detail: `${label} copied to clipboard`,
      life: 2000,
    });
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-project-diagram text-white text-xl"></i>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Visualize Your Blueprint Tree</h2>
              <p className="text-gray-700 leading-relaxed">
                Review your complete blueprint structure as an interactive tree diagram. This is your final step! Nodes represent outcomes, and
                scorecards are displayed beneath each node. Click the button below to view your tree in full screen.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-blue-600 text-lg mt-0.5"></i>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">What You'll See in the Tree Visualization</h3>
              <ul className="space-y-1.5 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                  <span>
                    <strong>Nodes</strong> (purple/white cards) represent your call outcomes and sub-outcomes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                  <span>
                    <strong>Scorecards</strong> (blue/green cards) appear directly under each node showing Yes/No and Score evaluations
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                  <span>
                    <strong>Click any card</strong> to view its full details in the right-side panel
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                  <span>
                    <strong>Zoom and pan</strong> using the controls at the bottom-left corner
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action - Large Button */}
        <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden shadow-lg">
          <div className="p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <i className="fas fa-sitemap text-white text-4xl"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Your Blueprint is Ready!</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                View your interactive blueprint tree or download a comprehensive PDF report with all your outcomes, scorecards, insights, and
                objections.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                type="button"
                className="p-button-lg"
                style={{
                  background: "linear-gradient(135deg, rgb(109, 40, 217) 0%, rgb(88, 28, 135) 100%)",
                  border: "none",
                  padding: "1rem 3rem",
                  fontSize: "1.125rem",
                  fontWeight: "700",
                  boxShadow: "0 10px 25px rgba(109, 40, 217, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onClick={() => setShowTreeFullScreen(true)}
              >
                <i className="fas fa-expand mr-2"></i>
                View Blueprint Tree
              </Button>

              <Button
                type="button"
                className="p-button-lg p-button-success"
                style={{
                  background: "linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)",
                  border: "none",
                  padding: "1rem 3rem",
                  fontSize: "1.125rem",
                  fontWeight: "700",
                  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                loading={isGeneratingPDF}
              >
                <i className="fas fa-file-pdf mr-2"></i>
                {isGeneratingPDF ? "Generating PDF..." : "Download PDF Report"}
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Interactive Tree</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>PDF Export</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Comprehensive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Hint */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-check-circle text-green-600 text-lg"></i>
            <p className="text-green-800 text-sm">
              <strong>Final Step!</strong> After viewing your tree visualization, click "Complete Blueprint" below to finalize and save your
              onboarding blueprint.
            </p>
          </div>
        </div>

        {/* Generate View Link Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 overflow-hidden shadow-lg">
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-share-alt text-white text-2xl"></i>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Share with Client</h3>
                <p className="text-gray-700 leading-relaxed">
                  Generate a professional, read-only link to share your blueprint with clients. The link includes password protection for security.
                </p>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Note:</strong> Make sure to complete and save your blueprint first by clicking "Complete Blueprint" below.
                </div>
              </div>
            </div>

            {!viewLinkData ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  className="p-button-lg"
                  style={{
                    background: "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)",
                    border: "none",
                    padding: "1rem 2.5rem",
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  onClick={handleGenerateViewLink}
                  disabled={isGeneratingLink}
                  loading={isGeneratingLink}
                >
                  <i className="fas fa-link mr-2"></i>
                  {isGeneratingLink ? "Generating..." : "Generate Client View Link"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Link Display */}
                <div className="bg-white rounded-lg border border-indigo-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-link mr-2 text-indigo-600"></i>
                    Client View Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={viewLinkData.viewUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(viewLinkData.viewUrl, "Link")}
                      style={{
                        background: "#4F46E5",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>

                {/* Password Display */}
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-key mr-2 text-purple-600"></i>
                    Access Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={viewLinkData.password}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-lg font-bold text-center tracking-widest"
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(viewLinkData.password, "Password")}
                      style={{
                        background: "#7C3AED",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-amber-600 text-lg mt-0.5"></i>
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Share these with your client:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Send the <strong>link</strong> to your client
                        </li>
                        <li>
                          Share the <strong>password</strong> separately for security
                        </li>
                        <li>The password will be required to access the blueprint</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Regenerate Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    className="p-button-outlined"
                    onClick={handleGenerateViewLink}
                    disabled={isGeneratingLink}
                    loading={isGeneratingLink}
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Generate New Link & Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Tree Overlay */}
      {showTreeFullScreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-center justify-center animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTreeFullScreen(false);
            }
          }}
        >
          <div className="w-full h-full bg-white shadow-2xl transform transition-all duration-300 ease-in-out">
            <BlueprintFlow blueprintData={formData} onClose={() => setShowTreeFullScreen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
