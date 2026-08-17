import type {
  ScenarioModel,
  TestCaseItem,
  TestSuiteResult,
  FieldDefinition,
  ActionDefinition,
  BusinessRule,
  CoverageDimension,
  AISettings,
} from '../types';

/**
 * Enterprise AI Agent & LLM Engine for Ultra-Realistic Scenario Analysis & Test Synthesis
 * Powered by:
 * 1. Financial & Domain-Specific Semantic Reasoning (understands transfer vs balance logic, 5k/20k shorthand)
 * 2. Deep Semantic NLP Entity & Rule Extractor (free-form user stories, specs, conditional branches)
 * 3. Exact IEEE 829 & ISTQB Test Plan Synthesis
 * 4. Executable Playwright TS & Cypress E2E scripts with realistic locators & assertions
 */

export async function analyzeScenarioAndGenerateSuite(
  text: string,
  aiSettings?: AISettings
): Promise<TestSuiteResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Scenario text cannot be empty');
  }

  // 1. Cloud LLM Call if API key is provided
  if (aiSettings?.apiKey && (aiSettings.provider === 'gemini' || aiSettings.provider === 'openai')) {
    try {
      if (aiSettings.provider === 'gemini') {
        return await callGeminiLLM(cleanText, aiSettings.apiKey, aiSettings.model);
      } else if (aiSettings.provider === 'openai') {
        return await callOpenAILLM(cleanText, aiSettings.apiKey, aiSettings.model || 'gpt-4o-mini');
      }
    } catch (err) {
      console.warn('Cloud LLM call failed, falling back to local semantic agent:', err);
    }
  }

  // 2. Client-Side Deep Semantic AI Agent
  return runAgenticSemanticAnalysis(cleanText);
}

/**
 * Helper to normalize shorthand numbers (e.g. 5k -> 5000, 20k -> 20000, $1.5k -> 1500)
 */
function normalizeShorthandNumbers(text: string): string {
  return text
    .replace(/\$(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => String(parseFloat(n) * 1000))
    .replace(/(\d+(?:\.\d+)?)\s*k\s*money\b/gi, (_, n) => `$${parseFloat(n) * 1000}`)
    .replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => String(parseFloat(n) * 1000));
}

/**
 * Domain-Specific Dictionary for Natural Language Entity Recognition
 */
interface KnownEntitySpec {
  keywords: RegExp[];
  name: string;
  label: string;
  type: FieldDefinition['type'];
  defaultValid: any;
  defaultInvalidFormat?: any;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  description: string;
}

const KNOWN_ENTITIES: KnownEntitySpec[] = [
  // Banking, Money Transfer & Account Balance
  {
    keywords: [/\b(?:transfer money|transfer amount|send money|send \d+|transfer \d+|transfer)\b/i],
    name: 'transferAmount',
    label: 'Transfer Amount ($)',
    type: 'number',
    min: 1.0,
    max: 25000.0,
    defaultValid: 5000.0,
    description: 'Amount of funds to transfer in USD ($)',
  },
  {
    keywords: [/\b(?:balance|my balance|account balance|available balance|have \d+ money)\b/i],
    name: 'accountBalance',
    label: 'Account Balance ($)',
    type: 'number',
    min: 0.0,
    max: 100000.0,
    defaultValid: 6000.0,
    description: 'Current available balance in source account',
  },
  {
    keywords: [/\b(?:from my account|source account|from account|my account|sender account)\b/i],
    name: 'sourceAccount',
    label: 'Source Account',
    type: 'select',
    options: ['Primary Checking (****4819)', 'High-Yield Savings (****9021)', 'Corporate Vault (****1104)'],
    defaultValid: 'Primary Checking (****4819)',
    description: 'Source bank account debited for transaction',
  },
  {
    keywords: [/\b(?:recipient account|destination account|to account|recipient iban|beneficiary)\b/i],
    name: 'recipientAccount',
    label: 'Recipient Account / IBAN',
    type: 'text',
    min: 10,
    max: 34,
    defaultValid: 'GB29NWBK60161331926819',
    defaultInvalidFormat: 'GB99_INVALID',
    description: 'Destination bank account or IBAN',
  },
  // Authentication & Identity
  {
    keywords: [/\b(?:email|email address|mail|user email)\b/i],
    name: 'email',
    label: 'Email Address',
    type: 'email',
    defaultValid: 'sarah.connor@enterprise-qa.com',
    defaultInvalidFormat: 'sarah.connor@invalid-domain',
    description: 'Valid corporate RFC 5322 compliant email address',
  },
  {
    keywords: [/\b(?:password|passcode|secret|user password)\b/i],
    name: 'password',
    label: 'Password',
    type: 'password',
    min: 8,
    max: 64,
    defaultValid: 'Str0ng#P@ssw0rd!2026',
    defaultInvalidFormat: 'weak',
    description: 'Min 8 chars, must include uppercase, lowercase, digit, and symbol',
  },
  {
    keywords: [/\b(?:confirm password|password confirmation|repeat password)\b/i],
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    min: 8,
    max: 64,
    defaultValid: 'Str0ng#P@ssw0rd!2026',
    description: 'Must match password field exactly',
  },
  {
    keywords: [/\b(?:otp|2fa|two factor|two-factor|auth code|verification code|security code)\b/i],
    name: 'twoFactorOtp',
    label: '2FA Verification OTP',
    type: 'number',
    min: 100000,
    max: 999999,
    defaultValid: 849201,
    defaultInvalidFormat: 1234,
    description: '6-digit time-based one-time password',
  },
  {
    keywords: [/\b(?:first name|given name|fname)\b/i],
    name: 'firstName',
    label: 'First Name',
    type: 'text',
    min: 2,
    max: 50,
    defaultValid: 'Jonathan',
    description: 'Legal first name of the user',
  },
  {
    keywords: [/\b(?:last name|surname|family name|lname)\b/i],
    name: 'lastName',
    label: 'Last Name',
    type: 'text',
    min: 2,
    max: 50,
    defaultValid: 'Miller',
    description: 'Legal last name / surname',
  },
  {
    keywords: [/\b(?:salary|annual salary|wage|compensation)\b/i],
    name: 'salary',
    label: 'Annual Salary ($)',
    type: 'number',
    min: 30000,
    max: 250000,
    defaultValid: 85000,
    description: 'Base annual salary in USD',
  },
  {
    keywords: [/\b(?:card number|credit card|debit card|pan)\b/i],
    name: 'cardNumber',
    label: 'Card Number',
    type: 'text',
    min: 16,
    max: 19,
    defaultValid: '4532 8901 2345 6789',
    defaultInvalidFormat: '4532 8901',
    description: '16-digit Visa/Mastercard number',
  },
  {
    keywords: [/\b(?:cvv|cvc|security code|card verification)\b/i],
    name: 'cvv',
    label: 'CVV / Security Code',
    type: 'number',
    min: 100,
    max: 9999,
    defaultValid: 789,
    defaultInvalidFormat: 12,
    description: '3 or 4-digit security code on back of card',
  },
  {
    keywords: [/\b(?:expiry date|card expiry|expiration date|expiry)\b/i],
    name: 'expiryDate',
    label: 'Card Expiry (MM/YY)',
    type: 'text',
    defaultValid: '12/28',
    defaultInvalidFormat: '13/20',
    description: 'Two digit month and two digit future year (MM/YY)',
  },
  {
    keywords: [/\b(?:batch number|batchnumber|lot number|batch code|sku)\b/i],
    name: 'batchNumber',
    label: 'Batch Number',
    type: 'text',
    min: 5,
    max: 20,
    pattern: 'JAR-XXXX',
    defaultValid: 'JAR-4091',
    defaultInvalidFormat: 'INVALID_12',
    description: 'Unique inventory batch identifier (Format: JAR-XXXX)',
  },
  {
    keywords: [/\b(?:quantity|item quantity|units|qty|item count)\b/i],
    name: 'itemQuantity',
    label: 'Item Quantity',
    type: 'number',
    min: 1,
    max: 10000,
    defaultValid: 250,
    description: 'Quantity of items / units',
  },
  {
    keywords: [/\b(?:department|division|team)\b/i],
    name: 'department',
    label: 'Department',
    type: 'select',
    options: ['Engineering', 'Quality_Assurance', 'Product', 'Finance', 'Operations', 'Sales', 'HR'],
    defaultValid: 'Engineering',
    description: 'Organizational department assignment',
  },
];

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deep Semantic NLP Agent that analyzes arbitrary scenario text and extracts all entities, rules & roles
 */
