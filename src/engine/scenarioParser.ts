import type { ScenarioModel } from '../types';
import { runAgenticSemanticAnalysis } from './aiAgentEngine';

/**
 * Intelligent AI Agent scenario parser for Think Automation Lab By Rounak.
 * Uses dynamic agentic semantic NLP extraction to extract entities, boundaries,
 * and business rules without static hardcoded overrides.
 */
export function parseNaturalLanguageScenario(text: string): ScenarioModel {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      id: `scenario_${Date.now()}`,
      title: 'Custom Scenario',
      description: '',
      type: 'ui_form',
      roles: ['StandardUser'],
      fields: [],
      actions: [],
      rules: [],
      rawText: '',
    };
  }

  // Run dynamic AI agent semantic analysis
  const suite = runAgenticSemanticAnalysis(cleanText);
  return suite.scenario;
}
