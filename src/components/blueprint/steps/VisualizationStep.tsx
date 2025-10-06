import React, { useState } from "react";
import { Control } from "react-hook-form";
import { Button } from "primereact/button";
import BlueprintFlow from "../BlueprintFlow";
import { BlueprintData } from "../../../models/blueprint";

interface VisualizationStepProps {
  control: Control<any>;
  formData: BlueprintData;
}

export function VisualizationStep({ control, formData }: VisualizationStepProps) {
  const [showTreeFullScreen, setShowTreeFullScreen] = useState(false);

  return (
    <>
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
                Preview your complete blueprint structure as an interactive tree diagram. Nodes represent outcomes, and scorecards are displayed
                beneath each node. Click the button below to view your tree in full screen.
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
                Click the button below to view your interactive blueprint tree in full screen. Explore your outcomes structure and review all
                scorecards in an immersive visualization.
              </p>
            </div>

            <Button
              type="button"
              label="View Blueprint Tree"
              icon="fas fa-expand"
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
            />

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Interactive</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Full Screen</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Zoomable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Hint */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-arrow-right text-green-600 text-lg"></i>
            <p className="text-green-800 text-sm">
              <strong>Ready to continue?</strong> After viewing your tree, click "Next Step" below to add customer insights to your blueprint.
            </p>
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