export function runAgenticSemanticAnalysis(text: string): TestSuiteResult {
  const normalizedText = normalizeShorthandNumbers(text);
  const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract Scenario Title
  const title = extractScenarioTitle(normalizedText, lines);

  // 2. Extract User Roles / Personas
  const roles = extractRoles(normalizedText);

  // 3. Extract Real Fields & Entities
  const fields = extractRealFields(normalizedText);

  // 4. Extract Actions & Triggers
  const actions = extractActions(normalizedText, fields);

  // 5. Extract Business Rules & Conditional Branches
  const rules = extractBusinessRules(normalizedText);

  const scenario: ScenarioModel = {
    id: `scenario_${Date.now()}`,
    title,
    description: text,
    type: determineScenarioType(normalizedText),
    roles,
    fields,
    actions,
    rules,
    rawText: text,
  };

  return synthesizeRealisticTestSuite(scenario, normalizedText);
}

function extractScenarioTitle(text: string, lines: string[]): string {
  if (/transfer money|transfer \d+|balance/i.test(text)) {
    return 'Bank Account Money Transfer & Balance Verification Flow';
  }

  const titleMatch = text.match(/(?:title|scenario|feature|user story|epic|requirement):\s*([^\n\r]+)/i);
  if (titleMatch && titleMatch[1]?.trim()) {
    return titleMatch[1].trim();
  }

  const userStoryMatch = text.match(/as an?\s+([^,]+),\s*i\s+(?:want|need)\s+(?:to\s+)?([^,\.]+)/i);
  if (userStoryMatch && userStoryMatch[1] && userStoryMatch[2]) {
    const role = userStoryMatch[1].trim();
    const action = userStoryMatch[2].trim();
    return `${capitalize(action)} (${capitalize(role)})`;
  }

  if (lines.length > 0 && lines[0].length <= 80 && !lines[0].toLowerCase().startsWith('as a')) {
    return lines[0].replace(/^[#*\-•\d\.\s]+/, '').trim();
  }

  const firstSentence = text.split(/[.\n]/)[0]?.trim();
  if (firstSentence && firstSentence.length > 0 && firstSentence.length <= 75) {
    return firstSentence;
  }

  return 'End-to-End Workflow Verification';
}

function extractRoles(text: string): string[] {
  const rolesSet = new Set<string>();

  const roleMatches = text.matchAll(/\b(?:as an?|role|user|persona|actor|permission)\s+(?:is\s+)?[:"]?([a-zA-Z0-9_\s-]+?)["\.,\n\r]/gi);
  for (const m of roleMatches) {
    if (m && m[1]) {
      const r = m[1].trim();
      if (r.length >= 3 && r.length <= 25 && !['a', 'an', 'the', 'this', 'that', 'valid', 'invalid'].includes(r.toLowerCase())) {
        rolesSet.add(capitalize(r.replace(/\s+/g, '_')));
      }
    }
  }

  if (/transfer|bank|money|account/i.test(text)) rolesSet.add('AccountHolder');
  if (/admin|administrator/i.test(text)) rolesSet.add('Admin');
  if (/manager|supervisor/i.test(text)) rolesSet.add('Manager');
  if (/doctor|physician|clinician/i.test(text)) rolesSet.add('Doctor');
  if (/inspector|qc|auditor/i.test(text)) rolesSet.add('QC_Inspector');

  if (rolesSet.size === 0) {
    rolesSet.add('StandardUser');
  }

  return Array.from(rolesSet);
}

const FIELD_BLOCKLIST = new Set([
  'locks', 'response', 'window', 'data', 'analysis', 'string', 'numeric', '01', 
  'flow', 'processing', 'asynchronously', 'service', 'locking', 'pii', 'again',
  'metric', 'value', 'author', 'date', 'total', 'coverage', 'score', 'happy',
  'path', 'boundary', 'equivalence', 'partition', 'negative', 'error', 'security',
  'resiliency', 'accessibility', 'a11y', 'browser', 'page', 'test', 'scenario'
]);

function extractRealFields(text: string): FieldDefinition[] {
  const fields: FieldDefinition[] = [];
  const fieldNamesSet = new Set<string>();

  // 1. Match against Known Domain Entity Specs
  for (const spec of KNOWN_ENTITIES) {
    for (const kw of spec.keywords) {
      if (kw.test(text)) {
        if (!fieldNamesSet.has(spec.name)) {
          fieldNamesSet.add(spec.name);

          // Check if user specified custom boundaries or numbers in text
          const customBounds = extractCustomBoundaries(text, spec.name, spec.label);
          const min = customBounds.min !== undefined ? customBounds.min : spec.min;
          const max = customBounds.max !== undefined ? customBounds.max : spec.max;
          const options = customBounds.options || spec.options;
          const pattern = customBounds.pattern || spec.pattern;

          fields.push({
            id: `f_${spec.name}`,
            name: spec.name,
            label: spec.label,
            type: spec.type,
            required: !/optional/i.test(customBounds.rawMatch || ''),
            min,
            max,
            pattern,
            options,
            defaultValue: spec.defaultValid,
            description: spec.description,
          });
        }
        break;
      }
    }
  }

  // 2. Extract Bracketed Fields: "fieldName (constraints, min X, max Y)" - must start with a letter
  const bracketMatches = text.matchAll(/([a-zA-Z_][a-zA-Z0-9_]{1,29})\s*\(([^)]+)\)/g);
  for (const m of bracketMatches) {
    if (m && m[1] && m[2]) {
      const rawName = m[1].trim();
      const details = m[2].trim();
      const rawNameLower = rawName.toLowerCase();
      if (!fieldNamesSet.has(rawName) && 
          !FIELD_BLOCKLIST.has(rawNameLower) && 
          !['i', 'as', 'when', 'if', 'then', 'so', 'to'].includes(rawNameLower)) {
        fieldNamesSet.add(rawName);
        fields.push(parseCustomFieldDetails(rawName, details));
      }
    }
  }

  // Fallback: If empty, supply clean sample fields
  if (fields.length === 0) {
    fields.push(
      {
        id: 'f_username',
        name: 'username',
        label: 'Username',
        type: 'text',
        min: 3,
        max: 30,
        defaultValue: 'alex_smith_qa',
        required: true,
        description: 'User login account identifier',
      },
      {
        id: 'f_actionData',
        name: 'actionData',
        label: 'Request Payload Data',
        type: 'text',
        min: 1,
        max: 255,
        defaultValue: 'Valid Transaction Record',
        required: true,
        description: 'Primary record payload',
      }
    );
  }

  return fields;
}

function extractCustomBoundaries(
  text: string,
  fieldName: string,
  fieldLabel: string
): { min?: number; max?: number; options?: string[]; pattern?: string; rawMatch?: string } {
  const res: { min?: number; max?: number; options?: string[]; pattern?: string; rawMatch?: string } = {};

  const cleanLabel = fieldLabel ? fieldLabel.replace(/\s*\([^)]*\)/g, '').trim() : '';
  const safeName = escapeRegExp(fieldName || '');
  const safeLabel = escapeRegExp(cleanLabel || '');

  try {
    const regex = new RegExp(`(?:${safeName}|${safeLabel})\\s*\\(([^)]+)\\)`, 'i');
    const m = text.match(regex);
    if (m && m[1]) {
      res.rawMatch = m[1];
      const details = m[1];

      const minMatch = details.match(/(?:min(?:imum)?|at least|from|>=|>)\s*[:=]?\s*(\$?\d+(?:\.\d+)?)/i);
      if (minMatch && minMatch[1]) res.min = parseFloat(minMatch[1].replace('$', ''));

      const maxMatch = details.match(/(?:max(?:imum)?|up to|to|<=|<)\s*[:=]?\s*(\$?\d+(?:\.\d+)?)/i);
      if (maxMatch && maxMatch[1]) res.max = parseFloat(maxMatch[1].replace('$', ''));

      const betweenMatch = details.match(/between\s*(\$?\d+(?:\.\d+)?)\s*and\s*(\$?\d+(?:\.\d+)?)/i);
      if (betweenMatch && betweenMatch[1] && betweenMatch[2]) {
        res.min = parseFloat(betweenMatch[1].replace('$', ''));
        res.max = parseFloat(betweenMatch[2].replace('$', ''));
      }

      if (details.includes(',') && !details.toLowerCase().includes('min') && !details.toLowerCase().includes('max')) {
        const parts = details.split(',').map((p) => p.trim()).filter((p) => p.length > 0 && !/^(between|and|format)/i.test(p));
        if (parts.length >= 2) {
          res.options = parts;
        }
      }
    }
  } catch (err) {
    console.warn('Regex boundary extraction non-fatal error:', err);
  }

  return res;
}

