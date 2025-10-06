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
const SCORECARD_WIDTH = 180; // width of each scorecard
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
  const critical =
    (payload.booleanScoreCard || []).filter((x) => x?.isItFailCriteria?.toLowerCase() === "yes").length +
    (payload.variableScoreCard || []).filter((x) => x?.isItFailCriteria?.toLowerCase() === "yes").length;
  return { ci, co, bs, vs, critical };
}

/**
 * Build a true tree layout by computing each subtree's width and
 * centering children under their parent. This avoids the grid-like look
 * and creates a classic top→bottom dendrogram feel.
 */
function buildFlowFromBlueprint(data: BlueprintData) {
  const rootPayload = data;
  const children = Array.isArray(data.nestedNodes) ? data.nestedNodes : [];

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
            isCritical: String(scorecard.isItFailCriteria).toLowerCase() === "yes",
            failWeight: scorecard.failWeight,
            failScore: scorecard.failScore,
            scorecard,
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
        {!!counts.critical && <Badge text={`Critical ${counts.critical}`} tone="danger" />}
      </div>
      {description && <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 10 }}>{truncate(description, 96)}</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: hasScorecards ? 8 : 0 }}>
        {!!counts.ci && <Badge text={`Insights ${counts.ci}`} />}
        {!!counts.co && <Badge text={`Objections ${counts.co}`} tone="primary" />}
        {!!counts.bs && <Badge text={`Bool ${counts.bs}`} />}
        {!!counts.vs && <Badge text={`Var ${counts.vs}`} />}
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
  const { name, description, scorecardType, isCritical, failWeight } = data;
  const isBooleanType = scorecardType === "boolean";

  // Color scheme based on type
  const bgColor = isBooleanType ? "#EFF6FF" : "#F0FDF4"; // Blue tint for boolean, green for variable
  const borderColor = isCritical ? "#DC2626" : isBooleanType ? "#3B82F6" : "#10B981";
  const iconColor = isBooleanType ? "#3B82F6" : "#10B981";
  const icon = isBooleanType ? "✓" : "●";

  return (
    <div
      title={truncate(description, 120)}
      style={{
        width: 180,
        border: selected ? `2px solid ${borderColor}` : `1.5px solid ${borderColor}`,
        borderLeft: `5px solid ${borderColor}`,
        borderRadius: 12,
        background: bgColor,
        boxShadow: selected ? `0 6px 16px rgba(0,0,0,0.15), 0 0 0 3px ${borderColor}20` : "0 2px 8px rgba(0,0,0,0.1)",
        padding: 12,
        position: "relative",
        transition: "all 0.2s ease",
      }}
    >
      {/* Scorecard type indicator */}
      <div
        style={{
          position: "absolute",
          top: -10,
          right: 10,
          background: borderColor,
          color: "#fff",
          borderRadius: 10,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        }}
      >
        {isBooleanType ? "Yes/No" : "Score"}
      </div>

      {/* Critical badge */}
      {isCritical && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: 10,
            background: "#DC2626",
            color: "#fff",
            borderRadius: 10,
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          ⚠ FAIL
        </div>
      )}

      {/* Icon and title */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: isCritical ? 10 : 0,
          marginBottom: description ? 8 : 0,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: iconColor,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 11, lineHeight: 1.4 }}>{truncate(name, 35)}</div>
        </div>
      </div>

      {/* Description - truncated for card display */}
      {description && (
        <div
          style={{
            color: "#6B7280",
            fontSize: 10,
            lineHeight: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {description}
        </div>
      )}

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
const TABS = ["Description", "Insights", "Objections", "Boolean Scorecard", "Variable Scorecard"];

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
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
      <div style={{ color: "#6B7280" }}>{label}</div>
      <div style={{ color: "#111827" }}>{String(value ?? "—")}</div>
    </div>
  );
}

