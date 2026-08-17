import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Check, Terminal, ShieldCheck, ListChecks, CheckCircle2 } from 'lucide-react';
import type { TestCaseItem, CoverageDimension } from '../../types';

interface CoverageMatrixTableProps {
  testCases: TestCaseItem[];
  selectedDimension: CoverageDimension | 'all';
  onSelectDimension: (dim: CoverageDimension | 'all') => void;
}

export const CoverageMatrixTable: React.FC<CoverageMatrixTableProps> = ({
  testCases,
  selectedDimension,
  onSelectDimension,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCases = testCases.filter((tc) => {
    const matchesDim = selectedDimension === 'all' || tc.dimension === selectedDimension;
    const matchesPriority = priorityFilter === 'all' || tc.priority.includes(priorityFilter);
    const matchesSearch =
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDim && matchesPriority && matchesSearch;
  });

  const handleCopySnippet = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority: string) => {
    if (priority.startsWith('P0')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 border border-rose-400 text-rose-300 font-mono">
          {priority}
        </span>
      );
    }
    if (priority.startsWith('P1')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 border border-amber-400 text-amber-300 font-mono">
          {priority}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 border border-indigo-400 text-indigo-200 font-mono">
        {priority}
      </span>
    );
  };

  const getDimensionBadge = (dim: CoverageDimension) => {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-purple-500/20 border-purple-400 text-purple-200">
        {dim.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <section id="test-cases-section" className="space-y-3 scroll-mt-20">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c101d] p-3.5 rounded-2xl border border-slate-700">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test case ID, steps, boundaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="font-semibold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#070b14] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Priorities</option>
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
          </div>

          <span className="text-xs text-white font-mono font-bold bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded-lg">
            {filteredCases.length} of {testCases.length} Cases
          </span>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-2">
        {filteredCases.map((tc) => {
          const isExpanded = expandedId === tc.id;
          return (
            <div
              key={tc.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-[#0c101d] border-purple-400 shadow-xl ring-1 ring-purple-400/50'
                  : 'bg-[#0c101d] hover:bg-slate-900 border-slate-700 hover:border-slate-500'
              }`}
            >
              {/* Row Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono font-bold text-xs text-white px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-400 shrink-0">
                    {tc.id}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {getDimensionBadge(tc.dimension)}
                      {getPriorityBadge(tc.priority)}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {tc.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700 text-xs text-white">
                  <span className="truncate max-w-[220px] text-xs hidden lg:inline text-slate-300 font-mono">
                    {tc.expectedResult.slice(0, 42)}...
                  </span>
                  <div className="flex items-center gap-1 text-purple-300 hover:text-white font-bold text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                    <span>{isExpanded ? 'Hide Details' : 'View Procedure'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-slate-700 bg-[#070b14] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Step-by-Step Procedure */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                        Step-by-Step Execution Procedure ({tc.steps.length} Steps)
                      </span>
                      <ol className="space-y-1.5 text-xs text-white list-decimal list-inside bg-[#0c101d] p-3.5 rounded-xl border border-slate-700">
                        {tc.steps.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            <span className="text-white font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>

                      <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Expected Result / Verification:
                        </span>
                        <p className="text-xs text-white bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl leading-relaxed">
                          {tc.expectedResult}
                        </p>
                      </div>
                    </div>

                    {/* Code Snippet & Payload */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          Playwright TS Automation Script
                        </span>
                        <button
                          onClick={() => handleCopySnippet(tc.id, tc.playwrightCodeSnippet)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                        >
                          {copiedId === tc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Script</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="bg-[#070b14] border border-slate-700 rounded-xl p-3 text-xs font-mono text-purple-200 overflow-x-auto max-h-48 leading-relaxed">
                        <code>{tc.playwrightCodeSnippet}</code>
                      </pre>

                      {Object.keys(tc.testData).length > 0 && (
                        <div>
                          <span className="text-xs font-mono text-white block mb-1 font-semibold">
                            Input Test Data:
                          </span>
                          <pre className="bg-[#0c101d] border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-amber-200 overflow-x-auto">
                            <code>{JSON.stringify(tc.testData, null, 2)}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