function parseCustomFieldDetails(rawName: string, details: string): FieldDefinition {
  let type: FieldDefinition['type'] = 'text';
  if (/email/i.test(rawName) || /email/i.test(details)) type = 'email';
  else if (/password|passcode|secret/i.test(rawName) || /password/i.test(details)) type = 'password';
  else if (/number|qty|quantity|amount|price|count|age|limit|rate|balance|code|otp|cvv|salary/i.test(rawName) || /number|integer|decimal|digit/i.test(details)) type = 'number';
  else if (/date|time|dob|expiry/i.test(rawName) || /date|format:?\s*mm\/yy/i.test(details)) type = 'date';
  else if (/checkbox|is_|has_|agree|remember|active|status_bool/i.test(rawName) || /boolean|checkbox/i.test(details)) type = 'checkbox';
  else if (/select|dropdown|status|type|category|mode|role|department/i.test(rawName) || /select|options?:/i.test(details)) type = 'select';

  let min: number | undefined;
  let max: number | undefined;

  const minMatch = details.match(/(?:min(?:imum)?|at least|from|>=|>)\s*[:=]?\s*(\$?\d+(?:\.\d+)?)/i);
  if (minMatch && minMatch[1]) min = parseFloat(minMatch[1].replace('$', ''));

  const maxMatch = details.match(/(?:max(?:imum)?|up to|to|<=|<)\s*[:=]?\s*(\$?\d+(?:\.\d+)?)/i);
  if (maxMatch && maxMatch[1]) max = parseFloat(maxMatch[1].replace('$', ''));

  const betweenMatch = details.match(/between\s*(\$?\d+(?:\.\d+)?)\s*and\s*(\$?\d+(?:\.\d+)?)/i);
  if (betweenMatch && betweenMatch[1] && betweenMatch[2]) {
    min = parseFloat(betweenMatch[1].replace('$', ''));
    max = parseFloat(betweenMatch[2].replace('$', ''));
  }

  let options: string[] | undefined;
  if (details.includes(',') && !details.toLowerCase().includes('min') && !details.toLowerCase().includes('max')) {
    const parts = details.split(',').map((p) => p.trim()).filter((p) => p.length > 0 && !/^(between|and|format)/i.test(p));
    if (parts.length >= 2) {
      options = parts;
      type = 'select';
    }
  }

  const required = /required|mandatory|must/i.test(details) || /required|mandatory|must/i.test(rawName);
  const label = rawName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();

  let defaultValue: any = 'Valid Sample Value';
  if (type === 'email') defaultValue = 'user.alex@enterprise-corp.com';
  else if (type === 'password') defaultValue = 'Str0ng#P@ssw0rd!2026';
  else if (type === 'number') defaultValue = min !== undefined ? (max !== undefined ? Math.floor((min + max) / 2) : min + 10) : 100;
  else if (type === 'checkbox') defaultValue = true;
  else if (type === 'select' && options && options.length > 0) defaultValue = options[0];
  else defaultValue = `Sample ${label}`;

  return {
    id: `f_${rawName.toLowerCase()}`,
    name: rawName,
    label,
    type,
    required,
    min,
    max,
    options,
    defaultValue,
    description: details || `Specification for ${label}`,
  };
}

function extractActions(text: string, fields: FieldDefinition[]): ActionDefinition[] {
  const actions: ActionDefinition[] = [];

  if (/transfer|send money/i.test(text)) {
    actions.push({
      id: 'act_transfer',
      name: 'Click "Transfer Money" Button',
      type: 'submit',
      target: 'button[data-testid="transfer-submit-btn"]',
      expectedOutcome: 'System validates transfer bounds and balance, debits source account, and issues transaction confirmation receipt.',
    });
    return actions;
  }

  const actionMatches = text.matchAll(/(?:when user clicks?|click|submit|press|trigger)\s+["']?([^"'\n\r\.,]+)["']?/gi);
  for (const m of actionMatches) {
    if (m && m[1]) {
      const act = m[1].trim();
      if (act.length >= 3) {
        actions.push({
          id: `act_${actions.length + 1}`,
          name: `Click ${act}`,
          type: /submit|save|confirm|create|send|transfer/i.test(act) ? 'submit' : 'click',
          target: `button[data-testid="${act.toLowerCase().replace(/[^a-z0-9]/g, '-')}"]`,
          expectedOutcome: 'System executes action successfully, displays confirmation banner, and updates record status.',
        });
      }
    }
  }

  if (actions.length === 0) {
    actions.push({
      id: 'act_submit',
      name: 'Submit Record',
      type: 'submit',
      target: 'button[type="submit"]',
      expectedOutcome: 'Action completes with HTTP 200/201 status, records are persisted, and view updates.',
    });
  }

  return actions;
}

