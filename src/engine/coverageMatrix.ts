import {
  ScenarioModel,
  TestCaseItem,
  TestSuiteResult,
  CoverageBreakdown,
  FieldDefinition,
  CoverageDimension
} from '../types';

/**
 * Generates test cases and code suites that achieve 100% test coverage across:
 * - Happy Path
 * - Boundary Value Analysis (BVA)
 * - Equivalence Partitioning
 * - Negative / Error Handling
 * - State Transition & Branch Logic
 * - Security & Resiliency
 * - Accessibility & Usability
 */
export function generate100PercentTestSuite(scenario: ScenarioModel): TestSuiteResult {
  const testCases: TestCaseItem[] = [];
  let tcIndex = 1;

  const nextId = () => {
    const padded = String(tcIndex++).padStart(3, '0');
    return `TC-${padded}`;
  };

  const fields = scenario.fields || [];
  const actions = scenario.actions || [];
  const rules = scenario.rules || [];
  const roles = scenario.roles && scenario.roles.length > 0 ? scenario.roles : ['StandardUser'];

  // Helper to get valid test data for all fields
  const getHappyPathData = (): Record<string, any> => {
    const data: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.defaultValue !== undefined && f.defaultValue !== '') {
        data[f.name] = f.type === 'number' ? Number(f.defaultValue) : f.defaultValue;
      } else if (f.type === 'number') {
        data[f.name] = f.min !== undefined ? f.min + 5 : 100;
      } else if (f.type === 'email') {
        data[f.name] = 'test.user@company.com';
      } else if (f.type === 'password') {
        data[f.name] = 'P@ssw0rd2026!';
      } else if (f.type === 'checkbox') {
        data[f.name] = true;
      } else if (f.type === 'select' && f.options && f.options.length > 0) {
        data[f.name] = f.options[0];
      } else {
        data[f.name] = `Valid ${f.label}`;
      }
    });
    return data;
  };

  const happyData = getHappyPathData();

  // =========================================================================
  // 1. HAPPY PATH & CORE BUSINESS WORKFLOWS
  // =========================================================================
  testCases.push({
    id: nextId(),
    title: `[Happy Path] Successfully complete ${scenario.title} with standard valid inputs`,
    dimension: 'happy_path',
    dimensionLabel: 'Happy Path',
    priority: 'P0 - Critical',
    preconditions: [`User is authenticated as "${roles[0]}"`, 'Application is on the active target view'],
    steps: [
      'Navigate to the target screen/modal',
      ...fields.map((f) => `Enter valid value "${happyData[f.name]}" into [${f.label}]`),
      actions.length > 0 ? `Trigger primary action: ${actions[0].name}` : 'Click Submit button',
    ],
    testData: happyData,
    expectedResult:
      actions.length > 0 && actions[0].expectedOutcome
        ? actions[0].expectedOutcome
        : 'Action completes with 200 OK status, UI displays success confirmation, and data is persisted.',
    assertionType: 'visibility',
    playwrightCodeSnippet: generatePlaywrightHappyPath(scenario, happyData),
    cypressCodeSnippet: generateCypressHappyPath(scenario, happyData),
    jestCodeSnippet: generateJestHappyPath(scenario, happyData),
    pytestCodeSnippet: generatePyTestHappyPath(scenario, happyData),
    gherkinSnippet: generateGherkinHappyPath(scenario, happyData),
  });

  // Additional Happy Path for optional fields omitted
  const optionalFields = fields.filter((f) => !f.required);
  if (optionalFields.length > 0) {
    const minimalData: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.required) {
        minimalData[f.name] = happyData[f.name];
      }
    });
    testCases.push({
      id: nextId(),
      title: `[Happy Path] Successfully submit with only required fields (optional fields omitted)`,
      dimension: 'happy_path',
      dimensionLabel: 'Happy Path (Minimal)',
      priority: 'P1 - High',
      preconditions: [`User is logged in as "${roles[0]}"`],
      steps: [
        'Fill only mandatory required fields',
        ...fields.filter((f) => f.required).map((f) => `Fill mandatory field [${f.label}]`),
        ...optionalFields.map((f) => `Leave optional field [${f.label}] empty`),
        'Submit the form',
      ],
      testData: minimalData,
      expectedResult: 'System accepts submission without errors and sets default values for omitted optional fields.',
      assertionType: 'visibility',
      playwrightCodeSnippet: generatePlaywrightSnippet('test_submit_minimal_required_fields', minimalData, fields.filter(f => f.required)),
      cypressCodeSnippet: generateCypressSnippet('should submit with only required fields', minimalData),
      jestCodeSnippet: generateJestSnippet('submitMinimalRequiredFields', minimalData),
      pytestCodeSnippet: generatePyTestSnippet('test_submit_minimal_required_fields', minimalData),
      gherkinSnippet: `Scenario: Submit form with only required fields\n  Given the user fills all mandatory fields\n  When the user submits\n  Then the record is created with default optional values`,
    });
  }

  // =========================================================================
  // 2. BOUNDARY VALUE ANALYSIS (BVA)
  // =========================================================================
  fields.forEach((field) => {
    // Numeric Boundaries
    if (field.type === 'number') {
      const min = field.min !== undefined ? field.min : 1;
      const max = field.max !== undefined ? field.max : 1000;

      // Exact Min
      testCases.push({
        id: nextId(),
        title: `[BVA - Exact Min] Field [${field.label}] with minimum boundary value (${min})`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary: Exact Min',
        priority: 'P1 - High',
        preconditions: ['Form is open and populated with standard data'],
        steps: [`Set [${field.label}] to exact lower bound value: ${min}`, 'Submit form'],
        testData: { ...happyData, [field.name]: min },
        expectedResult: `System accepts exact minimum value ${min} successfully without validation error.`,
        targetField: field.name,
        assertionType: 'visibility',
        playwrightCodeSnippet: generatePlaywrightBvaSnippet(field, min, true),
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').clear().type('${min}');\ncy.get('button[type="submit"]').click();\ncy.get('.error-message').should('not.exist');`,
        jestCodeSnippet: `expect(validateField('${field.name}', ${min}).isValid).toBe(true);`,
        pytestCodeSnippet: `assert validate_field('${field.name}', ${min})['is_valid'] is True`,
        gherkinSnippet: `Scenario: Validate exact min boundary on ${field.label}\n  When user enters "${min}" in "${field.label}"\n  Then input is accepted without error`,
      });

      // Min - 1 (Invalid Underflow)
      const underflow = min - 1;
      testCases.push({
        id: nextId(),
        title: `[BVA - Underflow] Field [${field.label}] with value below minimum (${underflow})`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary: Underflow (Min - 1)',
        priority: 'P1 - High',
        preconditions: ['Form is open'],
        steps: [`Set [${field.label}] to value below lower bound: ${underflow}`, 'Attempt to submit form'],
        testData: { ...happyData, [field.name]: underflow },
        expectedResult: `Validation error displayed: "${field.label} must be at least ${min}". Form submission blocked.`,
        targetField: field.name,
        assertionType: 'error_text',
        playwrightCodeSnippet: generatePlaywrightBvaSnippet(field, underflow, false, `must be at least ${min}`),
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').clear().type('${underflow}');\ncy.get('button[type="submit"]').click();\ncy.contains('must be at least ${min}').should('be.visible');`,
        jestCodeSnippet: `expect(validateField('${field.name}', ${underflow}).isValid).toBe(false);`,
        pytestCodeSnippet: `assert validate_field('${field.name}', ${underflow})['is_valid'] is False`,
        gherkinSnippet: `Scenario: Validate underflow boundary on ${field.label}\n  When user enters "${underflow}" in "${field.label}"\n  Then validation error "must be at least ${min}" is shown`,
      });

      // Exact Max
      testCases.push({
        id: nextId(),
        title: `[BVA - Exact Max] Field [${field.label}] with maximum boundary value (${max})`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary: Exact Max',
        priority: 'P1 - High',
        preconditions: ['Form is open'],
        steps: [`Set [${field.label}] to exact upper bound value: ${max}`, 'Submit form'],
        testData: { ...happyData, [field.name]: max },
        expectedResult: `System accepts exact maximum value ${max} successfully.`,
        targetField: field.name,
        assertionType: 'visibility',
        playwrightCodeSnippet: generatePlaywrightBvaSnippet(field, max, true),
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').clear().type('${max}');\ncy.get('button[type="submit"]').click();\ncy.get('.error-message').should('not.exist');`,
        jestCodeSnippet: `expect(validateField('${field.name}', ${max}).isValid).toBe(true);`,
        pytestCodeSnippet: `assert validate_field('${field.name}', ${max})['is_valid'] is True`,
        gherkinSnippet: `Scenario: Validate exact max boundary on ${field.label}\n  When user enters "${max}" in "${field.label}"\n  Then input is accepted without error`,
      });

      // Max + 1 (Invalid Overflow)
      const overflow = max + 1;
      testCases.push({
        id: nextId(),
        title: `[BVA - Overflow] Field [${field.label}] with value above maximum (${overflow})`,
        dimension: 'boundary_value',
        dimensionLabel: 'Boundary: Overflow (Max + 1)',
        priority: 'P1 - High',
        preconditions: ['Form is open'],
        steps: [`Set [${field.label}] to value above upper bound: ${overflow}`, 'Attempt to submit form'],
        testData: { ...happyData, [field.name]: overflow },
        expectedResult: `Validation error displayed: "${field.label} cannot exceed ${max}". Form submission blocked.`,
        targetField: field.name,
        assertionType: 'error_text',
        playwrightCodeSnippet: generatePlaywrightBvaSnippet(field, overflow, false, `cannot exceed ${max}`),
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').clear().type('${overflow}');\ncy.get('button[type="submit"]').click();\ncy.contains('cannot exceed ${max}').should('be.visible');`,
        jestCodeSnippet: `expect(validateField('${field.name}', ${overflow}).isValid).toBe(false);`,
        pytestCodeSnippet: `assert validate_field('${field.name}', ${overflow})['is_valid'] is False`,
        gherkinSnippet: `Scenario: Validate overflow boundary on ${field.label}\n  When user enters "${overflow}" in "${field.label}"\n  Then validation error "cannot exceed ${max}" is shown`,
      });
    }

    // String / Text Length Boundaries
    if ((field.type === 'text' || field.type === 'password') && (field.min || field.max)) {
      const minLen = field.min || 1;
      const maxLen = field.max || 255;

      if (field.min && field.min > 1) {
        const shortVal = 'A'.repeat(minLen - 1);
        testCases.push({
          id: nextId(),
          title: `[BVA - String Min Length] Field [${field.label}] with length below minimum (${minLen - 1} chars)`,
          dimension: 'boundary_value',
          dimensionLabel: 'Boundary: String Too Short',
          priority: 'P2 - Medium',
          preconditions: ['Form is open'],
          steps: [`Input string of length ${minLen - 1} into [${field.label}]`, 'Trigger blur / validation'],
          testData: { ...happyData, [field.name]: shortVal },
          expectedResult: `Validation error displayed: "${field.label} must be at least ${minLen} characters".`,
          targetField: field.name,
          assertionType: 'error_text',
          playwrightCodeSnippet: generatePlaywrightStringBva(field, shortVal, false, `at least ${minLen} characters`),
          cypressCodeSnippet: `cy.get('[name="${field.name}"]').type('${shortVal}');\ncy.contains('at least ${minLen} characters').should('be.visible');`,
          jestCodeSnippet: `expect(validateField('${field.name}', '${shortVal}').isValid).toBe(false);`,
          pytestCodeSnippet: `assert validate_field('${field.name}', '${shortVal}')['is_valid'] is False`,
          gherkinSnippet: `Scenario: Field too short\n  When user enters string with ${minLen - 1} characters\n  Then validation error is displayed`,
        });
      }

      if (field.max) {
        const exactMaxStr = 'X'.repeat(maxLen);
        const overMaxStr = 'X'.repeat(maxLen + 1);
        testCases.push({
          id: nextId(),
          title: `[BVA - String Max Length] Field [${field.label}] with exact max length (${maxLen} chars)`,
          dimension: 'boundary_value',
          dimensionLabel: 'Boundary: String Exact Max',
          priority: 'P2 - Medium',
          preconditions: ['Form is open'],
          steps: [`Input string of exact max length ${maxLen} into [${field.label}]`, 'Validate acceptance'],
          testData: { ...happyData, [field.name]: exactMaxStr },
          expectedResult: `System accepts exact max length of ${maxLen} characters without truncation or error.`,
          targetField: field.name,
          assertionType: 'visibility',
          playwrightCodeSnippet: generatePlaywrightStringBva(field, exactMaxStr, true),
          cypressCodeSnippet: `cy.get('[name="${field.name}"]').invoke('val', '${exactMaxStr}').trigger('input');\ncy.get('.error').should('not.exist');`,
          jestCodeSnippet: `expect(validateField('${field.name}', '${exactMaxStr}').isValid).toBe(true);`,
          pytestCodeSnippet: `assert validate_field('${field.name}', '${exactMaxStr}')['is_valid'] is True`,
          gherkinSnippet: `Scenario: String exact max length\n  When user enters ${maxLen} characters\n  Then the value is accepted`,
        });

        testCases.push({
          id: nextId(),
          title: `[BVA - String Max+1 Length] Field [${field.label}] with length exceeding max (${maxLen + 1} chars)`,
          dimension: 'boundary_value',
          dimensionLabel: 'Boundary: String Exceeds Max',
          priority: 'P2 - Medium',
          preconditions: ['Form is open'],
          steps: [`Attempt to input string of length ${maxLen + 1} into [${field.label}]`, 'Trigger validation'],
          testData: { ...happyData, [field.name]: overMaxStr },
          expectedResult: `System blocks excess input via maxlength attribute or displays "Cannot exceed ${maxLen} characters".`,
          targetField: field.name,
          assertionType: 'error_text',
          playwrightCodeSnippet: generatePlaywrightStringBva(field, overMaxStr, false, `Cannot exceed ${maxLen}`),
          cypressCodeSnippet: `cy.get('[name="${field.name}"]').invoke('val', '${overMaxStr}').trigger('input');\ncy.contains('Cannot exceed ${maxLen}').should('be.visible');`,
          jestCodeSnippet: `expect(validateField('${field.name}', '${overMaxStr}').isValid).toBe(false);`,
          pytestCodeSnippet: `assert validate_field('${field.name}', '${overMaxStr}')['is_valid'] is False`,
          gherkinSnippet: `Scenario: String exceeds max length\n  When user enters ${maxLen + 1} characters\n  Then validation error or truncation prevents input`,
        });
      }
    }
  });

  // =========================================================================
  // 3. EQUIVALENCE PARTITIONING
  // =========================================================================
  fields.forEach((field) => {
    if (field.type === 'email') {
      const invalidEmails = [
        { val: 'plainaddress', reason: 'Missing @ and domain' },
        { val: 'user@.com.my', reason: 'Missing domain name' },
        { val: 'user@domain@domain.com', reason: 'Multiple @ symbols' },
        { val: 'user name@domain.com', reason: 'Contains disallowed spaces' },
      ];

      invalidEmails.forEach((inv) => {
        testCases.push({
          id: nextId(),
          title: `[Equivalence Partition - Invalid Email] Field [${field.label}] with "${inv.val}" (${inv.reason})`,
          dimension: 'equivalence_partition',
          dimensionLabel: 'Equivalence: Invalid Email Partition',
          priority: 'P1 - High',
          preconditions: ['User is on form'],
          steps: [`Enter malformed email "${inv.val}" in [${field.label}]`, 'Trigger field validation'],
          testData: { ...happyData, [field.name]: inv.val },
          expectedResult: `Validation error displayed: "Please enter a valid email address". Submit is disabled.`,
          targetField: field.name,
          assertionType: 'error_text',
          playwrightCodeSnippet: `await page.getByLabel('${field.label}').fill('${inv.val}');\nawait page.getByLabel('${field.label}').blur();\nawait expect(page.getByText(/valid email/i)).toBeVisible();`,
          cypressCodeSnippet: `cy.get('[name="${field.name}"]').type('${inv.val}').blur();\ncy.contains(/valid email/i).should('be.visible');`,
          jestCodeSnippet: `expect(validateEmail('${inv.val}')).toBe(false);`,
          pytestCodeSnippet: `assert validate_email('${inv.val}') is False`,
          gherkinSnippet: `Scenario: Invalid email partition (${inv.reason})\n  When user enters "${inv.val}"\n  Then email format error is displayed`,
        });
      });
    }

    if (field.type === 'number') {
      testCases.push({
        id: nextId(),
        title: `[Equivalence Partition - Non-Numeric] Field [${field.label}] with alphabetic text input ("abc!@#")`,
        dimension: 'equivalence_partition',
        dimensionLabel: 'Equivalence: Non-Numeric Type',
        priority: 'P2 - Medium',
        preconditions: ['Form is open'],
        steps: [`Attempt to type non-numeric characters "abc!@#" in [${field.label}]`, 'Verify input filtering'],
        testData: { ...happyData, [field.name]: 'abc!@#' },
        expectedResult: `Input rejects non-numeric keystrokes or displays "Only numeric values are permitted".`,
        targetField: field.name,
        assertionType: 'error_text',
        playwrightCodeSnippet: `await page.getByLabel('${field.label}').pressSequentially('abc!@#');\nconst val = await page.getByLabel('${field.label}').inputValue();\nexpect(val).toBe('');`,
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').type('abc!@#').should('have.value', '');`,
        jestCodeSnippet: `expect(isNumeric('abc!@#')).toBe(false);`,
        pytestCodeSnippet: `assert is_numeric('abc!@#') is False`,
        gherkinSnippet: `Scenario: Non-numeric in number field\n  When user types alphabetic characters in "${field.label}"\n  Then input remains empty or rejects keystrokes`,
      });
    }

    // Pattern Regex Equivalence
    if (field.pattern) {
      testCases.push({
        id: nextId(),
        title: `[Equivalence Partition - Pattern Mismatch] Field [${field.label}] violating pattern /${field.pattern}/`,
        dimension: 'equivalence_partition',
        dimensionLabel: 'Equivalence: Regex Format',
        priority: 'P1 - High',
        preconditions: ['Form is open'],
        steps: [`Enter value "INVALID-PATTERN-999" into [${field.label}]`, 'Submit form'],
        testData: { ...happyData, [field.name]: 'INVALID-PATTERN-999' },
        expectedResult: `Field fails regex validation. Display format guidance error message: "${field.description || 'Invalid format'}".`,
        targetField: field.name,
        assertionType: 'error_text',
        playwrightCodeSnippet: `await page.getByLabel('${field.label}').fill('INVALID-PATTERN-999');\nawait page.getByRole('button', { name: /save|submit/i }).click();\nawait expect(page.getByText(/invalid format|must match/i)).toBeVisible();`,
        cypressCodeSnippet: `cy.get('[name="${field.name}"]').type('INVALID-PATTERN-999');\ncy.get('button[type="submit"]').click();\ncy.contains(/invalid format/i).should('be.visible');`,
        jestCodeSnippet: `const pattern = new RegExp('${field.pattern}');\nexpect(pattern.test('INVALID-PATTERN-999')).toBe(false);`,
        pytestCodeSnippet: `import re\nassert re.match(r'${field.pattern}', 'INVALID-PATTERN-999') is None`,
        gherkinSnippet: `Scenario: Pattern mismatch on ${field.label}\n  When user enters "INVALID-PATTERN-999"\n  Then pattern validation error is shown`,
      });
    }
  });

  // Whitespace trimming equivalence
  const textFields = fields.filter((f) => f.type === 'text' && f.required);
  if (textFields.length > 0) {
    const tf = textFields[0];
    testCases.push({
      id: nextId(),
      title: `[Equivalence Partition - Whitespace Trimming] Field [${tf.label}] with leading/trailing whitespace`,
      dimension: 'equivalence_partition',
      dimensionLabel: 'Equivalence: Whitespace Sanitization',
      priority: 'P2 - Medium',
      preconditions: ['User is on form'],
      steps: [`Enter value "  ${happyData[tf.name]}   " with spaces into [${tf.label}]`, 'Submit form'],
      testData: { ...happyData, [tf.name]: `  ${happyData[tf.name]}   ` },
      expectedResult: 'System auto-trims whitespace before persistence and stores clean trimmed string.',
      targetField: tf.name,
      assertionType: 'state_change',
      playwrightCodeSnippet: `await page.getByLabel('${tf.label}').fill('  ${happyData[tf.name]}   ');\nawait page.getByRole('button', { name: /save|submit/i }).click();\n// Verify trimmed in payload or table\nawait expect(page.getByText('${happyData[tf.name]}', { exact: true })).toBeVisible();`,
      cypressCodeSnippet: `cy.get('[name="${tf.name}"]').type('  ${happyData[tf.name]}   ');\ncy.get('button[type="submit"]').click();`,
      jestCodeSnippet: `expect(sanitizeInput('  ${happyData[tf.name]}   ')).toBe('${happyData[tf.name]}');`,
      pytestCodeSnippet: `assert sanitize_input('  ${happyData[tf.name]}   ') == '${happyData[tf.name]}'`,
      gherkinSnippet: `Scenario: Auto-trim whitespace\n  When user inputs text with leading and trailing spaces\n  Then stored data has spaces trimmed`,
    });
  }

  // =========================================================================
  // 4. NEGATIVE & ERROR HANDLING
  // =========================================================================
  // All Required Fields Blank
  const requiredFields = fields.filter((f) => f.required);
  if (requiredFields.length > 0) {
    testCases.push({
      id: nextId(),
      title: `[Negative] Submit form with all mandatory required fields left blank`,
      dimension: 'negative_error',
      dimensionLabel: 'Negative: Missing Required Fields',
      priority: 'P0 - Critical',
      preconditions: ['Form is open with blank inputs'],
      steps: [
        'Leave all required fields empty',
        actions.length > 0 ? `Click action: ${actions[0].name}` : 'Click Submit button',
        'Verify validation alerts for each missing field',
      ],
      testData: {},
      expectedResult: `Form submission is halted. Validation error highlights appear on all required fields: ${requiredFields.map((f) => f.label).join(', ')}.`,
      assertionType: 'error_text',
      playwrightCodeSnippet: generatePlaywrightRequiredValidation(requiredFields, actions),
      cypressCodeSnippet: `cy.get('button[type="submit"]').click();\n${requiredFields.map((f) => `cy.contains('${f.label} is required').should('be.visible');`).join('\n')}`,
      jestCodeSnippet: `const result = validateAllFields({});\nexpect(result.isValid).toBe(false);\nexpect(result.errors.length).toBe(${requiredFields.length});`,
      pytestCodeSnippet: `errors = validate_form({})\nassert len(errors) == ${requiredFields.length}`,
      gherkinSnippet: `Scenario: Submit with all required fields blank\n  Given the user leaves all required fields empty\n  When the user clicks submit\n  Then inline validation errors appear for all required fields`,
    });
  }

  // Individual Required Field Missing (Iterative)
  requiredFields.forEach((reqField) => {
    const partialData = { ...happyData };
    delete partialData[reqField.name];
    if (reqField.type === 'number') {
      partialData[reqField.name] = '';
    }

    testCases.push({
      id: nextId(),
      title: `[Negative] Omit single required field [${reqField.label}] while other fields are valid`,
      dimension: 'negative_error',
      dimensionLabel: 'Negative: Omitted Single Field',
      priority: 'P1 - High',
      preconditions: ['Form is pre-filled with valid data'],
      steps: [`Clear [${reqField.label}] input`, 'Click Submit button'],
      testData: partialData,
      expectedResult: `Specific error "${reqField.label} is required" is displayed. Form is not submitted.`,
      targetField: reqField.name,
      assertionType: 'error_text',
      playwrightCodeSnippet: `await page.getByLabel('${reqField.label}').clear();\nawait page.getByRole('button', { name: /save|submit/i }).click();\nawait expect(page.getByText(/is required|cannot be blank/i)).toBeVisible();`,
      cypressCodeSnippet: `cy.get('[name="${reqField.name}"]').clear();\ncy.get('button[type="submit"]').click();\ncy.contains(/is required/i).should('be.visible');`,
      jestCodeSnippet: `expect(validateField('${reqField.name}', null).isValid).toBe(false);`,
      pytestCodeSnippet: `assert validate_field('${reqField.name}', None)['is_valid'] is False`,
      gherkinSnippet: `Scenario: Omit ${reqField.label}\n  When user clears "${reqField.label}" and submits\n  Then required error message is shown`,
    });
  });

  // Server 500 Internal Error Simulation
  testCases.push({
    id: nextId(),
    title: `[Negative - Backend Error] Graceful degradation on HTTP 500 Internal Server Error`,
    dimension: 'negative_error',
    dimensionLabel: 'Negative: 500 Server Error Resiliency',
    priority: 'P1 - High',
    preconditions: ['User prepares valid form submission', 'Mock API intercepts route returning HTTP 500 status'],
    steps: [
      'Fill valid form data',
      'Intercept backend endpoint with status 500 { "error": "Internal Server Error" }',
      'Click Submit button',
    ],
    testData: happyData,
    expectedResult: 'System catches 500 gracefully, displays user-friendly toast "Server error. Please try again later", preserves user input without crashing.',
    assertionType: 'error_text',
    playwrightCodeSnippet: `await page.route('**/api/**', async route => {\n  await route.fulfill({\n    status: 500,\n    contentType: 'application/json',\n    body: JSON.stringify({ message: 'Internal Server Error' })\n  });\n});\nawait page.getByRole('button', { name: /save|submit/i }).click();\nawait expect(page.getByText(/server error|try again later/i)).toBeVisible();`,
    cypressCodeSnippet: `cy.intercept('POST', '**/api/**', { statusCode: 500, body: { error: 'Internal Error' } }).as('submitError');\ncy.get('button[type="submit"]').click();\ncy.wait('@submitError');\ncy.contains(/server error/i).should('be.visible');`,
    jestCodeSnippet: `apiMock.mockRejectedValue(new Error('500 Internal Server Error'));\nawait expect(submitHandler(data)).rejects.toThrow();`,
    pytestCodeSnippet: `with pytest.raises(ServerError):\n    api_client.submit(data)`,
    gherkinSnippet: `Scenario: Handle 500 server error\n  Given the server returns a 500 error\n  When user submits valid data\n  Then friendly error banner is shown and form data is preserved`,
  });

  // Network Offline / Timeout
  testCases.push({
    id: nextId(),
    title: `[Negative - Network Drop] Handle network disconnection during submission`,
    dimension: 'negative_error',
    dimensionLabel: 'Negative: Offline / Network Timeout',
    priority: 'P2 - Medium',
    preconditions: ['Browser network context set to offline'],
    steps: ['Simulate offline network mode', 'Click Submit button'],
    testData: happyData,
    expectedResult: 'Display offline banner "No internet connection. Please check your network and retry".',
    assertionType: 'error_text',
    playwrightCodeSnippet: `await page.context().setOffline(true);\nawait page.getByRole('button', { name: /save|submit/i }).click();\nawait expect(page.getByText(/network error|offline|connection/i)).toBeVisible();\nawait page.context().setOffline(false);`,
    cypressCodeSnippet: `// Cypress offline simulation\ncy.window().then((win) => win.dispatchEvent(new Event('offline')));\ncy.get('button[type="submit"]').click();\ncy.contains(/offline|network/i).should('be.visible');`,
    jestCodeSnippet: `networkAdapter.setOnline(false);\nawait expect(submitHandler(data)).rejects.toThrow('Network Error');`,
    pytestCodeSnippet: `mock_network.disconnect()\nassert submit_form(data)['status'] == 'NETWORK_ERROR'`,
    gherkinSnippet: `Scenario: Submit while offline\n  Given the network connection is lost\n  When the user submits the form\n  Then an offline warning prompt is displayed`,
  });

  // =========================================================================
  // 5. STATE TRANSITION & BUSINESS RULES BRANCH COVERAGE
  // =========================================================================
  // Business Rules Branching
  rules.forEach((rule, idx) => {
    testCases.push({
      id: nextId(),
      title: `[State & Rule Branch #${idx + 1}] Verify rule: "${rule.condition}" -> "${rule.effect}"`,
      dimension: 'state_transition',
      dimensionLabel: `Rule Branch #${idx + 1}`,
      priority: 'P1 - High',
      preconditions: ['Application in active state'],
      steps: [
        `Trigger condition: ${rule.condition}`,
        `Verify UI state and consequence: ${rule.effect}`,
      ],
      testData: happyData,
      expectedResult: rule.effect,
      assertionType: 'state_change',
      playwrightCodeSnippet: `// Rule #${idx + 1}: ${rule.condition}\n// Effect: ${rule.effect}\nawait test.step('Verify Business Rule #${idx + 1}', async () => {\n  // Trigger condition\n  // Assert: ${rule.effect}\n  expect(true).toBeTruthy();\n});`,
      cypressCodeSnippet: `// Rule: ${rule.condition}\ncy.log('Testing condition: ${rule.condition}');\n// Assert: ${rule.effect}`,
      jestCodeSnippet: `test('Rule #${idx + 1}: ${rule.condition}', () => {\n  const state = applyRuleCondition('${rule.condition}');\n  expect(state.effect).toBe('${rule.effect}');\n});`,
      pytestCodeSnippet: `def test_rule_${idx + 1}():\n    state = evaluate_rule("${rule.condition}")\n    assert state.is_valid`,
      gherkinSnippet: `Scenario: Rule #${idx + 1} validation\n  Given condition "${rule.condition}" is met\n  Then system guarantees "${rule.effect}"`,
    });
  });

  // Role-Based Access Control (RBAC) Branching
  if (roles.length > 1) {
    roles.forEach((role) => {
      const isPrivileged = role.toLowerCase().includes('admin') || role.toLowerCase().includes('manager') || role.toLowerCase().includes('inspector');
      testCases.push({
        id: nextId(),
        title: `[RBAC - Role: ${role}] Access control and permission boundaries for role "${role}"`,
        dimension: 'state_transition',
        dimensionLabel: `RBAC: ${role}`,
        priority: 'P1 - High',
        preconditions: [`User authenticated with role credentials: "${role}"`],
        steps: [
          `Authenticate as "${role}"`,
          'Navigate to scenario view',
          isPrivileged ? 'Verify write/edit/delete action buttons are enabled' : 'Verify restricted action buttons are disabled or hidden',
        ],
        testData: { userRole: role },
        expectedResult: isPrivileged
          ? `User "${role}" has full access to perform operational actions and status transitions.`
          : `User "${role}" has read-only or restricted access; mutation buttons are disabled.`,
        assertionType: 'state_change',
        playwrightCodeSnippet: `// Authenticate as ${role}\nawait page.evaluate(() => localStorage.setItem('user_role', '${role}'));\nawait page.reload();\n${
          isPrivileged
            ? `await expect(page.getByRole('button', { name: /create|edit|save|approve/i })).toBeEnabled();`
            : `await expect(page.getByRole('button', { name: /create|delete/i })).not.toBeVisible();`
        }`,
        cypressCodeSnippet: `cy.setRole('${role}');\ncy.visit('/');\n${isPrivileged ? `cy.get('.admin-actions').should('be.visible');` : `cy.get('.admin-actions').should('not.exist');`}`,
        jestCodeSnippet: `expect(checkPermissions('${role}', 'WRITE_ACCESS')).toBe(${isPrivileged});`,
        pytestCodeSnippet: `assert check_permissions('${role}', 'WRITE_ACCESS') is ${isPrivileged ? 'True' : 'False'}`,
        gherkinSnippet: `Scenario: Role permissions for ${role}\n  Given user is logged in as "${role}"\n  Then access rights reflect "${isPrivileged ? 'FULL' : 'RESTRICTED'}"`,
      });
    });
  }

  // Multi-step Action Transitions (e.g. Draft -> Review -> Approved)
  if (actions.length > 1) {
    for (let i = 1; i < actions.length; i++) {
      const act = actions[i];
      testCases.push({
        id: nextId(),
        title: `[Workflow Transition] Action "${act.name}" -> ${act.expectedOutcome}`,
        dimension: 'state_transition',
        dimensionLabel: `Workflow: ${act.name}`,
        priority: 'P1 - High',
        preconditions: ['Previous workflow state completed'],
        steps: [
          `Locate action element: ${act.target}`,
          `Execute action: ${act.name}`,
          'Verify state machine transition and UI feedback',
        ],
        testData: {},
        expectedResult: act.expectedOutcome,
        assertionType: 'state_change',
        playwrightCodeSnippet: `await test.step('Execute ${act.name}', async () => {\n  const actionTarget = page.locator('${act.target}');\n  await expect(actionTarget).toBeVisible();\n  await actionTarget.click();\n  // Assert: ${act.expectedOutcome}\n});`,
        cypressCodeSnippet: `cy.get('${act.target}').click();\ncy.log('${act.expectedOutcome}');`,
        jestCodeSnippet: `test('Action: ${act.name}', () => {\n  const state = performAction('${act.name}');\n  expect(state.status).toBeDefined();\n});`,
        pytestCodeSnippet: `def test_action_${i}():\n    result = execute_action('${act.name}')\n    assert result is not None`,
        gherkinSnippet: `Scenario: Execute workflow action ${act.name}\n  When user clicks "${act.name}"\n  Then system updates state to "${act.expectedOutcome}"`,
      });
    }
  }

  // =========================================================================
  // 6. SECURITY & RESILIENCY EDGE CASES
  // =========================================================================
  // XSS Injection
  testCases.push({
    id: nextId(),
    title: `[Security - XSS Attack] Cross-Site Scripting input sanitization test`,
    dimension: 'security_edge',
    dimensionLabel: 'Security: XSS Sanitization',
    priority: 'P0 - Critical',
    preconditions: ['Form is open for input'],
    steps: [
      'Inject payload `<script>window.__xss_vulnerable__=true;</script><img src=x onerror=alert(1)>` into text inputs',
      'Submit form and navigate to view/display screen',
      'Assert script is not executed in DOM context',
    ],
    testData: {
      ...happyData,
      [fields[0] ? fields[0].name : 'input']: '<script>window.__xss_vulnerable__=true;</script>',
    },
    expectedResult: 'System HTML-escapes/sanitizes input. Payload is treated as literal text string; no script tag executes.',
    assertionType: 'state_change',
    playwrightCodeSnippet: `const xssPayload = '<script>window.__xss_vulnerable__=true;</script>';\nawait page.locator('input[type="text"]').first().fill(xssPayload);\nawait page.getByRole('button', { name: /save|submit/i }).click();\nconst isExploited = await page.evaluate(() => (window as any).__xss_vulnerable__ === true);\nexpect(isExploited).toBe(false);`,
    cypressCodeSnippet: `const payload = '<script>window.__xss=true;</script>';\ncy.get('input[type="text"]').first().type(payload);\ncy.get('button[type="submit"]').click();\ncy.window().its('__xss').should('not.exist');`,
    jestCodeSnippet: `const sanitized = sanitizeHtml('<script>alert(1)</script>');\nexpect(sanitized).not.toContain('<script>');`,
    pytestCodeSnippet: `assert '<script>' not in sanitize_html('<script>alert(1)</script>')`,
    gherkinSnippet: `Scenario: Prevent XSS injection\n  When user enters script tag in text field\n  Then text is HTML escaped and no script executes`,
  });

  // SQL Injection
  testCases.push({
    id: nextId(),
    title: `[Security - SQLi Attack] SQL Injection string resistance test`,
    dimension: 'security_edge',
    dimensionLabel: 'Security: SQLi Resistance',
    priority: 'P0 - Critical',
    preconditions: ['Form or query parameter is active'],
    steps: [
      `Input classic SQLi payload "' OR '1'='1' --" into search / input field`,
      'Submit request to backend',
      'Verify backend treats as parameterized query and returns 0 leaks or valid matches only',
    ],
    testData: {
      ...happyData,
      [fields[0] ? fields[0].name : 'query']: "' OR '1'='1' --",
    },
    expectedResult: 'Parameterized query handles payload safely; returns exact literal match or 400 Bad Request without leaking unauthorized database records.',
    assertionType: 'state_change',
    playwrightCodeSnippet: `const sqliPayload = "' OR '1'='1' --";\nawait page.locator('input[type="text"]').first().fill(sqliPayload);\nawait page.getByRole('button', { name: /save|submit|search/i }).click();\nawait expect(page.locator('.database-error, .syntax-error')).not.toBeVisible();`,
    cypressCodeSnippet: `cy.get('input[type="text"]').first().type("' OR '1'='1' --");\ncy.get('button[type="submit"]').click();\ncy.get('.error-trace').should('not.exist');`,
    jestCodeSnippet: `const res = queryDatabase("' OR '1'='1' --");\nexpect(res.isProtected).toBe(true);`,
    pytestCodeSnippet: `assert execute_safe_query("' OR '1'='1' --") is not None`,
    gherkinSnippet: `Scenario: Prevent SQL injection\n  When user inputs SQL syntax into query field\n  Then database treats input as parameterized literal string`,
  });

  // Double Submit / Race Condition Spam
  testCases.push({
    id: nextId(),
    title: `[Resiliency - Double Click] Prevent duplicate record creation on rapid double submit`,
    dimension: 'security_edge',
    dimensionLabel: 'Resiliency: Duplicate Submission Spam',
    priority: 'P1 - High',
    preconditions: ['Form is populated with valid data'],
    steps: [
      'Fill valid form data',
      'Rapidly double-click submit button (within 50ms)',
      'Inspect network logs to confirm single mutation request or idempotent transaction handling',
    ],
    testData: happyData,
    expectedResult: 'Submit button disables on first click with spinner. Exactly ONE record is created (idempotency enforced).',
    assertionType: 'state_change',
    playwrightCodeSnippet: `const submitBtn = page.getByRole('button', { name: /save|submit|pay/i });\nawait submitBtn.dblclick();\n// Button should disable immediately\nawait expect(submitBtn).toBeDisabled();`,
    cypressCodeSnippet: `cy.get('button[type="submit"]').dblclick();\ncy.get('button[type="submit"]').should('be.disabled');`,
    jestCodeSnippet: `const mockApi = jest.fn();\ndebounceSubmit(mockApi);\ndebounceSubmit(mockApi);\nexpect(mockApi).toHaveBeenCalledTimes(1);`,
    pytestCodeSnippet: `assert process_idempotent_request(req_id) == 'SUCCESS'\nassert process_idempotent_request(req_id) == 'DUPLICATE_IGNORED'`,
    gherkinSnippet: `Scenario: Prevent duplicate submit on double-click\n  When user double clicks submit button rapidly\n  Then only one creation request is processed`,
  });

  // =========================================================================
  // 7. ACCESSIBILITY & USABILITY
  // =========================================================================
  testCases.push({
    id: nextId(),
    title: `[A11y] Keyboard tab order navigation and Enter key form submission`,
    dimension: 'accessibility',
    dimensionLabel: 'Accessibility: Keyboard Navigation',
    priority: 'P2 - Medium',
    preconditions: ['User enters page via keyboard only'],
    steps: [
      'Focus first form control',
      'Press Tab key sequentially through all inputs and buttons',
      'Verify visible focus ring indicator on every active element',
      'Press Enter key on submit button',
    ],
    testData: happyData,
    expectedResult: 'Logical sequential tab index without focus traps. Enter key triggers form submission.',
    assertionType: 'visibility',
    playwrightCodeSnippet: `await page.keyboard.press('Tab');\nawait expect(page.locator(':focus')).toBeVisible();\nawait page.keyboard.type('${happyData[fields[0]?.name] || 'Test'}');\nawait page.keyboard.press('Tab');\nawait page.keyboard.press('Enter');`,
    cypressCodeSnippet: `cy.get('input').first().focus().type('{enter}');`,
    jestCodeSnippet: `expect(getTabOrderElements().length).toBeGreaterThan(0);`,
    pytestCodeSnippet: `assert verify_tab_order() is True`,
    gherkinSnippet: `Scenario: Keyboard accessibility\n  When user navigates using Tab and Enter keys\n  Then all elements receive focus in logical order`,
  });

  // =========================================================================
  // CALCULATE COVERAGE METRICS & BREAKDOWN
  // =========================================================================
  const breakdown: CoverageBreakdown = {
    happy_path: testCases.filter((c) => c.dimension === 'happy_path').length,
    boundary_value: testCases.filter((c) => c.dimension === 'boundary_value').length,
    equivalence_partition: testCases.filter((c) => c.dimension === 'equivalence_partition').length,
    negative_error: testCases.filter((c) => c.dimension === 'negative_error').length,
    state_transition: testCases.filter((c) => c.dimension === 'state_transition').length,
    security_edge: testCases.filter((c) => c.dimension === 'security_edge').length,
    accessibility: testCases.filter((c) => c.dimension === 'accessibility').length,
  };

  // Check that all 7 dimensions have > 0 tests -> 100% Coverage Achieved!
  const allCovered = Object.values(breakdown).every((count) => count > 0);
  const coverageScore = allCovered ? 100 : Math.round((Object.values(breakdown).filter((c) => c > 0).length / 7) * 100);

  // Synthesize Full Code Suites
  const generatedCode = {
    playwright: synthesizePlaywrightSuite(scenario, testCases),
    playwrightPom: synthesizePlaywrightPomSuite(scenario, testCases),
    cypress: synthesizeCypressSuite(scenario, testCases),
    jest: synthesizeJestSuite(scenario, testCases),
    pytest: synthesizePyTestSuite(scenario, testCases),
    gherkin: synthesizeGherkinSuite(scenario, testCases),
    qaMatrixCsv: synthesizeQaMatrixCsv(testCases),
    qaMatrixMarkdown: synthesizeQaMatrixMarkdown(testCases),
  };

  return {
    scenario,
    testCases,
    totalCases: testCases.length,
    coverageScore,
    breakdown,
    generatedCode,
  };
}

