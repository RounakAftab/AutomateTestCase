import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Converts a markdown string into styled React elements.
 * Designed for a white-background "document" look.
 * Handles: H1-H4, bold, italic, tables, bullet/numbered lists,
 * inline code, horizontal rules, and plain paragraphs.
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  /** Inline markdown: **bold**, *italic*, `code` */
  function parseInline(text: string, key: string | number): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return (
      <span key={key}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={idx} className="italic text-gray-700">{part.slice(1, -1)}</em>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={idx} className="font-mono text-[11px] bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded border border-gray-200">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={idx} className="text-gray-700">{part}</span>;
        })}
      </span>
    );
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // ── Heading 1 ──────────────────────────────────────────────
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      elements.push(
        <h1
          key={i}
          className="text-2xl font-extrabold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-indigo-400 tracking-tight"
        >
          {parseInline(trimmed.slice(2), `h1-${i}`)}
        </h1>
      );
      i++;
      continue;
    }

    // ── Heading 2 ──────────────────────────────────────────────
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      elements.push(
        <h2
          key={i}
          className="text-base font-bold text-indigo-700 mt-7 mb-2 flex items-center gap-2"
        >
          <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block shrink-0" />
          {parseInline(trimmed.slice(3), `h2-${i}`)}
        </h2>
      );
      i++;
      continue;
    }

    // ── Heading 3 ──────────────────────────────────────────────
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={i}
          className="text-sm font-bold text-purple-700 mt-5 mb-1.5 uppercase tracking-wide"
        >
          {parseInline(trimmed.slice(4), `h3-${i}`)}
        </h3>
      );
      i++;
      continue;
    }

    // ── Heading 4 ──────────────────────────────────────────────
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-gray-800 mt-4 mb-1">
          {parseInline(trimmed.slice(5), `h4-${i}`)}
        </h4>
      );
      i++;
      continue;
    }

    // ── Horizontal Rule ────────────────────────────────────────
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={i} className="border-gray-300 my-6" />);
      i++;
      continue;
    }

    // ── Table ──────────────────────────────────────────────────
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // rows[0] = header, rows[1] = separator (skip), rows[2..] = body
      const rows = tableLines;
      const headerRow = rows[0];
      const bodyRows = rows.slice(2);

      const parseCells = (row: string) =>
        row.split('|').map((c) => c.trim()).filter((c) => c.length > 0);

      const headerCells = parseCells(headerRow);

      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-indigo-50">
                {headerCells.map((cell, ci) => (
                  <th
                    key={ci}
                    className="px-4 py-2.5 text-left font-bold text-indigo-800 border-b border-gray-200 whitespace-nowrap"
                  >
                    {parseInline(cell, `th-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => {
                const cells = parseCells(row);
                return (
                  <tr
                    key={ri}
                    className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-4 py-2.5 text-gray-700 border-b border-gray-100 leading-relaxed"
                      >
                        {parseInline(cell, `td-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // ── Bullet list ────────────────────────────────────────────
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-3 ml-3">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>{parseInline(item, `li-${li}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Numbered list ──────────────────────────────────────────
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-3 ml-3 list-none">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
              <span className="shrink-0 font-bold text-indigo-600 text-[11px] min-w-[18px]">
                {li + 1}.
              </span>
              <span>{parseInline(item, `oli-${li}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Empty line ─────────────────────────────────────────────
    if (trimmed === '') {
      elements.push(<div key={`br-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // ── Plain paragraph ────────────────────────────────────────
    elements.push(
      <p key={i} className="text-xs text-gray-700 leading-relaxed my-1">
        {parseInline(trimmed, `p-${i}`)}
      </p>
    );
    i++;
  }

  return (
    <div className={`text-gray-900 font-sans ${className}`}>
      {elements}
    </div>
  );
}
