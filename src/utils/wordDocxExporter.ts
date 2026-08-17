import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
} from 'docx';
import type { TestSuiteResult } from '../types';
import { downloadBlob } from './exportZip';

/**
 * Downloads a Master Test Plan in Microsoft Word (.docx) format
 * by compiling the EXACT markdown string generated for the screen.
 */
export async function downloadTestPlanDocx(
  suite: TestSuiteResult,
  markdownText: string
): Promise<void> {
  const rawTitle = suite.scenario.title || 'test_plan';
  const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'scenario';

  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const docChildren: any[] = [];
  const lines = markdownText.split('\n');

  // Parser State
  let insideTable = false;
  let tableHeaderCols: string[] = [];
  let tableRowsData: string[][] = [];

  // Helper to parse inline markdown tags (bold '**' and code '`')
  const parseInlineRuns = (text: string): TextRun[] => {
    const runs: TextRun[] = [];
    let currentText = '';
    let isBold = false;
    let isCode = false;

    let i = 0;
    while (i < text.length) {
      if (text.startsWith('**', i)) {
        if (currentText) {
          runs.push(new TextRun({ text: currentText, bold: isBold, font: isCode ? 'Consolas' : 'Calibri', size: 20, color: isCode ? '4F46E5' : undefined }));
          currentText = '';
        }
        isBold = !isBold;
        i += 2;
      } else if (text[i] === '`') {
        if (currentText) {
          runs.push(new TextRun({ text: currentText, bold: isBold, font: isCode ? 'Consolas' : 'Calibri', size: 20, color: isCode ? '4F46E5' : undefined }));
          currentText = '';
        }
        isCode = !isCode;
        i += 1;
      } else {
        currentText += text[i];
        i += 1;
      }
    }
    if (currentText) {
      runs.push(new TextRun({ text: currentText, bold: isBold, font: isCode ? 'Consolas' : 'Calibri', size: 20, color: isCode ? '4F46E5' : undefined }));
    }
    return runs;
  };

  // Helper to flush parsed table data into a styled Table
  const flushTable = () => {
    if (tableRowsData.length === 0) return;

    // Check if this is the Detailed Test Case Index table (contains TC ID, AC Ref, etc.)
    const isTestCaseIndexTable = tableHeaderCols.some(col => col.toLowerCase().includes('tc id'));

    if (isTestCaseIndexTable) {
      // Substitute with the FULL Detailed Test Cases Table containing all steps and expected results!
      const rows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Test ID', 12),
            createHeaderCell('Scenario Title / Category', 28),
            createHeaderCell('Procedure / Steps', 32),
            createHeaderCell('Expected Outcome', 28),
          ],
        }),
      ];

      suite.testCases.forEach((tc) => {
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorder,
                width: { size: 12, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: tc.id, bold: true, color: '6366F1', font: 'Calibri' }),
                      new TextRun({ text: `[${tc.priority}]`, size: 18, color: '64748B', font: 'Calibri', break: 1 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorder,
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: tc.title, bold: true, color: '0F172A', font: 'Calibri' }),
                      new TextRun({ text: `Category: ${tc.dimensionLabel}`, size: 18, color: '0284C7', font: 'Calibri', break: 1 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorder,
                width: { size: 32, type: WidthType.PERCENTAGE },
                children: tc.steps.map((step, i) => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${i + 1}. ${step}`,
                        size: 19,
                        color: '334155',
                        font: 'Calibri',
                      })
                    ]
                  })
                ),
              }),
              new TableCell({
                borders: cellBorder,
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: tc.expectedResult, size: 19, color: '059669', font: 'Calibri' }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      });

      docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }));
      docChildren.push(new Paragraph({ text: '' }));

      // Reset Table state
      insideTable = false;
      tableHeaderCols = [];
      tableRowsData = [];
      return;
    }

    // Default table rendering logic for other tables
    const colCount = Math.max(tableHeaderCols.length, ...tableRowsData.map(r => r.length));
    const widthPercentage = Math.floor(100 / colCount);

    const rows: TableRow[] = [];

    // Header Row
    if (tableHeaderCols.length > 0) {
      rows.push(
        new TableRow({
          tableHeader: true,
          children: tableHeaderCols.map((col) => {
            return new TableCell({
              width: { size: widthPercentage, type: WidthType.PERCENTAGE },
              shading: { fill: '4F46E5' },
              borders: cellBorder,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: col.trim(),
                      bold: true,
                      color: 'FFFFFF',
                      font: 'Calibri',
                      size: 22,
                    }),
                  ],
                }),
              ],
            });
          }),
        })
      );
    }

    // Data Rows
    tableRowsData.forEach((rowCells) => {
      rows.push(
        new TableRow({
          children: rowCells.map((cellText) => {
            const cleanText = cellText.trim();
            const isHighlight = cleanText.startsWith('TOTAL') || cleanText.includes('TOTAL');
            
            let color: string | undefined = undefined;
            if (cleanText.includes('Passed') || cleanText.includes('✓')) {
              color = '059669';
            } else if (cleanText.includes('TC-') || cleanText.includes('AC-')) {
              color = '4F46E5';
            }

            return new TableCell({
              width: { size: widthPercentage, type: WidthType.PERCENTAGE },
              shading: isHighlight ? { fill: 'F1F5F9' } : undefined,
              borders: cellBorder,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanText,
                      bold: isHighlight,
                      font: 'Calibri',
                      size: 19,
                      color,
                    }),
                  ],
                }),
              ],
            });
          }),
        })
      );
    });

    docChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }));
    docChildren.push(new Paragraph({ text: '' }));

    // Reset Table state
    insideTable = false;
    tableHeaderCols = [];
    tableRowsData = [];
  };

  // Main Loop line by line
  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const cleanLine = rawLine.trim();

    // 1. Parse Tables
    if (cleanLine.startsWith('|')) {
      // Split pipes and ignore the empty outer array slots
      const cells = rawLine
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());

      // Skip the separators row (e.g. | --- | --- |)
      if (cells.every(c => c.startsWith('-'))) {
        continue;
      }

      if (!insideTable) {
        insideTable = true;
        tableHeaderCols = cells;
      } else {
        tableRowsData.push(cells);
      }
      continue;
    } else if (insideTable) {
      flushTable();
    }

    // 2. Parse Headers
    if (cleanLine.startsWith('# ')) {
      const text = cleanLine.substring(2);
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: text.toUpperCase(),
              bold: true,
              size: 32,
              color: '1E1B4B',
              font: 'Calibri',
            }),
          ],
        })
      );
      docChildren.push(new Paragraph({ text: '' }));
      continue;
    }

    if (cleanLine.startsWith('## ')) {
      const text = cleanLine.substring(3);
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text,
              bold: true,
              size: 26,
              color: '1E1B4B',
              font: 'Calibri',
            }),
          ],
        })
      );
      continue;
    }

    if (cleanLine.startsWith('### ')) {
      const text = cleanLine.substring(4);
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text,
              bold: true,
              size: 22,
              color: '4F46E5',
              font: 'Calibri',
            }),
          ],
        })
      );
      continue;
    }

    // 3. Spacing line/hr
    if (cleanLine === '---' || cleanLine === '') {
      docChildren.push(new Paragraph({ text: '' }));
      continue;
    }

    // 4. Bullet lists
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      const text = cleanLine.substring(2);
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', bold: true, font: 'Calibri', size: 20 }),
            ...parseInlineRuns(text),
          ],
        })
      );
      continue;
    }

    // 5. Standard line
    docChildren.push(
      new Paragraph({
        children: parseInlineRuns(rawLine),
      })
    );
  }

  // End of file cleanup (flush last table if any)
  if (insideTable) {
    flushTable();
  }

  // Brand Header
  const headerPara = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({ text: 'Think Automation Lab ', bold: true, color: '4F46E5', font: 'Calibri', size: 18 }),
      new TextRun({ text: 'By Rounak', color: '9333EA', font: 'Calibri', size: 18 }),
    ],
  });

  // Footer branding
  const footerPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Generated by Think Automation Lab By Rounak',
        size: 16,
        color: '94A3B8',
        font: 'Calibri',
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [headerPara],
          }),
        },
        footers: {
          default: new Footer({
            children: [footerPara],
          }),
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeTitle}_master_test_plan.docx`);
}

function createHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: '4F46E5' },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Calibri', size: 22 }),
        ],
      }),
    ],
  });
}

function createDataRow(col1: string, col2: string, col3: string, borders: any, isHighlight: boolean = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: isHighlight ? { fill: 'F1F5F9' } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: col1, bold: isHighlight, font: 'Calibri', size: 19 })] })],
      }),
      new TableCell({
        borders,
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: isHighlight ? { fill: 'F1F5F9' } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: col2, bold: isHighlight, font: 'Calibri', size: 19, color: '4F46E5' })] })],
      }),
      new TableCell({
        borders,
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: isHighlight ? { fill: 'F1F5F9' } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: col3, bold: isHighlight, font: 'Calibri', size: 19, color: '059669' })] })],
      }),
    ],
  });
}