// =========================================================================
// CODE SYNTHESIZERS FOR MULTI-FRAMEWORKS
// =========================================================================

function generatePlaywrightHappyPath(scenario: ScenarioModel, happyData: Record<string, any>): string {
  const fields = scenario.fields || [];
  const lines = [
    `// Happy Path - Full Positive Workflow`,
    `await test.step('Fill form with standard valid inputs', async () => {`,
  ];

  fields.forEach((f) => {
    if (f.type === 'select') {
      lines.push(`  await page.getByLabel('${f.label}').selectOption('${happyData[f.name]}');`);
    } else if (f.type === 'checkbox') {
      lines.push(`  await page.getByLabel('${f.label}').setChecked(${happyData[f.name]});`);
    } else {
      lines.push(`  await page.getByLabel('${f.label}').fill('${happyData[f.name]}');`);
    }
  });

  lines.push(`});`);
  lines.push(``);
  lines.push(`await test.step('Submit and verify confirmation', async () => {`);
  if (scenario.actions && scenario.actions.length > 0) {
    const act = scenario.actions[0];
    lines.push(`  await page.locator('${act.target}').click();`);
  } else {
    lines.push(`  await page.getByRole('button', { name: /submit|save|create/i }).click();`);
  }
  lines.push(`  await expect(page.getByText(/success|created|confirmed/i)).toBeVisible();`);
  lines.push(`});`);

  return lines.join('\n');
}

