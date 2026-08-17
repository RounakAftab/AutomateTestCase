import React from 'react';
import { Bot, Download, Play, Layers, Code2, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import type { TestSuiteResult } from '../types';

interface HeaderProps {
  suite: TestSuiteResult;
  onRunSimulation: () => void;
  onDownloadTestPlan: () => void;
  onExportZip: () => void;
  activeView: 'dashboard' | 'test_plan' | 'code';
  setActiveView: (view: 'dashboard' | 'test_plan' | 'code') => void;
}

export const Header: React.FC<HeaderProps> = ({
  suite,
  onRunSimulation,
  onDownloadTestPlan,
  onExportZip,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-sky-900/40 bg-slate-950/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Logo: Think Automation Lab By Rounak */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-400 to-cyan-300 p-[1px] shadow-lg shadow-sky-500/25">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Think Automation Lab
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 border border-sky-400/40 text-sky-300 shadow-sm shadow-sky-500/20">
                <Sparkles className="w-3 h-3 text-sky-400" />
                By Rounak
              </span>
            </div>
            <p className="text-[11px] text-sky-300/70 font-medium">
              Automated 99%+ Coverage Test Case & Master Test Plan Studio
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Sky Blue Theme) */}
        <div className="flex items-center bg-slate-900/90 border border-sky-900/50 rounded-xl p-1 shadow-inner shadow-slate-950">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Test Cases ({suite.totalCases})
          </button>

          <button
            onClick={() => setActiveView('test_plan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'test_plan'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Master Test Plan
          </button>

          <button
            onClick={() => setActiveView('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'code'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code Suites
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Primary Download Test Plan Button */}
          <button
            onClick={onDownloadTestPlan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer"
            title="Download Master Test Plan Document"
          >
            <Download className="w-4 h-4" />
            <span>Download Test Plan</span>
          </button>

          {/* Simulate Runner */}
          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-sky-800/40 text-sky-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Run simulated Playwright test runner"
          >
            <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
            <span className="hidden sm:inline">Simulate Run</span>
          </button>

          {/* Export Project ZIP */}
          <button
            onClick={onExportZip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Download complete Playwright automation package"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Export ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
