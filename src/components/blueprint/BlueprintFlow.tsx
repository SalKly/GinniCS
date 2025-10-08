import React, { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { BlueprintData, NestedNode } from "../../models/blueprint";
import { downloadFlattenedOutcomes } from "../../utils/outcomeFlattener";
import { generateCallOutcomePrompts, downloadCallOutcomePrompts } from "../../services/promptGenerator";

/**
 * Visual goals
 * - Vertical (top→bottom) tree layout (true tree, centered children)
 * - Clear, breathable node cards with brand accent (primary: rgb(84, 22, 123))
 * - Section/accordion details in the side panel (NO tables)
 * - Small-screen friendly (panel overlays)
 */

// ------------------------------
// Visual constants
// ------------------------------
const PRIMARY = "rgb(84, 22, 123)";
const SOFT_PRIMARY = "#F4ECFF"; // very soft tint

// ------------------------------
// Helpers & layout (TOP → BOTTOM) — tree-like layout
// ------------------------------
const NODE_WIDTH = 300; // width of regular nodes
const SCORECARD_WIDTH = 220; // width of each scorecard (increased for section labels)
const SCORECARD_H_GAP = 60; // fixed horizontal gap between adjacent scorecards
const MIN_NODE_H_SPACING = 150; // minimum horizontal spacing between nodes (when no scorecards)
const V_SPACING_BASE = 250; // base vertical spacing between levels (without scorecards)
const V_SPACING_WITH_SCORECARDS = 450; // additional vertical spacing when node has scorecards
const SCORECARD_V_OFFSET = 220; // large vertical offset from node to its scorecards (clear hierarchy)

let _id = 0;
const newId = () => `n${++_id}`;

function collectCounts(payload: NestedNode) {
  const ci = payload.customerInsights?.length || 0;
  const co = payload.customerObjection?.length || 0;
  const bs = payload.booleanScoreCard?.length || 0;
  const vs = payload.variableScoreCard?.length || 0;
  return { ci, co, bs, vs };
}

/**
 * Build a true tree layout by computing each subtree's width and
 * centering children under their parent. This avoids the grid-like look
 * and creates a classic top→bottom dendrogram feel.
 */
function buildFlowFromBlueprint(data: BlueprintData) {
  const rootPayload = data;
  const children = Array.isArray(data.nestedNodes) ? data.nestedNodes : [];
  const sections = data.scorecardSections || [];

  // Build a lightweight tree structure we can measure and then place
  function toTree(payload: NestedNode): { payload: NestedNode; children: any[] } {
    return {
      payload,
      children: Array.isArray(payload.nestedNodes) ? payload.nestedNodes.map(toTree) : [],
    };
  }

  const virtualRoot = {
    payload: rootPayload,
    children: children.map(toTree),
  };

  // First pass: measure subtree width in pixels
  // Calculate actual space needed based on node width, scorecards, and spacing
  function measure(node: any) {
    const booleanScorecards = node.payload.booleanScoreCard || [];
    const variableScorecards = node.payload.variableScoreCard || [];
    const scorecardCount = booleanScorecards.length + variableScorecards.length;

    // Calculate width needed for this node's scorecards
    // Width = (numCards × cardWidth) + ((numCards - 1) × gap between cards)
    let nodeContentWidth = NODE_WIDTH;
    if (scorecardCount > 0) {
      const scorecardsWidth = scorecardCount * SCORECARD_WIDTH + (scorecardCount - 1) * SCORECARD_H_GAP;
      nodeContentWidth = Math.max(NODE_WIDTH, scorecardsWidth);
    }

    // Add minimum spacing around the node
    const nodeWidthWithSpacing = nodeContentWidth + MIN_NODE_H_SPACING;

    if (!node.children.length) {
      node._width = nodeWidthWithSpacing;
      node._scorecardCount = scorecardCount;
      node._contentWidth = nodeContentWidth;
      return nodeWidthWithSpacing;
    }

    let sum = 0;
    for (const c of node.children) sum += measure(c);
    node._width = Math.max(nodeWidthWithSpacing, sum);
    node._scorecardCount = scorecardCount;
    node._contentWidth = nodeContentWidth;
    return node._width;
  }

  // Pre-pass: determine which depths have scorecards and calculate offsets
  const depthHasScorecards: Map<number, boolean> = new Map();

  function scanForScorecards(node: any, depth: number) {
    if (node._scorecardCount > 0) {
      depthHasScorecards.set(depth, true);
    }
    for (const c of node.children) {
      scanForScorecards(c, depth + 1);
    }
  }

  measure(virtualRoot);
  scanForScorecards(virtualRoot, 0);

  // Calculate cumulative Y positions for each depth
  const depthOffsets: number[] = [0];
  for (let d = 0; d < 20; d++) {
    // Assume max depth of 20
    const currentY = depthOffsets[d];
    const hasScorecardsAtThisDepth = depthHasScorecards.get(d) || false;
    const spacing = hasScorecardsAtThisDepth ? V_SPACING_BASE + V_SPACING_WITH_SCORECARDS : V_SPACING_BASE;
    depthOffsets[d + 1] = currentY + spacing;
  }

  function getYPosition(depth: number): number {
    return depthOffsets[depth] || 0;
  }

  // Second pass: assign absolute positions (working in pixels now)
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  function place(node: any, depth: number, leftX: number, parentId: string | null = null) {
    const id = newId();
    const counts = collectCounts(node.payload);

    // Center this node within its allocated width
    const nodeCenterX = leftX + node._width / 2;
    const x = nodeCenterX;
    const y = getYPosition(depth);

    nodes.push({
      id,
      type: "card",
      position: { x, y },
      data: {
        title: node.payload.nodeName || "Node",
        description: node.payload.nodeDescription || "",
        counts,
        payload: node.payload,
      },
      selectable: true,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 16 },
      });
    }

    // Create scorecard nodes under this node
    const booleanScorecards = node.payload.booleanScoreCard || [];
    const variableScorecards = node.payload.variableScoreCard || [];
    const allScorecards = [
      ...booleanScorecards.map((sc: any) => ({ ...sc, type: "boolean" })),
      ...variableScorecards.map((sc: any) => ({ ...sc, type: "variable" })),
    ];

    const hasScorecards = allScorecards.length > 0;

    if (hasScorecards) {
      const scorecardY = y + SCORECARD_V_OFFSET;

      // Calculate total width of all scorecards with fixed gaps
      const numScorecards = allScorecards.length;
      const totalScorecardsWidth = numScorecards * SCORECARD_WIDTH + (numScorecards - 1) * SCORECARD_H_GAP;

      // Start position to center scorecards under the node
      const startX = x - totalScorecardsWidth / 2;

      allScorecards.forEach((scorecard: any, index: number) => {
        const scorecardId = newId();
        // Each scorecard positioned with fixed gap: startX + (index × (cardWidth + gap))
        const scorecardX = startX + index * (SCORECARD_WIDTH + SCORECARD_H_GAP);

        nodes.push({
          id: scorecardId,
          type: "scorecard",
          position: { x: scorecardX, y: scorecardY },
          data: {
            name: scorecard.name || "Scorecard",
            description: scorecard.description || "",
            scorecardType: scorecard.type,
            scorecard,
            sections, // Pass sections data to scorecard nodes
          },
          selectable: true,
          draggable: false,
        });

        // Connect scorecard to parent node with subtle styling
        edges.push({
          id: `${id}-${scorecardId}`,
          source: id,
          target: scorecardId,
          type: "straight",
          style: { stroke: "#E5E7EB", strokeWidth: 2, strokeDasharray: "8,4" },
          markerEnd: undefined, // No arrow for scorecard connections
        });
      });
    }

    // place children from left to right (in pixels)
    let cursorX = leftX;
    for (const c of node.children) {
      place(c, depth + 1, cursorX, id);
      cursorX += c._width; // advance by child's width in pixels
    }

    return id;
  }

  // Start placement at x=0
  place(virtualRoot, 0, 0, null);

  return { nodes, edges };
}