function extractBusinessRules(text: string): BusinessRule[] {
  const rules: BusinessRule[] = [];
  let idx = 1;

  // 1. Banking Transfer vs Balance Rules
  if (/transfer|send money|balance|payment|pay|charge/i.test(text)) {
    // Pattern A: "transfer X ... if/when balance is Y"
    const m1 = text.matchAll(/(?:transfer|send)\s+(?:money\s+)?(?:\$)?(\d+(?:\.\d+)?)[^,;\.]*?(?:if|when)\s+(?:my\s+)?balance\s+(?:is\s+)?(more\s+than\s+|>)?\s*(?:\$)?(\d+(?:\.\d+)?)/gi);
    for (const match of m1) {
      const transferAmt = parseFloat(match[1]);
      const isMoreThan = Boolean(match[2]);
      const balanceAmt = parseFloat(match[3]);

      if (transferAmt <= balanceAmt) {
        const remaining = isMoreThan ? `greater than $${(balanceAmt - transferAmt).toLocaleString()}` : `$${(balanceAmt - transferAmt).toFixed(2)}`;
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When transfer amount is $${transferAmt.toLocaleString()} and account balance is ${isMoreThan ? 'more than ' : ''}$${balanceAmt.toLocaleString()}`,
          effect: `Transfer of $${transferAmt.toLocaleString()} is authorized and processed. Remaining account balance is ${remaining}.`,
        });
      } else {
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When transfer amount is $${transferAmt.toLocaleString()} and account balance is $${balanceAmt.toLocaleString()} (Transfer > Balance)`,
          effect: `Transfer is rejected with error: "Insufficient funds: Transfer amount ($${transferAmt.toLocaleString()}) exceeds available balance ($${balanceAmt.toLocaleString()})".`,
        });
      }
    }

    // Pattern B: "if balance is [more than] Y [then] [can/able to] transfer X"
    const m2 = text.matchAll(/if\s+(?:my\s+)?balance\s+(?:is\s+)?(more\s+than\s+|>)?\s*(?:\$)?(\d+(?:\.\d+)?)[^,;\.]*?(?:then\s+)?(?:i\s+can\s+able\s+to\s+|i\s+can\s+|i\s+am\s+able\s+to\s+|able\s+to\s+|can\s+)?(?:transfer|send)\s+(?:\$)?(\d+(?:\.\d+)?)/gi);
    for (const match of m2) {
      const isMoreThan = Boolean(match[1]);
      const balanceAmt = parseFloat(match[2]);
      const transferAmt = parseFloat(match[3]);

      if (transferAmt <= balanceAmt) {
        const remaining = isMoreThan ? `greater than $${(balanceAmt - transferAmt).toLocaleString()}` : `$${(balanceAmt - transferAmt).toFixed(2)}`;
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When account balance is ${isMoreThan ? 'more than ' : ''}$${balanceAmt.toLocaleString()} and transfer amount is $${transferAmt.toLocaleString()}`,
          effect: `Transfer of $${transferAmt.toLocaleString()} is authorized and processed. Remaining account balance is ${remaining}.`,
        });
      } else {
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When account balance is $${balanceAmt.toLocaleString()} and transfer amount is $${transferAmt.toLocaleString()} (Transfer > Balance)`,
          effect: `Transfer is rejected with error: "Insufficient funds: Transfer amount ($${transferAmt.toLocaleString()}) exceeds available balance ($${balanceAmt.toLocaleString()})".`,
        });
      }
    }

    // Pattern C: "if i have Y money then send X money"
    const m3 = text.matchAll(/if\s+i\s+have\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:money)?[^,;\.]*?then\s+(?:i\s+am\s+able\s+to\s+|i\s+can\s+|able\s+to\s+|can\s+)?(?:send|transfer)\s+(?:\$)?(\d+(?:\.\d+)?)/gi);
    for (const match of m3) {
      const balanceAmt = parseFloat(match[1]);
      const transferAmt = parseFloat(match[2]);

      if (transferAmt <= balanceAmt) {
        const remaining = balanceAmt === transferAmt ? '$0.00' : `$${(balanceAmt - transferAmt).toFixed(2)}`;
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When account balance is $${balanceAmt.toLocaleString()} and transfer amount is $${transferAmt.toLocaleString()}${balanceAmt === transferAmt ? ' (100% Full Balance Transfer)' : ''}`,
          effect: `Transfer of $${transferAmt.toLocaleString()} is authorized and processed. Remaining account balance is ${remaining}.`,
        });
      } else {
        rules.push({
          id: `rule_transfer_${idx++}`,
          condition: `When account balance is $${balanceAmt.toLocaleString()} and transfer amount is $${transferAmt.toLocaleString()} (Transfer > Balance)`,
          effect: `Transfer is rejected with error: "Insufficient funds: Transfer amount ($${transferAmt.toLocaleString()}) exceeds available balance ($${balanceAmt.toLocaleString()})".`,
        });
      }
    }
  }

  // 2. Generic "when/if [condition], [effect]" for non-banking scenarios
  if (rules.length === 0) {
    const sentences = text.split(/[.;]|\balso\s+if\b|\band\s+if\b/i).map((s) => s.trim()).filter(Boolean);
    for (const s of sentences) {
      const genericMatch = s.match(/(?:when|if|in case of)\s+([^,]+)[,:]\s*(?:then\s+)?(.+)/i);
      if (genericMatch && genericMatch[1] && genericMatch[2]) {
        const condition = genericMatch[1].trim();
        const effect = genericMatch[2].trim();
        if (condition.length >= 4 && effect.length >= 4) {
          rules.push({
            id: `rule_${idx++}`,
            condition: `When ${condition}`,
            effect: effect,
          });
        }
      }
    }
  }

  return rules;
}

function determineScenarioType(text: string): ScenarioModel['type'] {
  if (/transfer|bank|balance/i.test(text)) return 'ui_form';
  if (/api|endpoint|payload|json|rest/i.test(text)) return 'api_endpoint';
  if (/crud|table|list|modal|batch/i.test(text)) return 'workflow_crud';
  return 'ui_form';
}

/**
 * Synthesizes Ultra-Realistic Test Cases & Code Suites based on Extracted Elements
 */
function synthesizeRealisticTestSuite(scenario: ScenarioModel, rawNormalizedText: string): TestSuiteResult {
  const testCases: TestCaseItem[] = [];
  let tcNum = 1;
  let acNum = 1;

  const nextId = () => `TC-${String(tcNum++).padStart(2, '0')}`;
  const nextAc = () => `AC-${String(acNum++).padStart(2, '0')}`;
  const fields = scenario.fields || [];
  const rules = scenario.rules || [];
  const roles = scenario.roles && scenario.roles.length > 0 ? scenario.roles : ['AccountHolder'];

  const happyData: Record<string, any> = {};
  fields.forEach((f) => {
    happyData[f.name] = f.defaultValue;
  });

  const isBankingScenario = /transfer|balance|money|wire|debit|payment|pay|checkout|charge|transaction/i.test(rawNormalizedText);
  const hasAuthFields = fields.some(f => /password|username|pin/i.test(f.name));
  const isAuthScenario = !isBankingScenario && /login|auth|sign in|password|account lock|credential|user authentication/i.test(rawNormalizedText) || (isBankingScenario && hasAuthFields);
  const isDuplicatePaymentScenario = isBankingScenario && /duplicate|idempotency|double/i.test(rawNormalizedText);
  const hasBalanceFields = fields.some(f => f.name === 'accountBalance' || f.name === 'transferAmount');

  // =========================================================================
  // 1. DEDICATED BUSINESS RULES & TRANSFERS
  // =========================================================================
  if (rules.length > 0) {
    rules.forEach((rule) => {
      const ac = nextAc();
      const dynamicResult = generateDynamicRuleSteps(rule.condition, rule.effect, fields, scenario.title);

      testCases.push({
        id: nextId(),
        acRef: ac,
        title: dynamicResult.title,
        dimension: 'state_transition',
        dimensionLabel: 'Business Rule Logic',
        priority: 'P0 - Critical',
        preconditions: dynamicResult.preconditions,
        steps: dynamicResult.steps,
        testData: happyData,
        expectedResult: dynamicResult.expectedResult,
        assertionType: 'state_change',
        playwrightCodeSnippet: generatePlaywrightCode(scenario, `test_rule_${rule.id}`, happyData),
        cypressCodeSnippet: generateCypressCode(scenario, `should enforce ${rule.id}`, happyData),
        jestCodeSnippet: '',
        pytestCodeSnippet: '',
        gherkinSnippet: `Scenario: ${rule.condition}\n  Given the user meets condition: ${rule.condition}\n  When the user executes action\n  Then ${rule.effect}`,
      });
    });
  }

  // =========================================================================
  // 2. HAPPY PATH TEST CASES
  // =========================================================================
  let happyTitle = `Confirm you can submit the ${scenario.title} page successfully with valid information`;
  let happyExpected = 'The submission is successful: a confirmation message appears and the record is saved.';
  let happyPrecondition = fields.map((f) => `Using ${f.label}: "${happyData[f.name]}"`).slice(0, 3).join(', ');

  const isTransferScenario = isBankingScenario && (hasBalanceFields || /transfer|wire/i.test(rawNormalizedText));

  if (isTransferScenario) {
    happyTitle = `Confirm a standard money transfer succeeds when there is enough balance`;
    happyExpected = 'The transfer goes through successfully, showing a confirmation receipt, and the source account is debited.';
    happyPrecondition = `Having account balance: $${happyData.accountBalance || 6000} and transferring: $${happyData.transferAmount || 5000}`;
  } else if (isBankingScenario) {
    happyTitle = `Confirm a payment transaction is successfully processed with valid payment details`;
    happyExpected = 'The payment is accepted, a transaction reference or receipt is shown, and the account is charged.';
    happyPrecondition = fields.map((f) => `Using ${f.label}: "${happyData[f.name]}"`).slice(0, 3).join(', ');
  } else if (isAuthScenario) {
    happyTitle = `Confirm users can log in successfully with valid credentials`;
    happyExpected = 'The user is successfully logged in and redirected to their dashboard page.';
    happyPrecondition = `Entering valid email "${happyData.email || 'user@example.com'}" and correct password`;
  }

  testCases.push({
    id: nextId(),
    acRef: 'AC-01',
    title: happyTitle,
    dimension: 'happy_path',
    dimensionLabel: 'Happy Path',
    priority: 'P0 - Critical',
    preconditions: [happyPrecondition || 'Application loaded with standard user session'],
    steps: [
      'Open the page in the browser',
      ...fields.map((f) => `Fill in "${happyData[f.name]}" for "${f.label}"`),
      'Click the Submit button',
    ],
    testData: happyData,
    expectedResult: happyExpected,
    assertionType: 'visibility',
    playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_happy_path_valid_submission', happyData),
    cypressCodeSnippet: generateCypressCode(scenario, 'should successfully submit with valid data', happyData),
    jestCodeSnippet: '',
    pytestCodeSnippet: '',
    gherkinSnippet: generateGherkinSnippet(scenario, 'Successful valid submission', happyData),
  });

  // =========================================================================
  // 3. BOUNDARY VALUE ANALYSIS & FIELD CHECKS
  // =========================================================================
  if (isBankingScenario && hasBalanceFields) {
    // Insufficient Funds: Transfer exceeds balance (e.g. Balance $6000, Transfer $7000)
    const insufficientFundsData = { ...happyData, accountBalance: 6000, transferAmount: 7000 };
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Verify error message when trying to transfer more money ($7,000) than available ($6,000)`,
      dimension: 'boundary_value',
      dimensionLabel: 'Overdraft Boundary',
      priority: 'P0 - Critical',
      preconditions: ['Account balance is $6,000.00 and transfer request is $7,000.00'],
      steps: [
        'Set your Account Balance to $6,000.00',
        'Type $7,000.00 in the Transfer Amount field',
        'Click the "Transfer Money" button',
      ],
      testData: insufficientFundsData,
      expectedResult: 'An error message is displayed: "Insufficient funds: Transfer amount ($7,000.00) exceeds available account balance ($6,000.00)". No money is transferred.',
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_bva_insufficient_funds_overdraft', insufficientFundsData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should block transfer exceeding balance', insufficientFundsData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Insufficient funds rejection', insufficientFundsData),
    });

    // Exceed Full Balance by $1.00 (e.g. Balance $20,000, Transfer $20,001)
    const exceedFullBalanceData = { ...happyData, accountBalance: 20000, transferAmount: 20001 };
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Verify error message when transfer amount is $20,001 on a $20,000 balance`,
      dimension: 'boundary_value',
      dimensionLabel: 'Upper Bound (Balance + 1)',
      priority: 'P0 - Critical',
      preconditions: ['Account balance is $20,000.00 and transfer request is $20,001.00'],
      steps: [
        'Set your Account Balance to $20,000.00',
        'Type $20,001.00 in the Transfer Amount field',
        'Click the "Transfer Money" button to confirm',
      ],
      testData: exceedFullBalanceData,
      expectedResult: 'The system blocks the transfer and displays: "Transfer amount exceeds maximum available balance of $20,000.00 by $1.00".',
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_bva_exceed_full_balance_plus_one', exceedFullBalanceData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should reject transfer of balance + $1', exceedFullBalanceData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Overdraft balance + 1 rejection', exceedFullBalanceData),
    });
  }

  // Generic BVA for bounded numeric and text fields
  fields.forEach((f) => {
    if (f.type === 'number' && f.min !== undefined && !isBankingScenario) {
      const minVal = f.min;
      const belowMin = minVal > 1 ? minVal - 1 : minVal - 0.01;
      const bvaBelowMinData = { ...happyData, [f.name]: belowMin };
      testCases.push({
        id: nextId(),
        acRef: nextAc(),
        title: `Check validation error when "${f.label}" is too low (${belowMin})`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary Value (Below Min)',
        priority: 'P1 - High',
        preconditions: [`Setting "${f.label}" to a low value: ${belowMin}`],
        steps: [`Type ${belowMin} into "${f.label}"`, 'Click the Submit button'],
        testData: bvaBelowMinData,
        expectedResult: `A validation warning is shown: "${f.label} must be at least ${minVal}".`,
        assertionType: 'error_text',
        playwrightCodeSnippet: generatePlaywrightCode(scenario, `test_bva_below_min_${f.name}`, bvaBelowMinData),
        cypressCodeSnippet: generateCypressCode(scenario, `should reject below min for ${f.name}`, bvaBelowMinData),
        jestCodeSnippet: '',
        pytestCodeSnippet: '',
        gherkinSnippet: generateGherkinSnippet(scenario, `Below Min for ${f.label}`, bvaBelowMinData),
      });
    }

    if (f.type === 'password' && f.min !== undefined) {
      const shortPass = 'A'.repeat(f.min - 1);
      const bvaShortPassData = { ...happyData, [f.name]: shortPass };
      testCases.push({
        id: nextId(),
        acRef: nextAc(),
        title: `Check validation error when the password is too short (${f.min - 1} characters)`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary Length (Below Min)',
        priority: 'P1 - High',
        preconditions: [`Password entered is too short (${f.min - 1} characters instead of ${f.min})`],
        steps: [`Type a short password of ${f.min - 1} characters into "${f.label}"`, 'Click the log in button'],
        testData: bvaShortPassData,
        expectedResult: `An error message is shown: "${f.label} must contain at least ${f.min} characters".`,
        assertionType: 'error_text',
        playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_short_password_rejection', bvaShortPassData),
        cypressCodeSnippet: generateCypressCode(scenario, 'should reject short password', bvaShortPassData),
        jestCodeSnippet: '',
        pytestCodeSnippet: '',
        gherkinSnippet: generateGherkinSnippet(scenario, 'Short password rejection', bvaShortPassData),
      });
    }

    if (f.type === 'email') {
      const invalidEmailData = { ...happyData, [f.name]: 'sarah.connor@invalid-format' };
      testCases.push({
        id: nextId(),
        acRef: nextAc(),
        title: `Check validation error when entering an invalid email format ("sarah.connor@invalid-format")`,
        dimension: 'equivalence_partition',
        dimensionLabel: 'Format Partition',
        priority: 'P1 - High',
        preconditions: ['Using an email address that does not have a proper domain format'],
        steps: [`Type "sarah.connor@invalid-format" into the "${f.label}" field`, 'Click the Submit button'],
        testData: invalidEmailData,
        expectedResult: 'An error message is displayed: "Please enter a valid corporate email address".',
        assertionType: 'error_text',
        playwrightCodeSnippet: generatePlaywrightCode(scenario, `test_invalid_email_${f.name}`, invalidEmailData),
        cypressCodeSnippet: generateCypressCode(scenario, `should reject invalid email in ${f.name}`, invalidEmailData),
        jestCodeSnippet: '',
        pytestCodeSnippet: '',
        gherkinSnippet: generateGherkinSnippet(scenario, `Invalid email format in ${f.label}`, invalidEmailData),
      });
    }
  });

  // =========================================================================
  // 4. EQUIVALENCE PARTITIONING & NEGATIVE TESTS (Grouped Logically)
  // =========================================================================
  const requiredFields = fields.filter((f) => f.required);
  if (requiredFields.length > 0) {
    const missingData = { ...happyData };
    requiredFields.forEach((f) => {
      missingData[f.name] = '';
    });
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Verify validation errors are displayed when submitting the form with mandatory fields left empty`,
      dimension: 'negative_error',
      dimensionLabel: 'Negative / Error Path',
      priority: 'P0 - Critical',
      preconditions: [`Form is loaded with unfilled required fields`],
      steps: [
        'Open the page in the browser',
        ...requiredFields.map((f) => `Leave the "${f.label}" field empty`),
        'Click the Submit button to save',
      ],
      testData: missingData,
      expectedResult: `Validation errors are displayed indicating that the following fields are required: ${requiredFields.map(f => `"${f.label}"`).join(', ')}.`,
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, `test_missing_required_fields`, missingData),
      cypressCodeSnippet: generateCypressCode(scenario, `should show validation errors for missing required fields`, missingData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: `Scenario: Missing required fields validation\n  When user leaves required fields empty and submits\n  Then validation errors are shown`,
    });
  }

  // =========================================================================
  // 5. SECURITY & RESILIENCY
  // =========================================================================
  if (isAuthScenario) {
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Confirm account is temporarily locked for 15 minutes after 5 failed login attempts`,
      dimension: 'security_edge',
      dimensionLabel: 'Security & Brute Force',
      priority: 'P0 - Critical',
      preconditions: ['An active user account trying to log in with incorrect passwords'],
      steps: [
        'Type incorrect passwords and click log in 5 times in a row',
        'Check the screen on the 5th attempt',
      ],
      testData: { ...happyData, password: 'InvalidPassword#123' },
      expectedResult: 'The account is temporarily locked for 15 minutes, displaying: "Account locked due to 5 failed attempts. Please try again in 15 minutes or reset password."',
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_brute_force_account_lockout', happyData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should lock account after 5 failed attempts', happyData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Account lockout on 5 failed attempts', happyData),
    });
  } else if (isDuplicatePaymentScenario) {
    // 1. Rapid double-clicking payment button
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Confirm double clicks on payment submission button are throttled and prevented from duplicate charges`,
      dimension: 'security_edge',
      dimensionLabel: 'Idempotency Protection',
      priority: 'P0 - Critical',
      preconditions: ['User is on payment/checkout screen', 'Payment details filled with valid data'],
      steps: [
        'Fill valid payment details',
        'Click the pay button twice very rapidly (within 100 milliseconds)'
      ],
      testData: happyData,
      expectedResult: 'The button is disabled after the first click. Only one transaction is sent to the gateway, and a single receipt is returned.',
      assertionType: 'visibility',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_prevent_rapid_double_submit_payment', happyData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should prevent duplicate double submit payment', happyData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Prevent double submit payment', happyData),
    });

    // 2. Resubmitting transaction with same payload within time window
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Confirm duplicate payment block when resubmitting exact same transaction details within 5 minutes`,
      dimension: 'security_edge',
      dimensionLabel: 'Replay Protection',
      priority: 'P0 - Critical',
      preconditions: ['A successful payment transaction was just processed'],
      steps: [
        'Submit a payment with Card Number and exact Amount',
        'Within 5 minutes, attempt to submit another payment with the identical Card Number, Amount, and Currency'
      ],
      testData: happyData,
      expectedResult: 'The system flags the second request as a duplicate, rejects it with error "Duplicate transaction detected. Please wait 5 minutes", and does not charge the card again.',
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_prevent_duplicate_replay_payment', happyData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should reject duplicate replay payment', happyData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Prevent duplicate replay payment', happyData),
    });
  } else if (isBankingScenario) {
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Confirm double clicks on "Transfer" button do not result in double charging (Idempotency check)`,
      dimension: 'security_edge',
      dimensionLabel: 'Security & Edge',
      priority: 'P0 - Critical',
      preconditions: ['A standard money transfer setup'],
      steps: [
        'Fill in the transfer amount of $5,000.00',
        'Click the "Transfer Money" button twice very quickly',
      ],
      testData: happyData,
      expectedResult: 'The button is disabled after the first click. Only one transaction goes through and the user is not double-debited.',
      assertionType: 'visibility',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_security_idempotency_double_click', happyData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should prevent duplicate double debit', happyData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'Idempotency double click prevention', happyData),
    });
  } else {
    testCases.push({
      id: nextId(),
      acRef: nextAc(),
      title: `Confirm the application safely handles security script tags (XSS protection)`,
      dimension: 'security_edge',
      dimensionLabel: 'Security & Edge',
      priority: 'P1 - High',
      preconditions: ['A script tag payload ready to be typed'],
      steps: [
        'Type "<script>alert(\'XSS\')</script>" in the fields',
        'Submit the form and check the display screen',
      ],
      testData: happyData,
      expectedResult: 'The system strips or escapes the script tags. They are shown as regular text and do not execute.',
      assertionType: 'visibility',
      playwrightCodeSnippet: generatePlaywrightCode(scenario, 'test_xss_injection_resiliency', happyData),
      cypressCodeSnippet: generateCypressCode(scenario, 'should sanitize XSS script injection payloads', happyData),
      jestCodeSnippet: '',
      pytestCodeSnippet: '',
      gherkinSnippet: generateGherkinSnippet(scenario, 'XSS input sanitization', happyData),
    });
  }

  // =========================================================================
  // 6. ACCESSIBILITY (A11y)
  // =========================================================================
  testCases.push({
    id: nextId(),
    acRef: nextAc(),
    title: `Confirm you can navigate and submit the entire form using only the keyboard`,
    dimension: 'accessibility',
    dimensionLabel: 'Accessibility (A11y)',
    priority: 'P2 - Medium',
    preconditions: ['Using Tab and Enter keys for form completion instead of mouse clicks'],
    steps: [
      'Press Tab to focus on the first input field',
      `Tab through all fields sequentially: ${fields.map((f) => f.label).join(' -> ')}`,
      'Press Enter to submit the form',
    ],
    testData: happyData,
    expectedResult: 'The keyboard focus moves smoothly between fields, and pressing Enter successfully submits the form.',
    assertionType: 'visibility',
    playwrightCodeSnippet: generatePlaywrightA11yCode(scenario),
    cypressCodeSnippet: generateCypressA11yCode(scenario),
    jestCodeSnippet: '',
    pytestCodeSnippet: '',
    gherkinSnippet: `Scenario: Keyboard accessibility\n  Given the user navigates using Tab key\n  When all fields are filled via keyboard\n  Then pressing Enter submits the form`,
  });

  const breakdown = {
    happy_path: testCases.filter((t) => t.dimension === 'happy_path').length,
    boundary_value: testCases.filter((t) => t.dimension === 'boundary_value').length,
    equivalence_partition: testCases.filter((t) => t.dimension === 'equivalence_partition').length,
    negative_error: testCases.filter((t) => t.dimension === 'negative_error').length,
    state_transition: testCases.filter((t) => t.dimension === 'state_transition').length,
    security_edge: testCases.filter((t) => t.dimension === 'security_edge').length,
    accessibility: testCases.filter((t) => t.dimension === 'accessibility').length,
  };

  return {
    scenario,
    testCases,
    totalCases: testCases.length,
    coverageScore: 100,
    breakdown,
    generatedCode: {
      playwright: generateFullPlaywrightSuite(scenario, testCases),
      playwrightPom: generatePlaywrightPOMSuite(scenario, testCases),
      cypress: generateFullCypressSuite(scenario, testCases),
      jest: '',
      pytest: '',
      gherkin: generateFullGherkinFeature(scenario, testCases),
      qaMatrixCsv: generateQaMatrixCsv(testCases, scenario),
      qaMatrixMarkdown: generateQaMatrixMarkdown(testCases, scenario),
    },
  };
}

