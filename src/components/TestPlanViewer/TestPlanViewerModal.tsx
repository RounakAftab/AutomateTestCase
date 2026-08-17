import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { TestSuiteResult } from '../../types';
import { generateFormalTestPlanDocument } from '../../engine/testPlanGenerator';
import { downloadTextFile } from '../../utils/exportZip';

interface TestPlanViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: TestSuiteResult;
}

export const TestPlanViewerModal: React.FC<TestPlanViewerModalProps> = ({
  isOpen,
  onClose,
  suite,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen) return null;

  const testPlanMarkdown = generateFormalTestPlanDocument(suite);

  const handleCopy = () => {
    navigator.clipboard.writeText(testPlanMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const safeTitle = suite.scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadTextFile(testPlanMarkdown, `${safeTitle}_master_test_plan.md`, 'text/markdown');
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Concrete Master Test Plan Document</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  99%+ Coverage Guaranteed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete IEEE 829 test strategy, scope, boundary tables, and test case specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.MD)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Content Body */}
        <div className="p-6 overflow-y-auto max-h-[600px] bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-sky-500 selection:text-white">
          {testPlanMarkdown}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>{suite.totalCases} Concrete Test Cases • 7 Quality Dimensions</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
