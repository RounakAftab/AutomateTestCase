import React from 'react';
import { FlaskConical, Play, FileSpreadsheet, FileText, Archive, CheckCircle2 } from 'lucide-react';
import type { TestSuiteResult } from '../types';

interface NavbarProps {
  suite: TestSuiteResult;
  onDownloadTestPlanDocx: () => void;
  onDownloadExcel: () => void;
  onExportZip: () => void;
  onRunSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  suite,
  onDownloadTestPlanDocx,
  onDownloadExcel,
  onExportZip,
  onRunSimulation,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-700 px-4 lg:px-8 py-3 transition-all shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand: Logo + Think Automation Lab */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-sky-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0b0f19] rounded-xl flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Think Automation Lab
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                99%+ Coverage
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-300">
              Autonomous QA & Automation Matrix Studio
            </div>
          </div>
        </div>

        {/* Section Jump Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-bold text-white">
          <button
            onClick={() => scrollToSection('scenario-input-section')}
            className="text-white hover:text-purple-300 transition-colors cursor-pointer"
          >
            Scenario Input
          </button>
          <button
            onClick={() => scrollToSection('coverage-matrix-section')}
            className="text-white hover:text-purple-300 transition-colors cursor-pointer"
          >
            Testing Pillars
          </button>
          <button
            onClick={() => scrollToSection('test-cases-section')}
            className="text-white hover:text-purple-300 transition-colors cursor-pointer"
          >
            Test Cases ({suite.totalCases})
          </button>
          <button
            onClick={() => scrollToSection('code-studio-section')}
            className="text-white hover:text-purple-300 transition-colors cursor-pointer"
          >
            Code Suites & Plan
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Dry Run Simulator */}
          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 transition-all cursor-pointer"
            title="Simulate live test execution in Chromium"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Dry Run Simulator</span>
          </button>

          {/* Download Excel */}
          <button
            onClick={onDownloadExcel}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition-all cursor-pointer"
            title="Download Excel test case matrix (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Download Word Plan */}
          <button
            onClick={onDownloadTestPlanDocx}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            title="Download IEEE 829 Master Test Plan in Microsoft Word (.docx)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word Plan (.docx)</span>
          </button>

          {/* Export Zip */}
          <button
            onClick={onExportZip}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 transition-all cursor-pointer"
            title="Export full test suite zip bundle"
          >
            <Archive className="w-3.5 h-3.5 text-sky-400" />
            <span>ZIP Suite</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