// Side panel component
function Panel({ selectedNode, onClose }: { selectedNode: Node | null; onClose: () => void }) {
  const [tab, setTab] = useState("Description");
  const p = selectedNode?.data?.payload as NestedNode | undefined;
  const counts = (selectedNode?.data?.counts as { ci: number; co: number; bs: number; vs: number; critical: number }) || {
    ci: 0,
    co: 0,
    bs: 0,
    vs: 0,
    critical: 0,
  };

  // Check if this is a scorecard node
  const isScorecardNode = selectedNode?.type === "scorecard";
  const scorecardData = isScorecardNode ? selectedNode.data : null;

  if (!selectedNode) return <div style={{ padding: 16, color: "#6B7280" }}>Select a node to view details.</div>;

  // Render scorecard details
  if (isScorecardNode && scorecardData) {
    const scName = String(scorecardData.name || "Scorecard");
    const scDescription = String(scorecardData.description || "");
    const scType = String(scorecardData.scorecardType || "boolean");
    const scIsCritical = Boolean(scorecardData.isCritical);
    const scFailWeight = scorecardData.failWeight ? String(scorecardData.failWeight) : "—";
    const scFailScore = scorecardData.failScore ? String(scorecardData.failScore) : "—";
    const scData = scorecardData.scorecard as any;

    const isBooleanType = scType === "boolean";
    const headerBgColor = isBooleanType ? "#EFF6FF" : "#F0FDF4";
    const accentColor = scIsCritical ? "#DC2626" : isBooleanType ? "#3B82F6" : "#10B981";

  return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F9FAFB", overflow: "hidden" }}>
        {/* Enhanced header with gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${headerBgColor} 0%, #fff 100%)`,
            borderBottom: `3px solid ${accentColor}`,
            padding: 20,
            position: "sticky",
            top: 0,
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              {/* Type and Critical badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    background: accentColor,
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: `0 2px 8px ${accentColor}40`,
                  }}
                >
                  {isBooleanType ? "✓ Yes/No" : "● Score"}
                </div>
                {scIsCritical && (
                  <div
                    style={{
                      background: "#DC2626",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 8px rgba(220,38,38,0.4)",
                    }}
                  >
                    ⚠ Fail Criteria
                  </div>
                )}
              </div>

              {/* Title */}
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.3,
                  marginBottom: scDescription ? 8 : 0,
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {scName}
              </h2>

              {/* Description */}
              {scDescription && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6B7280",
                    lineHeight: 1.6,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {scDescription}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "2px solid #E5E7EB",
                background: "#fff",
                color: "#6B7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F3F4F6";
                e.currentTarget.style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content with better styling */}
        <div
          style={{
            padding: 20,
            overflow: "auto",
            flex: 1,
            scrollBehavior: "smooth",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <div style={{ display: "grid", gap: 16, paddingBottom: 20 }}>
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
                <div
                  style={{
                    height: 1,
                    background: "#F3F4F6",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#6B7280", fontSize: 13 }}>Fail Criteria</span>
                  <span
                    style={{
                      color: scIsCritical ? "#DC2626" : "#10B981",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {scIsCritical ? "Yes" : "No"}
                  </span>
                </div>
                {scFailWeight !== "—" && (
                  <>
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#6B7280", fontSize: 13 }}>Weight</span>
                      <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>{scFailWeight}</span>
                    </div>
                  </>
                )}
                {scType === "variable" && scFailScore !== "—" && (
                  <>
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#6B7280", fontSize: 13 }}>Fail Score</span>
                      <span style={{ color: "#DC2626", fontSize: 13, fontWeight: 700 }}>{scFailScore}</span>
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
                        >
                          {scData?.[`score${n}Desc`] || "—"}
                        </div>
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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 2,
          padding: 14,
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{selectedNode.data.title as string}</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{selectedNode.data.description as string}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {!!counts.ci && <Badge text={`Insights ${counts.ci}`} />}
            {!!counts.co && <Badge text={`Objections ${counts.co}`} tone="primary" />}
            {!!counts.bs && <Badge text={`Bool ${counts.bs}`} />}
            {!!counts.vs && <Badge text={`Var ${counts.vs}`} />}
            {!!counts.critical && <Badge text={`Critical ${counts.critical}`} tone="danger" />}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          style={{
            border: `1px solid #E5E7EB`,
            background: "#F9FAFB",
            color: "#111827",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: "10px 10px 0",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: tab === t ? `2px solid ${PRIMARY}` : "1px solid #E5E7EB",
              background: tab === t ? SOFT_PRIMARY : "#fff",
              color: tab === t ? PRIMARY : "#374151",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          padding: 14,
          overflow: "auto",
          flex: 1,
          scrollBehavior: "smooth",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {tab === "Description" && (
          <div style={{ color: "#111827", display: "grid", gap: 10 }}>
            <Section title="Node Description">
              <div style={{ whiteSpace: "pre-wrap" }}>{p?.nodeDescription || "—"}</div>
            </Section>
          </div>
        )}

        {tab === "Insights" && (
          <Accordion
            items={p?.customerInsights || []}
            emptyLabel="No insights."
            renderTitle={(it) => <strong style={{ fontSize: 13 }}>{it?.name || "Untitled"}</strong>}
            renderBody={(it) => <div style={{ color: "#111827", fontSize: 13 }}>{it?.description || "—"}</div>}
          />
        )}

        {tab === "Objections" && (
          <Accordion
            items={p?.customerObjection || []}
            emptyLabel="No objections."
            renderTitle={(it) => (
              <>
                <Badge text="Objection" tone="primary" />
                <strong style={{ fontSize: 13 }}>{it?.name || "Untitled"}</strong>
              </>
            )}
            renderBody={(it) => <div style={{ color: "#111827", fontSize: 13 }}>{it?.description || "—"}</div>}
          />
        )}

        {tab === "Boolean Scorecard" && (
          <Accordion
            items={p?.booleanScoreCard || []}
            emptyLabel="No boolean checks."
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

        {tab === "Variable Scorecard" && (
          <Accordion
            items={p?.variableScoreCard || []}
            emptyLabel="No variable metrics."
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
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n} style={{ marginBottom: 2 }}>
                        <strong>S{n}:</strong> {it?.[`score${n}Desc`] || "—"}
                      </li>
                    ))}
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
}

export default function BlueprintFlow({ blueprintData, onClose }: BlueprintFlowProps) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => buildFlowFromBlueprint(blueprintData), [blueprintData]);

  const [nodes, setNodes] = useState(baseNodes);
  const [edges, setEdges] = useState(baseEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

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

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNodeId(node.id), []);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

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
        display: "grid",
        gridTemplateColumns: "1fr min(420px, 38vw)",
      }}
    >
      {/* Canvas */}
      <div style={{ borderRight: "1px solid #E5E7EB" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
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

      {/* Side panel */}
      <div style={{ height: "100%", background: "#fff" }}>
        <Panel selectedNode={selectedNode} onClose={() => setSelectedNodeId(null)} />
      </div>

      {/* Action buttons overlay */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: "calc(min(420px, 38vw) + 20px)",
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

      {/* Small-screen panel overlay (progressive enhancement) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        
        @media (max-width: 1024px) {
          body, #root { overflow: hidden; }
          .react-flow__attribution { display: none; }
          /* Collapse to overlay panel to keep canvas readable */
          div[style*='grid-template-columns'] { grid-template-columns: 1fr; }
          div[style*='border-right'] + div { /* the panel */
            position: fixed; right: 12px; bottom: 12px; top: auto; left: 12px;
            max-height: 60vh; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            overflow: hidden; background: #fff;
          }
          /* Adjust action buttons position for small screens */
          div[style*='position: absolute'][style*='right: calc'] {
            right: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
