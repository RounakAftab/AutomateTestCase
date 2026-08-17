import React, { useState } from 'react';
import { Download, Copy, Check, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import type { TestSuiteResult } from '../../types';
import { generateFormalTestPlanDocument } from '../../engine/testPlanGenerator';
import { downloadTextFile } from '../../utils/exportZip';
import { downloadTestPlanDocx } from '../../utils/wordDocxExporter';
import { downloadTestCasesExcel } from '../../utils/excelExporter';

interface ConcreteTestPlanViewProps {
  suite: TestSuiteResult;
}

export const ConcreteTestPlanView: React.FC<ConcreteTestPlanViewProps> = ({ suite }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadedDocx, setIsDownloadedDocx] = useState(false);
  const [isDownloadedExcel, setIsDownloadedExcel] = useState(false);

  const testPlanMarkdown = generateFormalTestPlanDocument(suite);

  const handleCopy = () => {
    navigator.clipboard.writeText(testPlanMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadDocx = async () => {
    setIsDownloadedDocx(true);
    try {
      await downloadTestPlanDocx(suite, testPlanMarkdown);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadedDocx(false), 2000);
  };

  const handleDownloadExcel = () => {
    setIsDownloadedExcel(true);
    try {
      downloadTestCasesExcel(suite);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadedExcel(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar in Purple/Indigo Theme */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0c101d] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Master Test Plan Document (Word & Markdown)
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                IEEE 829 Standard
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Formal test strategy, quality gates, and specifications for <strong className="text-purple-300">{suite.scenario.title}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-purple-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDownloadedExcel ? 'Excel Ready!' : 'Download Excel (.xlsx)'}</span>
          </button>

          {/* Primary Word .docx Download */}
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            {isDownloadedDocx ? (
              <>
                <Check className="w-4 h-4" />
                <span>Word Plan Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Word Plan (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document View Panel */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 shadow-2xl overflow-x-auto">
        <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-purple-600 selection:text-white">
          {testPlanMarkdown}
        </pre>
      </div>
    </div>
  );
};