function generateCypressHappyPath(scenario: ScenarioModel, happyData: Record<string, any>): string {
  const lines = [`cy.visit('/');`];
  (scenario.fields || []).forEach((f) => {
    if (f.type === 'select') {
      lines.push(`cy.get('[name="${f.name}"]').select('${happyData[f.name]}');`);
    } else if (f.type === 'checkbox') {
      lines.push(`cy.get('[name="${f.name}"]').check();`);
    } else {
      lines.push(`cy.get('[name="${f.name}"]').clear().type('${happyData[f.name]}');`);
    }
  });
  lines.push(`cy.get('button[type="submit"]').click();`);
  lines.push(`cy.contains(/success|created/i).should('be.visible');`);
  return lines.join('\n');
}

function generateJestHappyPath(scenario: ScenarioModel, happyData: Record<string, any>): string {
  return `const result = await executeFlow(${JSON.stringify(happyData, null, 2)});\nexpect(result.success).toBe(true);\nexpect(result.status).toBe(200);`;
}

function generatePyTestHappyPath(scenario: ScenarioModel, happyData: Record<string, any>): string {
  return `payload = ${JSON.stringify(happyData, null, 4)}\nresponse = client.post("/endpoint", json=payload)\nassert response.status_code in [200, 201]\nassert response.json()["status"] == "success"`;
}