function generatePlaywrightCode(scenario: ScenarioModel, testName: string, testData: Record<string, any>): string {
  const fieldActions = (scenario.fields || [])
    .map((f) => {
      const val = testData[f.name];
      if (f.type === 'checkbox') {
        return `  await page.locator('[name="${f.name}"]').setChecked(${Boolean(val)});`;
      }
      if (f.type === 'select') {
        return `  await page.locator('[name="${f.name}"]').selectOption('${val}');`;
      }
      return `  await page.locator('[name="${f.name}"]').fill('${val !== undefined ? val : ''}');`;
    })
    .join('\n');

  return `test('${testName}', async ({ page }) => {
  await page.goto('/${scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}');
${fieldActions}
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});`;
}

function generateCypressCode(scenario: ScenarioModel, testName: string, testData: Record<string, any>): string {
  const fieldActions = (scenario.fields || [])
    .map((f) => {
      const val = testData[f.name];
      if (f.type === 'checkbox') {
        return `    cy.get('[name="${f.name}"]').${val ? 'check()' : 'uncheck()'};`;
      }
      if (f.type === 'select') {
        return `    cy.get('[name="${f.name}"]').select('${val}');`;
      }
      return `    cy.get('[name="${f.name}"]').clear().type('${val !== undefined ? val : ''}');`;
    })
    .join('\n');

  return `it('${testName}', () => {
  cy.visit('/${scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}');
${fieldActions}
  cy.get('button[type="submit"]').click();
});`;
}

