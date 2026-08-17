import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Play, FileText, Code2, Terminal, CheckCircle2, HelpCircle } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-gherkin';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import { TestSuiteResult } from '../../types';
import { downloadTextFile } from '../../utils/exportZip';
import { generateFormalTestPlanDocument } from '../../engine/testPlanGenerator';
import { downloadTestPlanDocx } from '../../utils/wordDocxExporter';

interface CodeEditorPanelProps {
  suite: TestSuiteResult;
  onRunSimulation: () => void;
}

type TabType = 'playwright' | 'playwright_pom' | 'cypress' | 'gherkin' | 'test_plan' | 'qa_matrix_csv';

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ suite, onRunSimulation }) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('playwright');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const testPlanMarkdown = generateFormalTestPlanDocument(suite);

  const TABS: {
    id: TabType;
    label: string;
    description: string;
    ext: string;
    lang: string;
    icon: string;
    code: string;
  }[] = [
    {
      id: 'playwright',
      label: 'Playwright TS',
      description: 'Standard TypeScript automation script using Playwright test runner',
      ext: '.spec.ts',
      lang: 'typescript',
      icon: '🎭',
      code: suite.generatedCode.playwright,
    },
    {
      id: 'playwright_pom',
      label: 'Playwright POM',
      description: 'Page Object Model (POM) pattern for clean & scalable test structure',
      ext: '.page.ts',
      lang: 'typescript',
      icon: '🧩',
      code: suite.generatedCode.playwrightPom,
    },
    {
      id: 'cypress',
      label: 'Cypress E2E',
      description: 'End-to-End browser test script for Cypress testing framework',
      ext: '.cy.ts',
      lang: 'typescript',
      icon: '🌲',
      code: suite.generatedCode.cypress,
    },
    {
      id: 'gherkin',
      label: 'Gherkin / BDD',
      description: 'Given-When-Then human readable specification for Cucumber / BDD',
      ext: '.feature',
      lang: 'gherkin',
      icon: '🥒',
      code: suite.generatedCode.gherkin,
    },
    {
      id: 'test_plan',
      label: 'Master Test Plan (IEEE 829)',
      description: 'Industry standard formal QA test strategy and quality assurance plan',
      ext: '.md',
      lang: 'markdown',
      icon: '📋',
      code: testPlanMarkdown,
    },
    {
      id: 'qa_matrix_csv',
      label: 'QA Matrix CSV',
      description: 'Structured spreadsheet table of all test steps, boundaries & assertions',
      ext: '.csv',
      lang: 'markdown',
      icon: '📊',
      code: suite.generatedCode.qaMatrixCsv,
    },
  ];

  const currentTab = TABS.find((t) => t.id === selectedTab) || TABS[0];

  useEffect(() => {
    Prism.highlightAll();
  }, [selectedTab, suite]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTab.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const rawTitle = suite.scenario.title || 'test_scenario';
    const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'scenario';
    const filename = `${safeTitle}${currentTab.ext}`;
    const mime = currentTab.id === 'qa_matrix_csv' ? 'text/csv' : currentTab.id === 'test_plan' ? 'text/markdown' : 'text/plain';
    downloadTextFile(currentTab.code, filename, mime);
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      await downloadTestPlanDocx(suite, testPlanMarkdown);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadingDocx(false), 1500);
  };

  const lineCount = currentTab.code.split('\n').length;

  return (
    <section id="code-studio-section" className="space-y-3 scroll-mt-20">
      {/* Studio Header & Tab Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-[#0c101d] p-3.5 rounded-2xl border border-slate-700">
        {/* Framework Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800">
          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Dry Run</span>
          </button>

          {selectedTab === 'test_plan' && (
            <button
              onClick={handleDownloadDocx}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              title="Download formatted Master Test Plan in Word (.docx)"
            >
              {isDownloadingDocx ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{isDownloadingDocx ? 'Downloaded' : 'Word (.docx)'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {currentTab.ext}</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Beginner Helper Guide Bar */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white">
        <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
        <span className="font-semibold text-purple-300">{currentTab.label}:</span>
        <span className="text-white">{currentTab.description}</span>
      </div>

      {/* Code Editor Window */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-[#090d16] shadow-xl">
        {/* Editor Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#070b14] border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="font-mono text-white text-xs font-semibold ml-2">
              {suite.scenario.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}
              {currentTab.ext}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-white">
            <span className="text-slate-300">{lineCount} lines</span>
            <span className="text-slate-300">UTF-8</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Covered
            </span>
          </div>
        </div>

        {/* Code Body */}
        <div className="p-4 overflow-x-auto max-h-[560px]">
          <pre className={`language-${currentTab.lang} !bg-transparent !p-0 !m-0 font-mono text-xs text-slate-100`}>
            <code className={`language-${currentTab.lang} leading-relaxed`}>{currentTab.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