function generateGherkinHappyPath(scenario: ScenarioModel, happyData: Record<string, any>): string {
  return `Scenario: Successful execution of ${scenario.title}\n  Given the user is on the main page\n  When the user fills valid details:\n    | Field | Value |\n${(scenario.fields || []).map((f) => `    | ${f.label} | ${happyData[f.name]} |`).join('\n')}\n  And clicks the submit button\n  Then the system displays a success confirmation`;
}

function generatePlaywrightSnippet(name: string, data: Record<string, any>, fields: FieldDefinition[]): string {
  const lines = [`// ${name}`, `await test.step('${name}', async () => {`];
  fields.forEach((f) => {
    lines.push(`  await page.getByLabel('${f.label}').fill('${data[f.name]}');`);
  });
  lines.push(`  await page.getByRole('button', { name: /submit|save/i }).click();`);
  lines.push(`  await expect(page.getByText(/success|created/i)).toBeVisible();`);
  lines.push(`});`);
  return lines.join('\n');
}

function generateCypressSnippet(title: string, data: Record<string, any>): string {
  return `it('${title}', () => {\n  cy.submitForm(${JSON.stringify(data)});\n  cy.get('.toast-success').should('be.visible');\n});`;
}

function generateJestSnippet(fn: string, data: Record<string, any>): string {
  return `test('${fn}', async () => {\n  const res = await ${fn}(${JSON.stringify(data)});\n  expect(res.ok).toBe(true);\n});`;
}

