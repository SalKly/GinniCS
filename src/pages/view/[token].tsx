import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../utils/supabase";
import { BlueprintData } from "../../models/blueprint";
import { Tooltip } from "react-tooltip";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import BlueprintFlow to avoid SSR issues
const BlueprintFlow = dynamic(() => import("../../components/blueprint/BlueprintFlow"), {
  ssr: false,
});

const PRIMARY_COLOR = "rgb(84, 22, 123)";

interface ViewLinkData {
  token: string;
  password: string;
  company_name: string;
}

export default function ClientViewPage() {
  const router = useRouter();
  const { token } = router.query;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewLinkData, setViewLinkData] = useState<ViewLinkData | null>(null);
  const [blueprintData, setBlueprintData] = useState<BlueprintData | null>(null);
  const [showFlowchart, setShowFlowchart] = useState(false);

  // Check if already authenticated in session
  useEffect(() => {
    if (token) {
      const sessionKey = `auth_${token}`;
      const authenticated = sessionStorage.getItem(sessionKey);
      if (authenticated === "true") {
        loadData();
      }
    }
  }, [token]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load view link data
      const { data: linkData, error: linkError } = await supabase.from("view_links").select("*").eq("token", token).single();

      if (linkError || !linkData) {
        setError("Invalid or expired link");
        return;
      }

      setViewLinkData(linkData);

      // Load blueprint data for this company
      const { data: companyData, error: companyError } = await supabase.from("companies").select("id").eq("name", linkData.company_name).single();

      if (companyError || !companyData) {
        setError("Company not found");
        return;
      }

      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("form_data")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (formError || !formData) {
        setError("Blueprint data not found");
        return;
      }

      setBlueprintData(formData.form_data);
      setIsAuthenticated(true);

      // Save to session
      const sessionKey = `auth_${token}`;
      sessionStorage.setItem(sessionKey, "true");
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load blueprint data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: dbError } = await supabase.from("view_links").select("password").eq("token", token).single();

      if (dbError || !data) {
        setError("Invalid or expired link");
        setIsLoading(false);
        return;
      }

      if (data.password === passwordInput.trim()) {
        await loadData();
      } else {
        setError("Incorrect password. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Password Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 p-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl">
              <Image src="/GA_Logo_On-purple.png" alt="Ginni Logo" width={100} height={100} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Blueprint Access</h1>
            <p className="text-gray-600">Enter your password to view the blueprint</p>
          </div>

          {/* Password Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-key mr-2 text-purple-600"></i>
                  Password
                </label>
                <input
                  id="password"
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-center text-lg font-bold tracking-widest"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800 text-sm">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-lock-open"></i>
                    Access Blueprint
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <i className="fas fa-shield-alt mr-1"></i>
            This is a secure, read-only view
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading || !blueprintData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
          <p className="text-gray-600">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Main Blueprint View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Tooltip id="info-tooltip" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-md">
                <Image src="/GA_Logo_On-purple.png" alt="Ginni Logo" width={40} height={40} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ginni X <span style={{ color: PRIMARY_COLOR }}>{viewLinkData?.company_name || blueprintData?.businessInfo?.businessName}</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">Professional Call Scoring Blueprint</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Introduction Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-handshake" style={{ color: PRIMARY_COLOR }}></i>
              About This Blueprint
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Building an effective scorecard is a <strong>collaborative effort</strong> between Ginni and your team. Our goal is to provide you with
              the <strong>highest quality</strong> call evaluation system that truly reflects your business objectives and customer interactions.
            </p>
            <p className="text-gray-600 mt-4">
              This blueprint contains comprehensive guidelines for evaluating calls across different outcomes, with detailed scorecards, customer
              insights, and common objections to help your team succeed.
            </p>
          </div>
        </section>

        {/* Understanding the Blueprint - Explanatory Section */}
        <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <i className="fas fa-book-open" style={{ color: PRIMARY_COLOR }}></i>
            Understanding the Blueprint Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Call Outcomes */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-sitemap text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Call Outcomes</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Different paths or results that can occur during customer interactions. Each outcome represents a specific scenario (e.g., "Sale
                    Made", "Follow-up Required") and has its own set of evaluation criteria.
                  </p>
                </div>
              </div>
            </div>

            {/* Scorecards */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clipboard-check text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Scorecards</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Evaluation criteria used to assess call quality and agent performance. Scorecards help ensure consistent evaluation across all
                    calls and provide actionable feedback for improvement.
                  </p>
                </div>
              </div>
            </div>

            {/* Playbook Checks (Yes/No) */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check-circle text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Playbook Checks (Yes/No)</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Binary evaluation criteria that check whether specific actions were performed or requirements were met. These are straightforward
                    "Did the agent do X?" questions (e.g., "Did the agent greet the customer?").
                  </p>
                </div>
              </div>
            </div>

            {/* Skills (Score 1-5) */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-star text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Skills (Score 1-5)</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Qualitative evaluation criteria rated on a 1-5 scale. These assess the quality of execution (e.g., "How well did the agent handle
                    objections?" with 1 being poor and 5 being excellent).
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Insights */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-cyan-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lightbulb text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Customer Insights</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Key observations and patterns about customer behavior, preferences, and expectations. These insights help your team better
                    understand and serve your customers effectively.
                  </p>
                </div>
              </div>
            </div>

            {/* Common Objections */}
            <div className="bg-white rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-amber-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Common Objections</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Typical concerns, questions, or hesitations customers express during calls. Understanding these helps agents prepare effective
                    responses and handle customer concerns confidently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call Outcomes Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <i className="fas fa-sitemap" style={{ color: PRIMARY_COLOR }}></i>
            Call Outcomes
            <i
              className="fas fa-info-circle text-gray-400 text-sm cursor-help ml-2"
              data-tooltip-id="info-tooltip"
              data-tooltip-content="These are all possible outcomes that can occur during a call. Each outcome has specific scorecards to evaluate performance."
            ></i>
          </h2>
          <p className="text-gray-600 mb-6">
            Below are all the possible call outcomes in this blueprint. Each outcome represents a different path or result during customer
            interactions.
          </p>
          <CallOutcomesList blueprintData={blueprintData} />
        </section>

        {/* Scorecards Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <i className="fas fa-clipboard-check" style={{ color: PRIMARY_COLOR }}></i>
            Scorecards
            <i
              className="fas fa-info-circle text-gray-400 text-sm cursor-help ml-2"
              data-tooltip-id="info-tooltip"
              data-tooltip-content="Scorecards are used to evaluate call quality. Playbook checks are yes/no criteria, while Skills are rated on a 1-5 scale."
            ></i>
          </h2>
          <p className="text-gray-600 mb-8">
            These scorecards help evaluate call performance systematically. They are organized by sections for better clarity and understanding.
          </p>
          <ScorecardsSection blueprintData={blueprintData} />
        </section>

        {/* View Flowchart Button */}
        <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-purple-200">
          <div className="text-center">
            <i className="fas fa-project-diagram text-5xl mb-4" style={{ color: PRIMARY_COLOR }}></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Interactive Flowchart</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Visualize the complete blueprint structure as an interactive tree diagram. See how all outcomes and scorecards are connected.
            </p>
            <button
              onClick={() => setShowFlowchart(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              <i className="fas fa-eye mr-2"></i>
              View Flowchart
            </button>
          </div>
        </section>

        {/* Customer Insights Section */}
        {blueprintData.customerInsights && blueprintData.customerInsights.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="fas fa-lightbulb" style={{ color: PRIMARY_COLOR }}></i>
              Customer Insights
              <i
                className="fas fa-info-circle text-gray-400 text-sm cursor-help ml-2"
                data-tooltip-id="info-tooltip"
                data-tooltip-content="Key insights about customer behavior and expectations that help improve call outcomes."
              ></i>
            </h2>
            <p className="text-gray-600 mb-6">
              Understanding your customers is crucial. These insights help your team better connect with and serve your clients.
            </p>
            <InsightsList insights={blueprintData.customerInsights} />
          </section>
        )}

        {/* Objections Section */}
        {blueprintData.customerObjection && blueprintData.customerObjection.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-amber-600"></i>
              Common Objections
              <i
                className="fas fa-info-circle text-gray-400 text-sm cursor-help ml-2"
                data-tooltip-id="info-tooltip"
                data-tooltip-content="Common customer objections and concerns, along with guidance on how to address them effectively."
              ></i>
            </h2>
            <p className="text-gray-600 mb-6">
              Be prepared for common customer concerns. Understanding objections helps your team respond confidently and effectively.
            </p>
            <ObjectionsList objections={blueprintData.customerObjection} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Ginni. All rights reserved.</p>
          <p className="mt-2">This is a secure, read-only view of your blueprint.</p>
        </footer>
      </main>

      {/* Flowchart Modal - Full Screen */}
      {showFlowchart && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFlowchart(false);
            }
          }}
        >
          <div className="w-full h-full bg-white">
            <BlueprintFlow blueprintData={blueprintData} onClose={() => setShowFlowchart(false)} readOnly={true} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function CallOutcomesList({ blueprintData }: { blueprintData: BlueprintData }) {
  const allOutcomes: Array<{ name: string; description: string }> = [];

  const collectOutcomes = (node: any, isRoot = false) => {
    if (!isRoot) {
      allOutcomes.push({
        name: node.nodeName,
        description: node.nodeDescription,
      });
    }
    if (node.nestedNodes && Array.isArray(node.nestedNodes)) {
      node.nestedNodes.forEach((child: any) => collectOutcomes(child));
    }
  };

  collectOutcomes(blueprintData, true);

  return (
    <div className="space-y-4">
      {allOutcomes.map((outcome, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-all">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</span>
            {outcome.name}
          </h3>
          <div className="text-gray-600 leading-relaxed ml-10" dangerouslySetInnerHTML={{ __html: outcome.description }} />
        </div>
      ))}
    </div>
  );
}

function ScorecardsSection({ blueprintData }: { blueprintData: BlueprintData }) {
  const sections = blueprintData.scorecardSections || [];

  // Collect all scorecards grouped by section, with their related call outcomes
  const scorecardsBySection: Record<
    string,
    {
      boolean: Array<{ scorecard: any; outcomes: string[] }>;
      variable: Array<{ scorecard: any; outcomes: string[] }>;
    }
  > = {};

  // Map to track unique scorecards and their outcomes
  const scorecardMap = new Map<string, { scorecard: any; outcomes: Set<string>; type: "boolean" | "variable" }>();

  const collectScorecards = (node: any, outcomeName?: string) => {
    const currentOutcome = outcomeName || node.nodeName || "Root";

    // Process boolean scorecards
    if (node.booleanScoreCard && Array.isArray(node.booleanScoreCard)) {
      node.booleanScoreCard.forEach((sc: any) => {
        const key = `boolean_${sc.name}`;
        if (!scorecardMap.has(key)) {
          scorecardMap.set(key, {
            scorecard: sc,
            outcomes: new Set([currentOutcome]),
            type: "boolean",
          });
        } else {
          scorecardMap.get(key)!.outcomes.add(currentOutcome);
        }
      });
    }

    // Process variable scorecards
    if (node.variableScoreCard && Array.isArray(node.variableScoreCard)) {
      node.variableScoreCard.forEach((sc: any) => {
        const key = `variable_${sc.name}`;
        if (!scorecardMap.has(key)) {
          scorecardMap.set(key, {
            scorecard: sc,
            outcomes: new Set([currentOutcome]),
            type: "variable",
          });
        } else {
          scorecardMap.get(key)!.outcomes.add(currentOutcome);
        }
      });
    }

    // Recurse into nested nodes
    if (node.nestedNodes && Array.isArray(node.nestedNodes)) {
      node.nestedNodes.forEach((child: any) => collectScorecards(child, child.nodeName));
    }
  };

  collectScorecards(blueprintData);

  // Organize scorecards by section
  scorecardMap.forEach((value, key) => {
    const { scorecard, outcomes, type } = value;
    const sectionId = scorecard.sectionId || "unsorted";

    if (!scorecardsBySection[sectionId]) {
      scorecardsBySection[sectionId] = { boolean: [], variable: [] };
    }

    const outcomesArray = Array.from(outcomes).filter((o) => o !== "Root");

    if (type === "boolean") {
      scorecardsBySection[sectionId].boolean.push({
        scorecard,
        outcomes: outcomesArray,
      });
    } else {
      scorecardsBySection[sectionId].variable.push({
        scorecard,
        outcomes: outcomesArray,
      });
    }
  });

  return (
    <div className="space-y-8">
      {sections.length > 0 ? (
        sections.map((section) => {
          const scorecards = scorecardsBySection[section.id];
          if (!scorecards || (scorecards.boolean.length === 0 && scorecards.variable.length === 0)) {
            return null;
          }

          return (
            <div key={section.id} className="border-2 border-purple-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                <h3 className="text-xl font-bold">{section.name}</h3>
                {section.description && <p className="text-purple-100 text-sm mt-1">{section.description}</p>}
              </div>
              <div className="p-6 bg-white space-y-6">
                {/* Boolean Scorecards */}
                {scorecards.boolean.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <i className="fas fa-check-circle text-blue-600"></i>
                      Playbook Checks (Yes/No)
                    </h4>
                    <div className="space-y-3">
                      {scorecards.boolean.map((item, idx) => (
                        <ScorecardCard key={idx} scorecard={item.scorecard} outcomes={item.outcomes} type="boolean" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Variable Scorecards */}
                {scorecards.variable.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <i className="fas fa-star text-amber-500"></i>
                      Skills (Score 1-5)
                    </h4>
                    <div className="space-y-3">
                      {scorecards.variable.map((item, idx) => (
                        <ScorecardCard key={idx} scorecard={item.scorecard} outcomes={item.outcomes} type="variable" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        // Show unsorted scorecards if no sections
        <div className="space-y-6">
          {scorecardsBySection["unsorted"] && (
            <>
              {scorecardsBySection["unsorted"].boolean.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-check-circle text-blue-600"></i>
                    Playbook Checks (Yes/No)
                  </h4>
                  <div className="space-y-3">
                    {scorecardsBySection["unsorted"].boolean.map((item, idx) => (
                      <ScorecardCard key={idx} scorecard={item.scorecard} outcomes={item.outcomes} type="boolean" />
                    ))}
                  </div>
                </div>
              )}

              {scorecardsBySection["unsorted"].variable.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-star text-amber-500"></i>
                    Skills (Score 1-5)
                  </h4>
                  <div className="space-y-3">
                    {scorecardsBySection["unsorted"].variable.map((item, idx) => (
                      <ScorecardCard key={idx} scorecard={item.scorecard} outcomes={item.outcomes} type="variable" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScorecardCard({ scorecard, outcomes, type }: { scorecard: any; outcomes: string[]; type: "boolean" | "variable" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === "boolean" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
            }`}
          >
            <i className={type === "boolean" ? "fas fa-check" : "fas fa-star"}></i>
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-1">{scorecard.name}</h5>
            {/* Show outcome names in collapsed view */}
            {outcomes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {outcomes.map((outcome, idx) => (
                  <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">
                    {outcome}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <i className={`fas fa-chevron-${isExpanded ? "up" : "down"} text-gray-400`}></i>
      </button>

      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
          {/* Call Phases - only shown when expanded */}
          {scorecard.callPhases && scorecard.callPhases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {scorecard.callPhases.map((phase: string, idx: number) => (
                <span key={`phase-${idx}`} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                  {phase}
                </span>
              ))}
            </div>
          )}

          {/* Description without label */}
          <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: scorecard.description }} />

          {type === "variable" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Score Guide</p>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {num}
                    </span>
                    <p className="text-sm text-gray-600 flex-1">
                      <span dangerouslySetInnerHTML={{ __html: scorecard[`score${num}Desc`] || "—" }} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsightsList({ insights }: { insights: Array<{ name: string; description: string }> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {insights.map((insight, index) => (
        <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-lightbulb"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">{insight.name}</h4>
              <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.description }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectionsList({ objections }: { objections: Array<{ name: string; description: string }> }) {
  return (
    <div className="space-y-4">
      {objections.map((objection, index) => (
        <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">{objection.name}</h4>
              <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: objection.description }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
