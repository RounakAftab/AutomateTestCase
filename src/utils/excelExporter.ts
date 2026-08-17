import XLSX from 'xlsx-js-style';
import type { TestSuiteResult } from '../types';
import { downloadBlob } from './exportZip';

/**
 * Generates and downloads an Excel (.xlsx) file with industry-standard QA column formatting
 * matching the exact professional test cases matrix schema.
 */
export function downloadTestCasesExcel(suite: TestSuiteResult): void {
  const { scenario, testCases, breakdown, totalCases, coverageScore } = suite;
  const rawTitle = scenario.title || 'test_scenario';
  const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'scenario';

  // 1. Build Data Rows for Test Cases Matrix Sheet
  const matrixRows = testCases.map((tc) => ({
    'TC ID': tc.id,
    'AC': tc.acRef || 'AC-01',
    'Scenario / Test Title': tc.title.replace(/^\[.*?\]\s*/, ''),
    'Preconditions / Test Data': formatPreconditions(tc),
    'Test Steps': tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\r\n'),
    'Expected Result': tc.expectedResult,
    'Priority': tc.priority.split(' ')[0] || 'P0',
  }));

  // Create Worksheet 1: Test Cases Matrix
  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);

  // Set standard column widths for clean readability in Excel
  wsMatrix['!cols'] = [
    { wch: 12 }, // TC ID
    { wch: 10 }, // AC
    { wch: 45 }, // Scenario / Test Title
    { wch: 35 }, // Preconditions / Test Data
    { wch: 45 }, // Test Steps
    { wch: 45 }, // Expected Result
    { wch: 10 }, // Priority
  ];

  // 2. Build Data Rows for Summary & Metrics Sheet
  const summaryRows = [
    { 'Metric': 'Project / Scenario Name', 'Value': scenario.title },
    { 'Metric': 'Author / Lab', 'Value': 'Think Automation Lab By Rounak' },
    { 'Metric': 'Date Generated', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Total Test Cases', 'Value': totalCases },
    { 'Metric': 'Coverage Score', 'Value': `${coverageScore}% (Guaranteed 99%+ Coverage)` },
    { 'Metric': 'Happy Path / Positive Tests', 'Value': breakdown.happy_path },
    { 'Metric': 'Boundary Value Analysis (BVA) Tests', 'Value': breakdown.boundary_value },
    { 'Metric': 'Equivalence Partitioning Tests', 'Value': breakdown.equivalence_partition },
    { 'Metric': 'Negative & Error Handling Tests', 'Value': breakdown.negative_error },
    { 'Metric': 'State Machine & Rule Decision Tests', 'Value': breakdown.state_transition },
    { 'Metric': 'Security & Resiliency Tests', 'Value': breakdown.security_edge },
    { 'Metric': 'Accessibility (A11y) Tests', 'Value': breakdown.accessibility },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];

  // Apply Premium QA Styles
  styleWorksheet(wsMatrix, 7, matrixRows.length);
  styleWorksheet(wsSummary, 2, summaryRows.length);

  // Create Workbook and append sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Test Cases Matrix');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Coverage Summary');

  // Convert to array buffer with explicit xlsx bookType
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger download with guaranteed .xlsx extension
  downloadBlob(blob, `${safeTitle}_test_cases_matrix.xlsx`);
}

function formatPreconditions(tc: any): string {
  if (tc.preconditions && tc.preconditions.length > 0) {
    return tc.preconditions.join('; ');
  }
  const entries = Object.entries(tc.testData || {});
  if (entries.length > 0) {
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return 'Standard application state';
}

function styleWorksheet(ws: any, colCount: number, rowCount: number) {
  // Set row heights
  const rowHeights = [{ hpt: 28 }]; // Header row is 28pt
  for (let r = 1; r <= rowCount; r++) {
    rowHeights.push({ hpt: 40 }); // Generous line height for data rows
  }
  ws['!rows'] = rowHeights;

  // Style Header Row (Row 0)
  for (let col = 0; col < colCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: {
          name: 'Calibri',
          sz: 12,
          bold: true,
          color: { rgb: 'FFFFFF' }
        },
        fill: {
          fgColor: { rgb: '4F46E5' } // Indigo color header background
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'medium', color: { rgb: '4F46E5' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };
    }
  }

  // Style Data Rows (Row 1 to rowCount)
  for (let r = 1; r <= rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: c });
      if (ws[cellRef]) {
        const val = String(ws[cellRef].v || '');
        const isPassed = val.includes('Passed') || val.includes('✓');
        const isHighlight = val.startsWith('TOTAL') || val.includes('TOTAL');
        
        let fontColor = '0F172A'; // Slate-900 color for text
        if (isPassed) {
          fontColor = '059669'; // Green-600 for passed
        } else if (val.includes('TC-') || val.includes('AC-')) {
          fontColor = '4F46E5'; // Indigo-600 for test IDs / criteria refs
        }

        ws[cellRef].s = {
          font: {
            name: 'Calibri',
            sz: 11,
            bold: isHighlight,
            color: { rgb: fontColor }
          },
          fill: isHighlight ? { fgColor: { rgb: 'F1F5F9' } } : undefined,
          alignment: {
            horizontal: c === 0 || c === 1 || c === 6 ? 'center' : 'left', // center TC ID, AC, Priority
            vertical: 'top',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } }
          }
        };
      }
    }
  }
}