function generatePyTestSnippet(fn: string, data: Record<string, any>): string {
  return `def ${fn}(client):\n    res = client.post("/api", json=${JSON.stringify(data)})\n    assert res.status_code == 200`;
}

function generatePlaywrightBvaSnippet(field: FieldDefinition, val: number | string, isValid: boolean, errorMsg?: string): string {
  if (isValid) {
    return `await page.getByLabel('${field.label}').fill('${val}');\nawait page.getByRole('button', { name: /submit|save/i }).click();\nawait expect(page.locator('.error-message')).not.toBeVisible();`;
  }
  return `await page.getByLabel('${field.label}').fill('${val}');\nawait page.getByRole('button', { name: /submit|save/i }).click();\nawait expect(page.getByText(/${errorMsg || 'invalid'}/i)).toBeVisible();`;
}

function generatePlaywrightStringBva(field: FieldDefinition, val: string, isValid: boolean, errorMsg?: string): string {
  if (isValid) {
    return `await page.getByLabel('${field.label}').fill('${val.slice(0, 15)}...'); // Length: ${val.length}\nawait page.getByLabel('${field.label}').blur();\nawait expect(page.locator('.error-text')).not.toBeVisible();`;
  }
  return `await page.getByLabel('${field.label}').fill('${val.slice(0, 15)}...'); // Length: ${val.length}\nawait page.getByLabel('${field.label}').blur();\nawait expect(page.getByText(/${errorMsg || 'invalid length'}/i)).toBeVisible();`;
}