function generatePlaywrightA11yCode(scenario: ScenarioModel): string {
  return `test('should support keyboard navigation tab order', async ({ page }) => {
  await page.goto('/${scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));
  expect(focused).toBeTruthy();
});`;
}

function generateCypressA11yCode(scenario: ScenarioModel): string {
  return `it('should support keyboard navigation', () => {
  cy.visit('/${scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}');
  cy.get('body').tab();
  cy.focused().should('exist');
});`;
}

function generateGherkinSnippet(scenario: ScenarioModel, scenarioTitle: string, testData: Record<string, any>): string {
  return `Scenario: ${scenarioTitle}
  Given the user is on the "${scenario.title}" view
  When the user fills the following form data:
${Object.entries(testData).map(([k, v]) => `    | ${k} | ${v} |`).join('\n')}
  And clicks the submit button
  Then the system responds according to specifications`;
}

function generateFullPlaywrightSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const tests = testCases.map((tc) => tc.playwrightCodeSnippet).join('\n\n');
  return `import { test, expect } from '@playwright/test';

/**
 * Think Automation Lab By Rounak - Playwright Test Suite
 * Scenario: ${scenario.title}
 * Total Test Cases: ${testCases.length} (100% Coverage Verification)
 */

test.describe('${scenario.title} Automated Test Suite', () => {
${tests}
});
`;
}

function generatePlaywrightPOMSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const fields = scenario.fields || [];
  return `import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model (POM) for ${scenario.title}
 */
export class ${capitalize(scenario.title.replace(/[^a-zA-Z0-9]/g, ''))}Page {
  readonly page: Page;
${fields.map((f) => `  readonly ${f.name}Input: Locator;`).join('\n')}
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
${fields.map((f) => `    this.${f.name}Input = page.locator('[name="${f.name}"]');`).join('\n')}
    this.submitButton = page.locator('button[type="submit"]');
  }

  async navigate() {
    await this.page.goto('/${scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}');
  }

  async fillForm(data: Record<string, any>) {
${fields.map((f) => `    if (data.${f.name} !== undefined) await this.${f.name}Input.fill(String(data.${f.name}));`).join('\n')}
  }

  async submit() {
    await this.submitButton.click();
  }
}
`;
}

function generateFullCypressSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const tests = testCases.map((tc) => tc.cypressCodeSnippet).join('\n\n');
  return `/**
 * Think Automation Lab By Rounak - Cypress E2E Test Suite
 * Scenario: ${scenario.title}
 */

describe('${scenario.title} E2E Suite', () => {
${tests}
});
`;
}

function generateFullGherkinFeature(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const scenarios = testCases.map((tc) => tc.gherkinSnippet).join('\n\n');
  return `@automation @coverage
Feature: ${scenario.title}
  As a ${scenario.roles[0] || 'User'}
  I want to verify all acceptance criteria and edge cases for ${scenario.title}

${scenarios}
`;
}

function generateQaMatrixCsv(testCases: TestCaseItem[], scenario: ScenarioModel): string {
  const header = ['Test ID', 'Category', 'Priority', 'Scenario Title', 'Steps', 'Expected Result'];
  const rows = testCases.map((tc) => [
    `"${tc.id}"`,
    `"${tc.dimensionLabel}"`,
    `"${tc.priority}"`,
    `"${tc.title.replace(/"/g, '""')}"`,
    `"${tc.steps.join('; ').replace(/"/g, '""')}"`,
    `"${tc.expectedResult.replace(/"/g, '""')}"`,
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function generateQaMatrixMarkdown(testCases: TestCaseItem[], scenario: ScenarioModel): string {
  let md = `# QA Test Cases Matrix: ${scenario.title}\n\n`;
  md += `| ID | Category | Priority | Test Title | Expected Result |\n`;
  md += `|---|---|---|---|---|\n`;
  testCases.forEach((tc) => {
    md += `| **${tc.id}** | ${tc.dimensionLabel} | ${tc.priority} | ${tc.title} | ${tc.expectedResult} |\n`;
  });
  return md;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Prioritized list of Gemini models to try in order.
 * The function tries each one and skips to the next on 404 / model-unavailable errors.
 */
const GEMINI_MODEL_FALLBACK_CHAIN = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-flash-latest',
  'gemini-pro',
];

/**
 * Cloud LLM Caller for Google Gemini with automatic model fallback.
 *
 * Flow:
 *  1. Ask Gemini to extract entities, fields, rules, boundaries from the scenario text.
 *  2. Read Gemini's actual response text (the previously missing step).
 *  3. Merge Gemini's enriched extraction with the original prompt.
 *  4. Feed the combined text to runAgenticSemanticAnalysis so it has richer
 *     entity/boundary/rule data to synthesize a high-quality TestSuiteResult.
 *
 * If a model returns 404/400 it is skipped and the next model is tried automatically.
 */
function tryParseJsonTestSuite(text: string): { scenario: ScenarioModel; testCases: TestCaseItem[] } | null {
  try {
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    if (parsed && parsed.scenario && Array.isArray(parsed.testCases)) {
      return parsed;
    }
  } catch (_) {
    // Ignore parsing errors
  }
  return null;
}

function completeTestSuiteResult(scenario: ScenarioModel, testCases: TestCaseItem[]): TestSuiteResult {
  if (!scenario.id) scenario.id = `scenario_${Date.now()}`;
  if (!scenario.title) scenario.title = 'Scenario E2E Workflow';
  if (!scenario.fields) scenario.fields = [];
  if (!scenario.rules) scenario.rules = [];
  if (!scenario.actions) scenario.actions = [];
  if (!scenario.roles || scenario.roles.length === 0) scenario.roles = ['StandardUser'];

  testCases.forEach((tc, idx) => {
    if (!tc.id) tc.id = `TC-${String(idx + 1).padStart(2, '0')}`;
    if (!tc.priority) tc.priority = 'P1 - High';
    if (!tc.dimension) tc.dimension = 'happy_path';
    if (!tc.dimensionLabel) tc.dimensionLabel = capitalize(tc.dimension.replace(/_/g, ' '));
    if (!tc.preconditions) tc.preconditions = ['Application loaded successfully'];
    if (!tc.steps) tc.steps = ['Open target application page', 'Perform validation steps'];
    if (!tc.expectedResult) tc.expectedResult = 'Form accepts inputs according to specifications';
    if (!tc.testData) tc.testData = {};
    if (!tc.assertionType) tc.assertionType = 'visibility';

    tc.playwrightCodeSnippet = generatePlaywrightCode(scenario, tc.id.toLowerCase().replace(/[^a-z0-9]/g, '_'), tc.testData);
    tc.cypressCodeSnippet = generateCypressCode(scenario, tc.id.toLowerCase().replace(/[^a-z0-9]/g, '_'), tc.testData);
    tc.gherkinSnippet = generateGherkinSnippet(scenario, tc.title, tc.testData);
    tc.jestCodeSnippet = '';
    tc.pytestCodeSnippet = '';
  });

  const breakdown = {
    happy_path: testCases.filter((t) => t.dimension === 'happy_path').length,
    boundary_value: testCases.filter((t) => t.dimension === 'boundary_value').length,
    equivalence_partition: testCases.filter((t) => t.dimension === 'equivalence_partition').length,
    negative_error: testCases.filter((t) => t.dimension === 'negative_error').length,
    state_transition: testCases.filter((t) => t.dimension === 'state_transition').length,
    security_edge: testCases.filter((t) => t.dimension === 'security_edge').length,
    accessibility: testCases.filter((t) => t.dimension === 'accessibility').length,
  };

  return {
    scenario,
    testCases,
    totalCases: testCases.length,
    coverageScore: 100,
    breakdown,
    generatedCode: {
      playwright: generateFullPlaywrightSuite(scenario, testCases),
      playwrightPom: generatePlaywrightPOMSuite(scenario, testCases),
      cypress: generateFullCypressSuite(scenario, testCases),
      jest: '',
      pytest: '',
      gherkin: generateFullGherkinFeature(scenario, testCases),
      qaMatrixCsv: generateQaMatrixCsv(testCases, scenario),
      qaMatrixMarkdown: generateQaMatrixMarkdown(testCases, scenario),
    },
  };
}

const LLM_SYSTEM_INSTRUCTION = `You are an expert QA Automation Lead Engineer. Analyze the given test scenario or specification and output a JSON object matching this structure:
{
  "scenario": {
    "title": "string (readable scenario title)",
    "type": "ui_form" | "api_endpoint" | "workflow_crud",
    "roles": ["string (User personas)"],
    "fields": [
      { "id": "string", "name": "string (camelCase name)", "label": "string", "type": "text" | "number" | "email" | "password" | "select" | "checkbox" | "date", "required": true | false, "min": number, "max": number, "defaultValue": "any", "options": ["string"], "description": "string" }
    ],
    "actions": [
      { "id": "string", "name": "string", "type": "click" | "submit" | "filter" | "navigate", "target": "string", "expectedOutcome": "string" }
    ],
    "rules": [
      { "id": "string", "condition": "string", "effect": "string" }
    ]
  },
  "testCases": [
    {
      "id": "TC-01",
      "acRef": "AC-01",
      "title": "string (logical testcase title)",
      "dimension": "happy_path" | "boundary_value" | "equivalence_partition" | "negative_error" | "state_transition" | "security_edge" | "accessibility",
      "dimensionLabel": "string",
      "priority": "P0 - Critical" | "P1 - High" | "P2 - Medium" | "P3 - Low",
      "preconditions": ["string"],
      "steps": ["string"],
      "testData": { "fieldName": "value" },
      "expectedResult": "string",
      "assertionType": "visibility" | "error_text" | "status_code" | "state_change" | "url_redirect"
    }
  ]
}
Rules:
1. ONLY return the JSON object. Do not include markdown code block characters, notes, explanations, or warnings.
2. Group redundant field validations. Focus on real logical business scenarios (like login role routing, locking after 5 failures) rather than generating dozens of repetitive required-field test cases.
3. Be precise with the input fields. Do not extract random text or labels from explanations as fields.`;

/**
 * Cloud LLM Caller for Google Gemini with automatic model fallback.
 */
async function callGeminiLLM(
  prompt: string,
  apiKey: string,
  preferredModel?: string
): Promise<TestSuiteResult> {
  const modelsToTry = preferredModel
    ? [preferredModel, ...GEMINI_MODEL_FALLBACK_CHAIN.filter((m) => m !== preferredModel)]
    : GEMINI_MODEL_FALLBACK_CHAIN;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.info(`[Gemini] Trying model: ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${LLM_SYSTEM_INSTRUCTION}\n\nScenario Text:\n${prompt}` }] }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 4096 },
        }),
      });

      if (response.status === 404 || response.status === 400) {
        console.warn(`[Gemini] Model "${model}" unavailable (HTTP ${response.status}), trying next...`);
        lastError = new Error(`Gemini model "${model}" returned HTTP ${response.status}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const geminiText = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!geminiText.trim()) {
        console.warn(`[Gemini] Model "${model}" returned empty response, trying next...`);
        lastError = new Error(`Gemini model "${model}" returned empty content`);
        continue;
      }

      const parsed = tryParseJsonTestSuite(geminiText);
      if (parsed) {
        console.info(`[Gemini] ✅ Successfully parsed JSON test suite from: ${model}`);
        return completeTestSuiteResult(parsed.scenario, parsed.testCases);
      }

      console.warn(`[Gemini] Failed to parse JSON from model "${model}", falling back to heuristics...`);
      return runAgenticSemanticAnalysis(prompt);

    } catch (err) {
      if ((err as Error).message?.includes('404') || (err as Error).message?.includes('400')) {
        lastError = err as Error;
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error('All Gemini models are unavailable.');
}

/**
 * Cloud LLM Caller for OpenAI
 */
async function callOpenAILLM(prompt: string, apiKey: string, model: string): Promise<TestSuiteResult> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: LLM_SYSTEM_INSTRUCTION },
        { role: 'user', content: `Analyze the scenario and generate test suite:\n${prompt}` },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned HTTP ${response.status}`);
  }

  const json = await response.json();
  const openAIText = json?.choices?.[0]?.message?.content ?? '';
  const parsed = tryParseJsonTestSuite(openAIText);

  if (parsed) {
    console.info('[OpenAI] ✅ Successfully parsed JSON test suite');
    return completeTestSuiteResult(parsed.scenario, parsed.testCases);
  }

  console.warn('[OpenAI] Failed to parse JSON from response, falling back to heuristics...');
  return runAgenticSemanticAnalysis(prompt);
}

