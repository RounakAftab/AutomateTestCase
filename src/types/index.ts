export type ScenarioType = 'ui_form' | 'user_story' | 'api_endpoint' | 'workflow_crud';

export type FieldDataType = 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'date' | 'file';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldDataType;
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  defaultValue?: string;
  options?: string[]; // For select dropdowns
  description?: string;
}

export interface ActionDefinition {
  id: string;
  name: string;
  type: 'click' | 'submit' | 'filter' | 'navigate' | 'modal_open';
  target: string;
  expectedOutcome: string;
}

export interface BusinessRule {
  id: string;
  condition: string;
  effect: string;
}

export interface ApiDetails {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers: { key: string; value: string }[];
  queryParams: { key: string; value: string; required: boolean }[];
  requestBodySchema?: Record<string, any>;
  expectedStatusCodes: number[];
}

export interface ScenarioModel {
  id: string;
  title: string;
  description: string;
  type: ScenarioType;
  roles: string[];
  fields: FieldDefinition[];
  actions: ActionDefinition[];
  rules: BusinessRule[];
  apiDetails?: ApiDetails;
  rawText?: string;
}

export type CoverageDimension =
  | 'happy_path'
  | 'boundary_value'
  | 'equivalence_partition'
  | 'negative_error'
  | 'state_transition'
  | 'security_edge'
  | 'accessibility';

export interface TestCaseItem {
  id: string;
  acRef?: string; // Acceptance Criteria Ref e.g. AC-01, AC-02
  title: string;
  dimension: CoverageDimension;
  dimensionLabel: string;
  priority: 'P0 - Critical' | 'P1 - High' | 'P2 - Medium' | 'P3 - Low';
  preconditions: string[];
  steps: string[];
  testData: Record<string, any>;
  expectedResult: string;
  targetField?: string;
  assertionType: 'visibility' | 'error_text' | 'status_code' | 'state_change' | 'url_redirect';
  playwrightCodeSnippet: string;
  cypressCodeSnippet: string;
  jestCodeSnippet: string;
  pytestCodeSnippet: string;
  gherkinSnippet: string;
}

export interface CoverageBreakdown {
  happy_path: number;
  boundary_value: number;
  equivalence_partition: number;
  negative_error: number;
  state_transition: number;
  security_edge: number;
  accessibility: number;
}

export interface TestSuiteResult {
  scenario: ScenarioModel;
  testCases: TestCaseItem[];
  totalCases: number;
  coverageScore: number; // 0 - 100
  breakdown: CoverageBreakdown;
  generatedCode: {
    playwright: string;
    playwrightPom: string;
    cypress: string;
    jest: string;
    pytest: string;
    gherkin: string;
    qaMatrixCsv: string;
    qaMatrixMarkdown: string;
  };
}

export type TargetFramework = 'playwright' | 'playwright_pom' | 'cypress' | 'jest' | 'pytest' | 'gherkin' | 'qa_matrix';

export interface AISettings {
  provider: 'offline_heuristic' | 'gemini' | 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
}