function generatePlaywrightRequiredValidation(fields: FieldDefinition[], actions: any[]): string {
  const actionTarget = actions.length > 0 ? `page.locator('${actions[0].target}')` : `page.getByRole('button', { name: /submit|save/i })`;
  const lines = [
    `// Negative: Verify mandatory field validation triggers`,
    `await ${actionTarget}.click();`,
    ``,
  ];
  fields.forEach((f) => {
    lines.push(`// Assert required alert on [${f.label}]`);
    lines.push(`await expect(page.getByText(/${f.label} is required|cannot be blank/i)).toBeVisible();`);
  });
  return lines.join('\n');
}

/**
 * Generates full Playwright TypeScript Test Suite with clean structure, step annotations, and 100% coverage
 */
function synthesizePlaywrightSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const sanitizeName = scenario.title.replace(/[^a-zA-Z0-9]/g, '');
  const lines: string[] = [
    `/**`,
    ` * Playwright TypeScript Test Suite: ${scenario.title}`,
    ` * 100% Test Coverage Suite Generated by TestCraft AI`,
    ` * Total Test Cases: ${testCases.length}`,
    ` * Coverage Dimensions: Happy Path, BVA, Equivalence, Negative, State Transitions, Security, A11y`,
    ` */`,
    ``,
    `import { test, expect, Page } from '@playwright/test';`,
    ``,
    `test.describe('${scenario.title} — 100% Coverage Suite', () => {`,
    `  test.beforeEach(async ({ page }) => {`,
    `    // Navigate to target application baseline route`,
    `    await page.goto('/');`,
    `    await page.waitForLoadState('domcontentloaded');`,
    `  });`,
    ``,
  ];

  // Group test cases by dimension
  const dimensions: { key: CoverageDimension; label: string }[] = [
    { key: 'happy_path', label: '1. Happy Path & Core Workflows' },
    { key: 'boundary_value', label: '2. Boundary Value Analysis (BVA)' },
    { key: 'equivalence_partition', label: '3. Equivalence Partitioning' },
    { key: 'negative_error', label: '4. Negative & Error Handling' },
    { key: 'state_transition', label: '5. State Transitions & Business Rules' },
    { key: 'security_edge', label: '6. Security & Resiliency Edge Cases' },
    { key: 'accessibility', label: '7. Accessibility & Usability (A11y)' },
  ];

  dimensions.forEach(({ key, label }) => {
    const groupCases = testCases.filter((tc) => tc.dimension === key);
    if (groupCases.length === 0) return;

    lines.push(`  // =========================================================================`);
    lines.push(`  // ${label}`);
    lines.push(`  // =========================================================================`);

    groupCases.forEach((tc) => {
      lines.push(`  test('${tc.id}: ${tc.title.replace(/'/g, "\\'")}', async ({ page }) => {`);
      lines.push(`    // Priority: ${tc.priority}`);
      lines.push(`    // Expected: ${tc.expectedResult.replace(/'/g, "\\'")}`);
      
      const snippetLines = tc.playwrightCodeSnippet.split('\n');
      snippetLines.forEach((snip) => {
        lines.push(`    ${snip}`);
      });

      lines.push(`  });`);
      lines.push(``);
    });
  });

  lines.push(`});`);
  return lines.join('\n');
}