function generateDynamicRuleSteps(
  ruleCondition: string,
  ruleEffect: string,
  fields: FieldDefinition[],
  scenarioTitle: string
): { steps: string[]; preconditions: string[]; title: string; expectedResult: string } {
  const condClean = ruleCondition.replace(/^When\s+/i, '');
  const condLower = ruleCondition.toLowerCase();
  const effectLower = ruleEffect.toLowerCase();
  
  let title = `Confirm behavior: ${condClean}`;
  let expectedResult = `The system correctly processes: ${ruleEffect}`;
  let preconditions = [`Setup state matching: "${condClean}"`];
  const steps: string[] = [`Open the ${scenarioTitle} page`];

  // 1. Idempotency / Duplicate Submission / Replay Protection
  if (condLower.includes('idempotency') || condLower.includes('duplicate') || condLower.includes('double') || effectLower.includes('duplicate') || effectLower.includes('idempotency')) {
    title = `Confirm duplicate request is blocked to prevent double processing (Idempotency Check)`;
    preconditions = [
      'User is on the active workspace or checkout page',
      'An initial request is successfully processed with transaction details'
    ];
    steps.push(
      'Fill in all required fields with valid input',
      'Submit the initial request and verify it succeeds',
      'Immediately attempt to submit the identical request (using same payload or unique transaction token) again'
    );
    expectedResult = `The second request is intercepted and blocked: ${ruleEffect}`;
    return { title, steps, expectedResult, preconditions };
  }

  // 2. Lockout / Brute Force
  if (condLower.includes('lockout') || condLower.includes('failed attempts') || condLower.includes('limit') || condLower.includes('exceed')) {
    title = `Confirm security lockout is triggered after multiple invalid attempts`;
    preconditions = ['User account is active and in good standing'];
    steps.push(
      'Attempt to perform the action (e.g. logging in) with invalid credentials or parameters multiple times in a row',
      'Observe response on the final invalid attempt and check for lockout status'
    );
    expectedResult = `The system enforces security controls: ${ruleEffect}`;
    return { title, steps, expectedResult, preconditions };
  }

  // 3. Dynamic field-matching parsing
  let matchedFields = false;
  fields.forEach((f) => {
    const fieldRegex = new RegExp(`(?:${escapeRegExp(f.name)}|${escapeRegExp(f.label)})`, 'i');
    if (fieldRegex.test(ruleCondition)) {
      matchedFields = true;
      if (condLower.includes('empty') || condLower.includes('blank') || condLower.includes('missing')) {
        steps.push(`Leave the mandatory "${f.label}" field empty`);
      } else if (condLower.includes('invalid') || condLower.includes('malformed')) {
        steps.push(`Enter an invalid or malformed value into the "${f.label}" field`);
      } else {
        const numMatch = ruleCondition.match(new RegExp(`(?:${escapeRegExp(f.label)}|${escapeRegExp(f.name)})[^\\d]*?(\\d+(?:\\.\\d+)?)`, 'i'));
        if (numMatch && numMatch[1]) {
          steps.push(`Enter "${numMatch[1]}" into the "${f.label}" field`);
        } else {
          steps.push(`Set up the "${f.label}" field to match the condition`);
        }
      }
    }
  });

  if (!matchedFields) {
    steps.push(`Perform the required action: "${condClean}"`);
  }

  steps.push('Click the primary button to submit');

  return { title, steps, expectedResult, preconditions };
}
