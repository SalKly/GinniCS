import { supabase } from "../../utils/supabase";
import type { BlueprintData } from "../models/blueprint";

interface BlueprintRow {
  id: string;
  payload: BlueprintData;
  created_at?: string;
}

function sanitizeBlueprint(blueprint: BlueprintData): BlueprintData {
  const safeBusinessInfo = blueprint.businessInfo ? { ...blueprint.businessInfo, qaManualFile: null } : undefined;
  return {
    ...blueprint,
    businessInfo: safeBusinessInfo,
    scorecardSections: blueprint.scorecardSections || [], // Explicitly preserve scorecard sections
  };
}

export async function saveBlueprint(blueprint: BlueprintData): Promise<string> {
  const sanitized = sanitizeBlueprint(blueprint);
  const { data, error } = await supabase.from("blueprints").insert({ payload: sanitized }).select("id").single();

  if (error) {
    throw error;
  }

  return (data as { id: string }).id;
}

export async function fetchBlueprint(id: string): Promise<BlueprintData | null> {
  const { data, error } = await supabase.from("blueprints").select("payload").eq("id", id).single();

  if (error) {
    throw error;
  }

  const row = data as { payload: BlueprintData } | null;
  return row?.payload ?? null;
}
