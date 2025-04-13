/**
 * Supabase Mappers
 * 
 * This utility provides functions to map between Supabase database types
 * and application types. This ensures that data is properly formatted
 * when moving between the database and the application.
 */

import type { WhatIfScenario, ScenarioVariation, ScenarioImpact } from "@shared/schema";
import { Database } from "@/lib/types/supabase";
import { ScenarioParameters, TypedWhatIfScenario } from "@/lib/hooks/useSupabaseScenarios";

// Type for Supabase scenarios table
type SupabaseScenario = Database["public"]["Tables"]["scenarios"]["Row"];
type SupabaseVariation = Database["public"]["Tables"]["variations"]["Row"];
type SupabaseImpact = Database["public"]["Tables"]["impacts"]["Row"];

/**
 * Maps a Supabase scenario to the application's WhatIfScenario type
 * @param scenario The scenario from Supabase
 * @returns A WhatIfScenario object
 */
export function mapSupabaseScenarioToAppScenario(scenario: SupabaseScenario): WhatIfScenario {
  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    parameters: scenario.parameters,
    userId: scenario.user_id,
    baseCalculationId: scenario.base_calculation_id,
    createdAt: new Date(scenario.created_at),
    updatedAt: scenario.updated_at ? new Date(scenario.updated_at) : undefined,
    isSaved: scenario.is_saved,
    results: scenario.results
  };
}

/**
 * Maps the application's WhatIfScenario type to a Supabase scenario
 * @param scenario The application scenario
 * @returns A Supabase compatible scenario object
 */
export function mapAppScenarioToSupabaseScenario(
  scenario: Partial<WhatIfScenario>
): Partial<Database["public"]["Tables"]["scenarios"]["Insert"]> {
  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    parameters: scenario.parameters as any,
    user_id: scenario.userId,
    base_calculation_id: scenario.baseCalculationId,
    created_at: scenario.createdAt?.toISOString(),
    updated_at: scenario.updatedAt?.toISOString(),
    is_saved: scenario.isSaved,
    results: scenario.results as any
  };
}

/**
 * Maps a Supabase variation to the application's ScenarioVariation type
 * @param variation The variation from Supabase
 * @returns A ScenarioVariation object
 */
export function mapSupabaseVariationToAppVariation(variation: SupabaseVariation): ScenarioVariation {
  return {
    id: variation.id,
    scenarioId: variation.scenario_id,
    name: variation.name,
    parameterChanges: variation.parameter_changes,
    createdAt: new Date(variation.created_at),
    updatedAt: variation.updated_at ? new Date(variation.updated_at) : undefined
  };
}

/**
 * Maps the application's ScenarioVariation type to a Supabase variation
 * @param variation The application variation
 * @returns A Supabase compatible variation object
 */
export function mapAppVariationToSupabaseVariation(
  variation: Partial<ScenarioVariation>
): Partial<Database["public"]["Tables"]["variations"]["Insert"]> {
  return {
    id: variation.id,
    scenario_id: variation.scenarioId,
    name: variation.name,
    parameter_changes: variation.parameterChanges as any,
    created_at: variation.createdAt?.toISOString(),
    updated_at: variation.updatedAt?.toISOString()
  };
}

/**
 * Maps a Supabase impact to the application's ScenarioImpact type
 * @param impact The impact from Supabase
 * @returns A ScenarioImpact object
 */
export function mapSupabaseImpactToAppImpact(impact: SupabaseImpact): ScenarioImpact {
  return {
    id: impact.id,
    scenarioId: impact.scenario_id,
    parameterKey: impact.parameter_key,
    originalValue: impact.original_value,
    newValue: impact.new_value,
    impactValue: impact.impact_value,
    impactPercentage: impact.impact_percentage,
    createdAt: new Date(impact.created_at)
  };
}

/**
 * Maps the application's ScenarioImpact type to a Supabase impact
 * @param impact The application impact
 * @returns A Supabase compatible impact object
 */
export function mapAppImpactToSupabaseImpact(
  impact: Partial<ScenarioImpact>
): Partial<Database["public"]["Tables"]["impacts"]["Insert"]> {
  return {
    id: impact.id,
    scenario_id: impact.scenarioId,
    parameter_key: impact.parameterKey,
    original_value: impact.originalValue as any,
    new_value: impact.newValue as any,
    impact_value: impact.impactValue,
    impact_percentage: impact.impactPercentage,
    created_at: impact.createdAt?.toISOString()
  };
}

/**
 * Maps a WhatIfScenario to a TypedWhatIfScenario with strongly typed parameters
 * @param scenario The scenario to convert
 * @returns A TypedWhatIfScenario with strongly typed parameters
 */
export function mapToTypedScenario(scenario: WhatIfScenario): TypedWhatIfScenario {
  return {
    ...scenario,
    parameters: scenario.parameters as ScenarioParameters
  };
}

/**
 * Maps an array of WhatIfScenarios to TypedWhatIfScenarios with strongly typed parameters
 * @param scenarios The scenarios to convert
 * @returns An array of TypedWhatIfScenarios with strongly typed parameters
 */
export function mapToTypedScenarios(scenarios: WhatIfScenario[]): TypedWhatIfScenario[] {
  return scenarios.map(mapToTypedScenario);
}