// Badge component
function Badge({ text, tone = "muted" }: { text: string; tone?: "muted" | "danger" | "primary" }) {
  const styles = {
    base: {
      display: "inline-flex",
      alignItems: "center",
      fontSize: 12,
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid #E5E7EB",
      background: "#F9FAFB",
      color: "#374151",
      lineHeight: 1.2,
      whiteSpace: "nowrap" as const,
    },
    danger: { background: "#FEE2E2", borderColor: "#FECACA", color: "#B91C1C" },
    primary: {
      background: SOFT_PRIMARY,
      borderColor: "#E7D7FF",
      color: PRIMARY,
    },
    muted: {},
  };

  const toneStyle = tone === "danger" ? styles.danger : tone === "primary" ? styles.primary : styles.muted;

  return <span style={{ ...styles.base, ...toneStyle }}>{text}</span>;
}

function truncate(s: string, n = 120) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function stripHtml(html: string): string {
  if (!html) return "";
  // Remove HTML tags for plain text display
  return html.replace(/<[^>]*>/g, "");
}

// Custom node component
function NodeCard({ id, data, selected }: { id: string; data: any; selected: boolean }) {
  const { title, description, counts } = data;
  const hasScorecards = counts.bs + counts.vs > 0;

  return (
    <div
      title={truncate(description, 160)}
      style={{
        width: 300,
        border: selected ? `2px solid ${PRIMARY}` : "1px solid #E5E7EB",
        borderRadius: 16,
        background: "#fff",
        boxShadow: selected ? "0 6px 18px rgba(84,22,123,0.15), 0 1px 2px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.06)",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 800, color: "#111827", fontSize: 14 }}>{title}</div>
      </div>
      {description && <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 10 }}>{truncate(description, 96)}</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: hasScorecards ? 8 : 0 }}>
        {!!counts.bs && <Badge text={`Playbook ${counts.bs}`} tone="primary" />}
        {!!counts.vs && <Badge text={`Skills ${counts.vs}`} />}
      </div>
      {hasScorecards && (
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: 8,
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#6B7280",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 10 }}>📊</span>
          <span>
            {counts.bs + counts.vs} Scorecard{counts.bs + counts.vs !== 1 ? "s" : ""} below
          </span>
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Scorecard node component with distinct styling
function ScorecardCard({ id, data, selected }: { id: string; data: any; selected: boolean }) {
  const { name, description, scorecardType, scorecard, sections } = data;
  const isBooleanType = scorecardType === "boolean";

  // Get section info if sectionId is present
  const sectionInfo = scorecard?.sectionId && sections ? sections.find((s: any) => s.id === scorecard.sectionId) : null;
  const sectionName = sectionInfo?.name || null;

  // Generate a color based on section name, or fallback to type-based colors
  const getSectionColor = (name: string) => {
    if (!name) return isBooleanType ? "#3B82F6" : "#10B981";

    // Simple hash function to generate consistent colors from section names
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate colors in a nice palette range
    const colors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#8B5CF6", // Purple
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#06B6D4", // Cyan
      "#EC4899", // Pink
      "#14B8A6", // Teal
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const borderColor = sectionName ? getSectionColor(sectionName) : isBooleanType ? "#3B82F6" : "#10B981";
  const iconColor = borderColor;
  const bgColor = `${borderColor}15`; // Light tint of the border color
  const icon = isBooleanType ? "✓" : "●";

  return (
    <div
      style={{
        width: 220,
        border: selected ? `2px solid ${borderColor}` : `1.5px solid ${borderColor}`,
        borderLeft: `5px solid ${borderColor}`,
        borderRadius: 12,
        background: bgColor,
        boxShadow: selected ? `0 6px 16px rgba(0,0,0,0.15), 0 0 0 3px ${borderColor}20` : "0 2px 8px rgba(0,0,0,0.1)",
        padding: 12,
        paddingTop: sectionName ? 28 : 12,
        position: "relative",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      {/* Section name at top */}
      {sectionName && (
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            background: borderColor,
            color: "#fff",
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            padding: "6px 12px",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {sectionName}
        </div>
      )}

      {/* Icon and title - NO DESCRIPTION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: sectionName ? 8 : 4,
          paddingRight: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: iconColor,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 12, lineHeight: 1.4, wordWrap: "break-word", overflowWrap: "break-word" }}>
            {name}
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = {
  card: NodeCard,
  scorecard: ScorecardCard,
};

// ------------------------------
// Details panel with tabs + counts (Accordion-based)
// ------------------------------
const TABS = ["Description", "Playbook Checks", "Skills"];

// Simple accordion components
function Accordion({
  items,
  renderTitle,
  renderBody,
  emptyLabel,
}: {
  items: any[];
  renderTitle: (item: any) => React.ReactNode;
  renderBody: (item: any) => React.ReactNode;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(() => new Set<number>());
  if (!items || !items.length) return <div style={{ color: "#6B7280" }}>{emptyLabel}</div>;

  const toggle = (i: number) => {
    setOpen((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <button
            onClick={() => toggle(i)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              background: "#F9FAFB",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{renderTitle(item)}</div>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{open.has(i) ? "−" : "+"}</span>
          </button>
          {open.has(i) && <div style={{ padding: 14 }}>{renderBody(item)}</div>}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  const stringValue = String(value ?? "—");
  const hasHtml = /<[^>]+>/.test(stringValue);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
      <div style={{ color: "#6B7280" }}>{label}</div>
      {hasHtml ? (
        <div style={{ color: "#111827" }} dangerouslySetInnerHTML={{ __html: stringValue }} />
      ) : (
        <div style={{ color: "#111827" }}>{stringValue}</div>
      )}
    </div>
  );
}

// Side panel component - redesigned for modal
function Panel({ selectedNode, onClose }: { selectedNode: Node | null; onClose: () => void }) {
  const [tab, setTab] = useState("Description");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const p = selectedNode?.data?.payload as NestedNode | undefined;
  const counts = (selectedNode?.data?.counts as { ci: number; co: number; bs: number; vs: number }) || {
    ci: 0,
    co: 0,
    bs: 0,
    vs: 0,
  };

  // Check if this is a scorecard node
  const isScorecardNode = selectedNode?.type === "scorecard";
  const scorecardData = isScorecardNode ? selectedNode.data : null;

  if (!selectedNode) return null;

  // Render scorecard details
  if (isScorecardNode && scorecardData) {
    const scName = String(scorecardData.name || "Scorecard");
    const scDescription = String(scorecardData.description || "");
    const scType = String(scorecardData.scorecardType || "boolean");
    const scData = scorecardData.scorecard as any;
    const sections = Array.isArray(scorecardData.sections) ? scorecardData.sections : [];

    const isBooleanType = scType === "boolean";

    // Get section info and color
    const sectionInfo =
      scData?.sectionId && Array.isArray(sections) && sections.length > 0 ? sections.find((s: any) => s.id === scData.sectionId) : null;
    const sectionName = sectionInfo?.name || null;

    // Generate a color based on section name, or fallback to type-based colors
    const getSectionColor = (name: string) => {
      if (!name) return isBooleanType ? "#3B82F6" : "#10B981";

      // Simple hash function to generate consistent colors from section names
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Generate colors in a nice palette range
      const colors = [
        "#3B82F6", // Blue
        "#10B981", // Green
        "#8B5CF6", // Purple
        "#F59E0B", // Amber
        "#EF4444", // Red
        "#06B6D4", // Cyan
        "#EC4899", // Pink
        "#14B8A6", // Teal
      ];

      return colors[Math.abs(hash) % colors.length];
    };

    const accentColor = sectionName ? getSectionColor(sectionName) : isBooleanType ? "#3B82F6" : "#10B981";
    const headerBgColor = `${accentColor}15`; // Light tint of the accent color

    // Check if description is long (more than 150 characters)
    const isLongDescription = scDescription && stripHtml(scDescription).length > 150;
    const displayDescription = isLongDescription && !isDescriptionExpanded ? stripHtml(scDescription).slice(0, 150) + "..." : scDescription;

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F9FAFB", overflowY: "auto", overflowX: "hidden" }}>
        {/* Enhanced header with gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${headerBgColor} 0%, #fff 100%)`,
            borderBottom: `3px solid ${accentColor}`,
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Type badge and Section */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <div
                  style={{
                    background: accentColor,
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: `0 2px 8px ${accentColor}40`,
                  }}
                >
                  {isBooleanType ? "✓ Playbook Checks (Yes/No)" : "● Skills (Score)"}
                </div>
                {sectionName && (
                  <div
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      border: `2px solid ${accentColor}`,
                    }}
                  >
                    {sectionName}
                  </div>
                )}
              </div>

              {/* Title */}
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.3,
                  marginBottom: scDescription ? 12 : 0,
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {scName}
              </h2>

              {/* Description with Read More */}
              {scDescription && (
                <div>
                  <div
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#6B7280",
                      lineHeight: 1.6,
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? scDescription : displayDescription }}
                  />
                  {isLongDescription && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      style={{
                        marginTop: 8,
                        padding: "4px 12px",
                        background: "transparent",
                        border: "none",
                        color: accentColor,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      {isDescriptionExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "2px solid #E5E7EB",
                background: "#fff",
                color: "#6B7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 600,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F3F4F6";
                e.currentTarget.style.borderColor = "#D1D5DB";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content with better styling */}
        <div
          style={{
            padding: 24,
          }}
        >
          <div style={{ display: "grid", gap: 20, paddingBottom: 20 }}>
            {/* Key Metrics Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Key Metrics
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#6B7280", fontSize: 13 }}>Type</span>
                  <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>{isBooleanType ? "Yes/No" : "Variable Score"}</span>
                </div>
                {scData?.callPhases && scData.callPhases.length > 0 && (
                  <>
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: "#6B7280", fontSize: 13 }}>Call Phases</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: "60%" }}>
                        {scData.callPhases.map((phase: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              background: accentColor,
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {phase === "opening" ? "Opening" : phase === "during" ? "During" : "Ending"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Score Guide (for variable scorecards) */}
            {scType === "variable" && scData && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Score Guide
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      style={{
                        padding: 10,
                        background: "#F9FAFB",
                        borderRadius: 8,
                        border: "1px solid #F3F4F6",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: accentColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {n}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#374151",
                            lineHeight: 1.5,
                            flex: 1,
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                          dangerouslySetInnerHTML={{ __html: scData?.[`score${n}Desc`] || "—" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check if node description is long
  const nodeDescription = String(selectedNode.data.description || "");
  const isNodeDescLong = nodeDescription.length > 150;
  const displayNodeDesc = isNodeDescLong && !isDescriptionExpanded ? nodeDescription.slice(0, 150) + "..." : nodeDescription;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F9FAFB", overflowY: "auto", overflowX: "hidden" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgb(249, 250, 251) 0%, #fff 100%)",
          borderBottom: "2px solid #E5E7EB",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 8, wordWrap: "break-word" }}>
              {selectedNode.data.title as string}
            </h2>
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: isNodeDescLong ? 8 : 12,
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: 1.6,
                }}
              >
                {displayNodeDesc}
              </div>
              {isNodeDescLong && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  style={{
                    marginBottom: 12,
                    padding: "4px 12px",
                    background: "transparent",
                    border: "none",
                    color: PRIMARY,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  {isDescriptionExpanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!!counts.bs && <Badge text={`Playbook ${counts.bs}`} tone="primary" />}
              {!!counts.vs && <Badge text={`Skills ${counts.vs}`} />}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "2px solid #E5E7EB",
              background: "#fff",
              color: "#6B7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 600,
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "2px solid #F3F4F6",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          background: "#fff",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: tab === t ? `2px solid ${PRIMARY}` : "2px solid transparent",
              background: tab === t ? SOFT_PRIMARY : "#F9FAFB",
              color: tab === t ? PRIMARY : "#374151",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (tab !== t) {
                e.currentTarget.style.background = "#F3F4F6";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t) {
                e.currentTarget.style.background = "#F9FAFB";
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          padding: 24,
          background: "#F9FAFB",
        }}
      >
        {tab === "Description" && (
          <div style={{ color: "#111827", display: "grid", gap: 10 }}>
            <Section title="Node Description">
              <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}>{p?.nodeDescription || "—"}</div>
            </Section>
          </div>
        )}

        {tab === "Playbook Checks" && (
          <Accordion
            items={p?.booleanScoreCard || []}
            emptyLabel="No playbook checks."
            renderTitle={(it) => (
              <>
                {String(it?.isItFailCriteria).toLowerCase() === "yes" && <Badge text="Fail criteria" tone="danger" />}
                <strong style={{ fontSize: 13 }}>{it?.name || "Check"}</strong>
              </>
            )}
            renderBody={(it) => (
              <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                <Row label="Description" value={it?.description || "—"} />
                <Row label="Weight" value={it?.failWeight || "—"} />
                <Row label="Fail?" value={it?.isItFailCriteria || "—"} />
              </div>
            )}
          />
        )}

        {tab === "Skills" && (
          <Accordion
            items={p?.variableScoreCard || []}
            emptyLabel="No skills."
            renderTitle={(it) => (
              <>
                {String(it?.isItFailCriteria).toLowerCase() === "yes" && <Badge text="Fail criteria" tone="danger" />}
                <strong style={{ fontSize: 13 }}>{it?.name || "Metric"}</strong>
              </>
            )}
            renderBody={(it) => (
              <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                <Row label="Description" value={it?.description || "—"} />
                <Row label="Weight" value={it?.failWeight || "—"} />
                <Row label="Fail score" value={it?.failScore || "—"} />
                <div style={{ display: "grid", gap: 6 }}>
                  <small style={{ color: "#6B7280", fontWeight: 700 }}>Score guide</small>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const scoreDesc = it?.[`score${n}Desc`] || "—";
                      const hasHtml = /<[^>]+>/.test(String(scoreDesc));
                      return (
                        <li key={n} style={{ marginBottom: 2, wordWrap: "break-word", overflowWrap: "break-word" }}>
                          <strong>S{n}:</strong> {hasHtml ? <span dangerouslySetInnerHTML={{ __html: scoreDesc }} /> : scoreDesc}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

// Main component
interface BlueprintFlowProps {
  blueprintData: BlueprintData;
  onClose?: () => void;
  readOnly?: boolean; // Hide download/action buttons for client view
}

export default function BlueprintFlow({ blueprintData, onClose, readOnly = false }: BlueprintFlowProps) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => buildFlowFromBlueprint(blueprintData), [blueprintData]);

  const [nodes, setNodes] = useState(baseNodes);
  const [edges, setEdges] = useState(baseEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const onNodesChange = useCallback((changes: any) => setNodes((ns) => applyNodeChanges(changes, ns)), []);

  const onEdgesChange = useCallback((changes: any) => setEdges((es) => applyEdgeChanges(changes, es)), []);

  const onConnect = useCallback(
    (params: any) =>
      setEdges((es) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          es
        )
      ),
    []
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setIsPanelOpen(true);
  }, []);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedNodeId(null), 300); // Delay to allow animation
  }, []);

  const handleDownloadCallOutcomes = useCallback(() => {
    const businessName = blueprintData.businessInfo?.businessName || "blueprint";
    const filename = `${businessName.toLowerCase().replace(/\s+/g, "-")}-call-outcomes.json`;
    downloadFlattenedOutcomes(blueprintData, filename);
  }, [blueprintData]);

  const handleDownloadCallOutcomePrompts = useCallback(async () => {
    setIsGeneratingPrompts(true);
    setPromptError(null);

    try {
      const promptsData = await generateCallOutcomePrompts(blueprintData);
      downloadCallOutcomePrompts(promptsData);
    } catch (error) {
      console.error("Failed to generate prompts:", error);
      setPromptError(error instanceof Error ? error.message : "Failed to generate prompts");
      alert(`Error generating prompts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGeneratingPrompts(false);
    }
  }, [blueprintData]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Canvas */}
      <div style={{ width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="bottom-left" />
          <MiniMap
            nodeStrokeColor={(n) => (n.id === selectedNodeId ? PRIMARY : "#9CA3AF")}
            nodeColor={(n) => (n.id === selectedNodeId ? SOFT_PRIMARY : "#F3F4F6")}
            maskColor="rgba(0,0,0,0.05)"
          />
          <Background gap={14} size={1} />
        </ReactFlow>
      </div>

      {/* Full-screen modal panel */}
      {isPanelOpen && selectedNode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div
            style={{
              width: "90vw",
              maxWidth: "900px",
              height: "90vh",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Panel selectedNode={selectedNode} onClose={closePanel} />
          </div>
        </div>
      )}

      {/* Close button for read-only mode */}
      {readOnly && onClose && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              border: "2px solid #E5E7EB",
              borderRadius: 12,
              padding: "12px 24px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <i className="fas fa-times" style={{ fontSize: "14px" }}></i>
            Close
          </button>
        </div>
      )}

      {/* Action buttons overlay - hidden in read-only mode */}
      {!readOnly && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 1000,
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Download Call Outcomes button */}
          <button
            onClick={handleDownloadCallOutcomes}
            style={{
              background: PRIMARY,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgb(67, 18, 98)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = PRIMARY;
            }}
            title="Download flattened call outcomes as JSON"
          >
            <i className="fas fa-download" style={{ fontSize: "12px" }}></i>
            Download Call Outcomes
          </button>

          {/* Download Call Outcomes Prompt button */}
          <button
            onClick={handleDownloadCallOutcomePrompts}
            disabled={isGeneratingPrompts}
            style={{
              background: isGeneratingPrompts ? "#9CA3AF" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: isGeneratingPrompts ? "not-allowed" : "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              opacity: isGeneratingPrompts ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGeneratingPrompts) {
                e.currentTarget.style.background = "#047857";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeneratingPrompts) {
                e.currentTarget.style.background = "#059669";
              }
            }}
            title="Generate AI-enriched prompts for call outcomes using OpenAI"
          >
            {isGeneratingPrompts ? (
              <>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-brain" style={{ fontSize: "12px" }}></i>
                Download AI Prompts
              </>
            )}
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-times" style={{ fontSize: "12px" }}></i>
              Close
            </button>
          )}
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Custom scrollbar styling */
        div[style*='overflow'] {
          scrollbar-width: thin;
          scrollbar-color: #D1D5DB #F3F4F6;
        }
        
        div[style*='overflow']::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        div[style*='overflow']::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }
        
        div[style*='overflow']::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        div[style*='overflow']::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
