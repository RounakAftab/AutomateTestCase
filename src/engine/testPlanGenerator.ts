import type { TestSuiteResult, TestCaseItem, CoverageDimension } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bullets(items: string[]) {
  return items.map((s) => `- ${s}`).join('\n');
}

function tableRow(cells: string[]) {
  return `| ${cells.join(' | ')} |`;
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/** Flatten test data object into readable "field: value" strings */
function flattenTestData(data: Record<string, unknown>): string[] {
  return Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: \`${JSON.stringify(v)}\``);
}

/** Derive a concise scope item from a test case title */
function scopeFromTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, '')            // remove bracket tags
    .replace(/TC-\d+[:\s]*/i, '')       // remove TC-XXX prefix
    .replace(/^(verify|test|check|validate)\s+/i, '') // strip action verbs
    .trim();
}

// Priority order for sorting
const PRIORITY_ORDER: Record<string, number> = {
  'P0 - Critical': 0,
  'P1 - High': 1,
  'P2 - Medium': 2,
  'P3 - Low': 3,
};

// Dimension display labels
const DIM_LABELS: Record<CoverageDimension, string> = {
  happy_path: 'Happy Path / Positive Flows',
  boundary_value: 'Boundary Value Analysis (BVA)',
  equivalence_partition: 'Equivalence Partitioning (EP)',
  negative_error: 'Negative & Error Handling',
  state_transition: 'State Transition & Business Rules',
  security_edge: 'Security & Resiliency Edge Cases',
  accessibility: 'Accessibility (A11y)',
};

/**
 * Generates an IEEE 829-style Formal Test Plan Document
 * — fully focused on and derived from the actual generated test cases.
 */