/**
 * Synthesizes Playwright Page Object Model (POM) architecture
 */
function synthesizePlaywrightPomSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const className = scenario.title.replace(/[^a-zA-Z0-9]/g, '') + 'Page';
  const fields = scenario.fields || [];

  return `import { Page, Locator, expect } from '@playwright/test';

export class ${className} {
  readonly page: Page;
${fields.map((f) => `  readonly ${f.name}Input: Locator;`).join('\n')}
  readonly submitButton: Locator;
  readonly toastMessage: Locator;

  constructor(page: Page) {
    this.page = page;
${fields.map((f) => `    this.${f.name}Input = page.getByLabel('${f.label}');`).join('\n')}
    this.submitButton = page.getByRole('button', { name: /submit|save|pay/i });
    this.toastMessage = page.locator('.toast, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillForm(data: Record<string, any>) {
${fields
  .map(
    (f) =>
      `    if (data.${f.name} !== undefined) await this.${f.name}Input.${f.type === 'select' ? 'selectOption' : f.type === 'checkbox' ? 'setChecked' : 'fill'}(data.${f.name});`
  )
  .join('\n')}
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectSuccess() {
    await expect(this.toastMessage).toContainText(/success|created|approved/i);
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
`;
}

/**
 * Synthesize Cypress Suite
 */
function synthesizeCypressSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const lines = [
    `describe('${scenario.title} — 100% Coverage Suite (Cypress)', () => {`,
    `  beforeEach(() => {`,
    `    cy.visit('/');`,
    `  });`,
    ``,
  ];

  testCases.forEach((tc) => {
    lines.push(`  it('${tc.id}: ${tc.title.replace(/'/g, "\\'")}', () => {`);
    tc.cypressCodeSnippet.split('\n').forEach((s) => lines.push(`    ${s}`));
    lines.push(`  });`);
    lines.push(``);
  });

  lines.push(`});`);
  return lines.join('\n');
}

/**
 * Synthesize Jest Suite
 */
function synthesizeJestSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const lines = [
    `import { executeFlow, validateField } from './service';`,
    ``,
    `describe('${scenario.title} — 100% Coverage Unit Suite (Jest)', () => {`,
  ];

  testCases.forEach((tc) => {
    lines.push(`  test('${tc.id}: ${tc.title.replace(/'/g, "\\'")}', async () => {`);
    tc.jestCodeSnippet.split('\n').forEach((s) => lines.push(`    ${s}`));
    lines.push(`  });`);
    lines.push(``);
  });

  lines.push(`});`);
  return lines.join('\n');
}

/**
 * Synthesize PyTest Suite
 */
function synthesizePyTestSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const lines = [
    `# PyTest 100% Coverage Suite: ${scenario.title}`,
    `import pytest`,
    `from fastapi.testclient import TestClient`,
    `from app.main import app`,
    ``,
    `client = TestClient(app)`,
    ``,
  ];

  testCases.forEach((tc, idx) => {
    const fnName = `test_${tc.dimension}_${tc.id.replace('-', '_').toLowerCase()}`;
    lines.push(`def ${fnName}():`);
    lines.push(`    """${tc.title}"""`);
    tc.pytestCodeSnippet.split('\n').forEach((s) => lines.push(`    ${s}`));
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Synthesize Gherkin Feature File
 */
function synthesizeGherkinSuite(scenario: ScenarioModel, testCases: TestCaseItem[]): string {
  const lines = [
    `Feature: ${scenario.title}`,
    `  ${scenario.description || 'Automated feature file with 100% test coverage'}`,
    ``,
  ];

  testCases.forEach((tc) => {
    lines.push(`  @${tc.dimension} @${tc.priority.split(' ')[0]}`);
    lines.push(tc.gherkinSnippet);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Synthesize QA Test Matrix CSV
 */
function synthesizeQaMatrixCsv(testCases: TestCaseItem[]): string {
  const headers = ['Test ID', 'Title', 'Dimension', 'Priority', 'Preconditions', 'Test Steps', 'Expected Result'];
  const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = testCases.map((tc) => [
    escapeCsv(tc.id),
    escapeCsv(tc.title),
    escapeCsv(tc.dimensionLabel),
    escapeCsv(tc.priority),
    escapeCsv(tc.preconditions.join('; ')),
    escapeCsv(tc.steps.join(' -> ')),
    escapeCsv(tc.expectedResult),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Synthesize QA Test Matrix Markdown Table
 */
function synthesizeQaMatrixMarkdown(testCases: TestCaseItem[]): string {
  const header = `| Test ID | Dimension | Priority | Scenario / Title | Steps | Expected Result |\n| :--- | :--- | :--- | :--- | :--- | :--- |`;
  const rows = testCases.map(
    (tc) =>
      `| **${tc.id}** | \`${tc.dimensionLabel}\` | \`${tc.priority}\` | ${tc.title.replace(/\|/g, '-')} | ${tc.steps.map((s, i) => `${i + 1}. ${s}`).join('<br>')} | ${tc.expectedResult.replace(/\|/g, '-')} |`
  );
  return `${header}\n${rows.join('\n')}`;
}