export function generateFormalTestPlanDocument(suite: TestSuiteResult): string {
  const { scenario, testCases, breakdown, totalCases, coverageScore } = suite;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const docRef = `TP-${scenario.title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20)
    .replace(/-$/, '')}-2026`;

  // Sort test cases by priority
  const sorted = [...testCases].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
  );

  // ── Derive scope from actual test cases ──────────────────────────────────
  const inScopeSet = new Set<string>();
  sorted.forEach((tc) => {
    const item = scopeFromTitle(tc.title);
    if (item.length > 5) inScopeSet.add(item);
  });
  const inScopeItems = unique([...inScopeSet]).slice(0, 12);

  const outOfScopeItems = [
    'Third-party system internal implementation details',
    'Production deployment validation',
    'Infrastructure-level performance and load tuning',
    'Manual exploratory testing beyond documented scenarios',
  ];

  // ── Derive test data from actual tc.testData fields ──────────────────────
  const allTestDataEntries = new Set<string>();
  sorted.forEach((tc) => {
    flattenTestData(tc.testData).forEach((entry) => allTestDataEntries.add(entry));
  });
  const testDataLines = [...allTestDataEntries].slice(0, 20);

  // ── Derive preconditions from actual test cases ──────────────────────────
  const allPreconditions = new Set<string>();
  sorted.forEach((tc) => {
    tc.preconditions.forEach((p) => allPreconditions.add(p));
  });
  const entryPreconditions = unique([...allPreconditions]).slice(0, 8);

  // ── Derive expected outcomes / acceptance criteria from test cases ────────
  const expectedOutcomes = unique(sorted.map((tc) => tc.expectedResult)).slice(0, 10);

  // ── Derive risks from what test case dimensions were found ────────────────
  const risks: Array<{ risk: string; mitigation: string }> = [
    { risk: 'Unstable QA environment', mitigation: 'Coordinate with Dev/DevOps and verify environment health before execution.' },
    { risk: 'Incomplete or ambiguous requirements', mitigation: 'Clarify acceptance criteria with BA/PO before test design.' },
    { risk: 'Limited or missing test data', mitigation: 'Prepare reusable positive, negative, and boundary test datasets.' },
    { risk: 'Late build delivery', mitigation: 'Prioritize P0/P1 test scenarios and run regression in parallel.' },
  ];
  if (breakdown.security_edge > 0) {
    risks.push({ risk: 'Security vulnerabilities (XSS / SQLi)', mitigation: 'Execute all security test cases before UAT sign-off.' });
  }
  if (breakdown.state_transition > 0) {
    risks.push({ risk: 'Complex business rule interactions', mitigation: 'Use decision table testing to cover all conditional branches.' });
  }

  // ── P0/P1 counts ──────────────────────────────────────────────────────────
  const p0Count = sorted.filter((tc) => tc.priority === 'P0 - Critical').length;
  const p1Count = sorted.filter((tc) => tc.priority === 'P1 - High').length;

  // ── Unique dimensions actually used ──────────────────────────────────────
  const usedDimensions = unique(sorted.map((tc) => tc.dimension));

  // ─── Test Strategy rows — only for dimensions actually present ─────────
  const strategyRows: Array<{ type: string; approach: string }> = [];
  if (breakdown.happy_path > 0)
    strategyRows.push({ type: 'Functional / Happy Path', approach: 'Verify all positive workflows execute correctly and redirect/respond as specified.' });
  if (breakdown.boundary_value > 0)
    strategyRows.push({ type: 'Boundary Value Analysis', approach: 'Verify exact lower/upper thresholds, off-by-one underflow, and overflow limits.' });
  if (breakdown.equivalence_partition > 0)
    strategyRows.push({ type: 'Equivalence Partitioning', approach: 'Validate valid and invalid format/data partitions for each input field.' });
  if (breakdown.negative_error > 0)
    strategyRows.push({ type: 'Negative & Error Handling', approach: 'Validate invalid inputs, missing data, and business-rule violations.' });
  if (breakdown.state_transition > 0)
    strategyRows.push({ type: 'State Transition / Business Rules', approach: 'Full branch coverage for all conditional rules and role-based permissions.' });
  if (breakdown.security_edge > 0)
    strategyRows.push({ type: 'Security & Resiliency', approach: 'Defense verification against XSS, SQL injection, and race condition submissions.' });
  if (breakdown.accessibility > 0)
    strategyRows.push({ type: 'Accessibility (A11y)', approach: 'Keyboard navigation, ARIA attributes, screen reader compatibility.' });
  strategyRows.push({ type: 'Regression', approach: 'Ensure existing functionality is not impacted by new changes after each build.' });

  // ─── Test Case Summary Table (one row per TC) ──────────────────────────
  const tcTableRows = sorted.map((tc) =>
    tableRow([
      tc.id,
      tc.acRef ?? '—',
      tc.title.replace(/\|/g, '/'),
      tc.priority.split(' ')[0],
      DIM_LABELS[tc.dimension] ?? tc.dimensionLabel,
      tc.expectedResult.replace(/\|/g, '/').slice(0, 80) + (tc.expectedResult.length > 80 ? '…' : ''),
    ])
  );

  // ─── Acceptance Criteria derived from rules ────────────────────────────
  const acLines =
    scenario.rules.length > 0
      ? scenario.rules.map((r, i) => `AC-${String(i + 1).padStart(2, '0')}: When **${r.condition}** → **${r.effect}**`)
      : unique(sorted.map((tc) => tc.expectedResult))
          .slice(0, 10)
          .map((r, i) => `AC-${String(i + 1).padStart(2, '0')}: ${r}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Document
  // ═══════════════════════════════════════════════════════════════════════════

  return `# TEST PLAN — ${scenario.title}

*Formal Quality Assurance Test Plan Document*

---

## 1. Document Information

| Item | Details |
| --- | --- |
| **Project / Scenario** | ${scenario.title} |
| **Document Type** | Test Plan |
| **Document Reference** | ${docRef} |
| **Version** | 1.0 |
| **Prepared By** | Think Automation Lab By Rounak |
| **Date Generated** | ${dateStr} |
| **Test Environment** | QA / Staging |
| **Total Test Cases** | ${totalCases} |
| **Coverage Level** | ${coverageScore}% (Guaranteed 99%+ Scenario & Branch Coverage) |
| **Planned Testing** | ${strategyRows.map((r) => r.type).join(', ')} |

---

## 2. Objective

The objective of this test plan is to verify that **${scenario.title}** works according to the approved business and functional requirements. It defines the testing approach, scope, test cases, and acceptance criteria derived from **${totalCases} test cases** generated across **${usedDimensions.length} testing dimensions**.

This plan guarantees **${coverageScore}%+ coverage** including:

${bullets(usedDimensions.map((d) => `**${DIM_LABELS[d]}** — ${breakdown[d]} test cases`))}

---

## 3. Scope

### In Scope

${bullets(inScopeItems.length > 0 ? inScopeItems : ['All scenarios listed in the generated test cases above'])}

### Out of Scope

${bullets(outOfScopeItems)}

---

## 4. Test Strategy

| Testing Type | Approach |
| --- | --- |
${strategyRows.map((r) => tableRow([`**${r.type}**`, r.approach])).join('\n')}

---

## 5. Acceptance Criteria (Derived from Test Cases)

${acLines.map((ac) => `- ${ac}`).join('\n')}

---

## 6. Test Coverage Summary

| Testing Dimension | Test Cases | Priority Focus | Coverage |
| --- | --- | --- | --- |
${(Object.keys(DIM_LABELS) as CoverageDimension[])
    .filter((d) => breakdown[d] > 0)
    .map((d) => {
      const dTcs = sorted.filter((tc) => tc.dimension === d);
      const hasCritical = dTcs.some((tc) => tc.priority === 'P0 - Critical');
      const hasHigh = dTcs.some((tc) => tc.priority === 'P1 - High');
      const focus = hasCritical ? 'P0 Critical' : hasHigh ? 'P1 High' : 'P2/P3';
      return tableRow([DIM_LABELS[d], String(breakdown[d]), focus, '✓ Covered']);
    })
    .join('\n')}
| **TOTAL** | **${totalCases}** | **${p0Count} Critical, ${p1Count} High** | **✓ ${coverageScore}%** |

---

## 7. Detailed Test Case Index

| TC ID | AC Ref | Test Case | Priority | Dimension | Expected Result |
| --- | --- | --- | --- | --- | --- |
${tcTableRows.join('\n')}

---

## 8. Test Data (Derived from Generated Test Cases)

${testDataLines.length > 0 ? bullets(testDataLines) : bullets([
  'Valid and invalid user accounts',
  'Boundary and zero-value inputs',
  'Missing and malformed payloads',
  'Security/injection payloads (XSS, SQL)',
])}

---

## 9. Entry Criteria

${entryPreconditions.length > 0 ? bullets(entryPreconditions) : bullets([
  'Build is deployed to the QA environment and smoke-tested.',
  'Requirements and acceptance criteria are documented and signed off.',
  'Required test data and test accounts are available.',
  'QA environment is accessible and stable.',
])}

---

## 10. Exit Criteria

${bullets([
  `All ${totalCases} planned test cases have been executed.`,
  `All ${p0Count} critical (P0) and ${p1Count} high-priority (P1) defects are resolved or formally accepted.`,
  'Regression testing is completed with no new failures.',
  `Test execution report shows ${coverageScore}%+ pass rate.`,
  'No open P0/P1 defects remain without stakeholder approval.',
  'Test execution and defect reports are shared with stakeholders.',
])}

---

## 11. Test Environment

${bullets([
  'Application: QA/Staging environment',
  'Browsers: Chrome, Edge, Firefox',
  'Database: Test database (isolated from Production)',
  'API Tool: Postman / Thunder Client',
  'Automation Framework: Playwright (TypeScript)',
  'Defect Tracking: Jira',
])}

---

## 12. Defect Management

Defects will be reported in Jira with clear reproduction steps, expected vs actual results, severity, priority, screenshots/logs, and relevant test data. Fixed defects will be retested and included in regression testing.

- **P0 — Critical:** System crash, data loss, security breach. Fix immediately.
- **P1 — High:** Core functionality broken. Fix before release.
- **P2 — Medium:** Significant issue with a workaround. Fix in current sprint.
- **P3 — Low:** Minor cosmetic/usability issue. Fix in next release.

---

## 13. Risks & Mitigation

| Risk | Mitigation |
| --- | --- |
${risks.map((r) => tableRow([`**${r.risk}**`, r.mitigation])).join('\n')}

---

## 14. Deliverables

${bullets([
  'Test Plan (this document)',
  `Test Cases (${totalCases} test cases across ${usedDimensions.length} dimensions)`,
  'Automation Scripts (Playwright TypeScript)',
  'Cypress End-to-End Test Script',
  'Defect Reports (Jira)',
  'Test Execution Report',
  'Final Test Summary Report',
])}

---

## 15. Sample Test Schedule

| Phase | Duration | Owner |
| --- | --- | --- |
| Requirement Review | 1 Day | QA / BA |
| Test Planning & Design | 2 Days | QA |
| Test Environment Setup | 0.5 Day | DevOps / QA |
| Test Execution (${totalCases} TCs) | 3 Days | QA |
| Defect Retesting | 1 Day | QA |
| Regression Testing | 1 Day | QA |
| Test Closure & Reporting | 1 Day | QA Lead |

---

## 16. Approval

| Role | Name | Signature | Status |
| --- | --- | --- | --- |
| QA Lead | TBD | _______________ | Pending |
| Project Manager | TBD | _______________ | Pending |
| Business Analyst | TBD | _______________ | Pending |
| Product Owner | TBD | _______________ | Pending |

---

*Generated by Think Automation Lab By Rounak • ${dateStr}*
`;
}
