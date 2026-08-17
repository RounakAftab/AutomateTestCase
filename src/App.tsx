import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  X,
  FileCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Archive,
  FlaskConical,
  Inbox,
  Settings,
  Bot,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  Clapperboard,
} from 'lucide-react';
import { analyzeScenarioAndGenerateSuite } from './engine/aiAgentEngine';
import { generateFormalTestPlanDocument } from './engine/testPlanGenerator';
import { downloadTestCasesExcel } from './utils/excelExporter';
import { downloadTestPlanDocx } from './utils/wordDocxExporter';
import { exportTestSuiteZip, downloadBlob, downloadTextFile } from './utils/exportZip';
import { extractTextFromFile, extractTextFromImage } from './utils/fileReaderHelper';
import { AISettingsModal } from './components/AISettingsModal';
import { CodegenModal } from './components/CodegenModal';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import type { ScenarioModel, TestSuiteResult, AISettings } from './types';

const SAMPLE_SCENARIO_PROMPT = `User Authentication scenario with email (valid corporate email format), password (min 8 max 64 chars, special symbol), 2faCode (6-digit OTP number), and rememberMe checkbox. When password attempts exceed 5, lock account for 15 minutes. When login succeeds with Admin role, redirect to /admin/dashboard. When login succeeds with StandardUser, redirect to /portal.`;

export function App() {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Engine Settings (Built-in Agent or Cloud Gemini/OpenAI) persisted in localStorage
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('automate_test_case_ai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        // Fall back to default
      }
    }
    return {
      provider: 'offline_heuristic',
      model: 'gemini-flash-lite-latest',
    };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodegenOpen, setIsCodegenOpen] = useState(false);

  // Generated Suite State
  const [currentScenario, setCurrentScenario] = useState<ScenarioModel | null>(null);
  const [suiteResult, setSuiteResult] = useState<TestSuiteResult | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Active view tab for generated results
  const [activeTab, setActiveTab] = useState<'test_cases' | 'test_plan' | 'playwright' | 'cypress'>('test_cases');

  // UI helpers
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUploadedOrPastedFile = async (file: File | Blob, customName?: string) => {
    const isImage = file.type.startsWith('image/') || (file instanceof File && /\.(png|jpe?g|webp|bmp|svg)$/i.test(file.name));
    
    if (isImage) {
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl(preview);
      const name = customName || (file instanceof File && file.name.includes('.') ? file.name : `Screenshot_${Date.now().toString().slice(-4)}.png`);
      setFileName(name);
    } else if (file instanceof File) {
      setImagePreviewUrl(null);
      setFileName(file.name);
    }

    setIsExtractingFile(true);
    setExtractionStatus('Analyzing document / image...');

    try {
      let extracted = '';
      if (isImage) {
        extracted = await extractTextFromImage(file, aiSettings, (st) => setExtractionStatus(st));
      } else if (file instanceof File) {
        extracted = await extractTextFromFile(file, aiSettings, (st) => setExtractionStatus(st));
      }

      if (extracted && extracted.trim().length > 0) {
        setInputText(extracted.trim());
      }
    } catch (err) {
      console.error('File / Image parsing error:', err);
    } finally {
      setIsExtractingFile(false);
      setExtractionStatus('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedOrPastedFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processUploadedOrPastedFile(file, `Pasted_Screenshot_${Date.now().toString().slice(-4)}.png`);
          break;
        }
      }
    }
  };

  const handleRemoveFile = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearText = () => {
    setInputText('');
    handleRemoveFile();
    setHasGenerated(false);
    setCurrentScenario(null);
    setSuiteResult(null);
    setExpandedCaseId(null);
    setCopiedCode(false);
    setActiveTab('test_cases');
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_SCENARIO_PROMPT);
  };

  const handleGenerateTestCases = async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    try {
      // Run AI Agent & LLM Scenario Analysis
      const newSuite = await analyzeScenarioAndGenerateSuite(inputText, aiSettings);
      setCurrentScenario(newSuite.scenario);
      setSuiteResult(newSuite);
      setHasGenerated(true);
      setActiveTab('test_cases');

      // Smooth scroll to generated section
      setTimeout(() => {
        const el = document.getElementById('generated-results-section');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Error in AI analysis:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!suiteResult) return;
    setIsDownloadingExcel(true);
    try {
      downloadTestCasesExcel(suiteResult);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadingExcel(false), 1500);
  };

  const handleDownloadWordPlan = async () => {
    if (!suiteResult) return;
    setIsDownloadingWord(true);
    try {
      await downloadTestPlanDocx(suiteResult, testPlanMarkdown);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadingWord(false), 1500);
  };

  const handleDownloadCodeFile = (code: string, ext: string) => {
    const rawTitle = currentScenario?.title || 'test_suite';
    const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'suite';
    downloadTextFile(code, `${safeTitle}${ext}`);
  };

  const handleDownloadZip = async () => {
    if (!suiteResult) return;
    const blob = await exportTestSuiteZip(suiteResult);
    const rawTitle = currentScenario?.title || 'test_suite';
    const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'suite';
    downloadBlob(blob, `think_automation_lab_${safeTitle}_suite.zip`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const testPlanMarkdown = suiteResult ? generateFormalTestPlanDocument(suiteResult) : '';

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-700 bg-[#0c101d] px-4 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Think Automation Lab
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400">
                  <Bot className="w-3 h-3 text-purple-300" />
                  AI Agent Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI-Powered Test Scenario Analysis, Test Case &amp; Script Generator
              </p>
            </div>
          </div>

          {/* Right: Codegen + AI Agent Settings */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Codegen Button */}
            <button
              onClick={() => setIsCodegenOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 hover:text-emerald-100 transition-all cursor-pointer"
              title="Launch Playwright Codegen — record browser interactions as test scripts"
            >
              <Clapperboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Codegen</span>
            </button>

            {/* AI Agent Config Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Configure AI Model / API Key"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {aiSettings.provider === 'gemini' ? 'Gemini AI' : aiSettings.provider === 'openai' ? 'OpenAI' : 'AI Agent'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step 1: Input Scenario Card */}
        <section className="bg-[#0c101d] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>1. Write Test Scenario or Upload / Paste Image</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Type requirements, upload a document / image (<strong className="text-purple-300">.docx, .xlsx, .png, .jpg</strong>), or <strong className="text-emerald-400">Paste (Ctrl+V)</strong> any screenshot.
              </p>
            </div>

            {/* Upload / File Remove Controls */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".docx,.doc,.xlsx,.xls,.txt,.json,.csv,.feature,.md,.png,.jpg,.jpeg,.webp,.bmp"
                className="hidden"
                id="file-upload"
              />

              {fileName ? (
                <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/40 px-3 py-1.5 rounded-xl">
                  {imagePreviewUrl ? (
                    <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  )}
                  <span className="text-xs font-mono text-purple-200 truncate max-w-[160px]">{fileName}</span>
                  <button
                    onClick={handleRemoveFile}
                    className="text-slate-400 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                    title="Remove attached file or image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white cursor-pointer transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>{isExtractingFile ? 'Extracting...' : 'Upload File / Image'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Image Thumbnail Preview (if attached or pasted) */}
          {imagePreviewUrl && (
            <div className="flex items-center gap-3 p-3 bg-[#070b14] border border-purple-500/30 rounded-xl">
              <div className="relative group shrink-0">
                <img
                  src={imagePreviewUrl}
                  alt="Attached Scenario Screenshot"
                  className="w-16 h-16 object-cover rounded-lg border border-purple-400/50 shadow-md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200 truncate">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{fileName || 'Attached Image'}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  OCR extracted text into the scenario field below. You can edit the text directly before generating test cases.
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                title="Remove attached image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Extraction in progress banner */}
          {isExtractingFile && (
            <div className="flex items-center gap-2 p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 font-mono animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>{extractionStatus || 'Reading and extracting text from file/image...'}</span>
            </div>
          )}

          {/* Textarea with onPaste support */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type scenario in plain English, upload a document/image, or press Ctrl+V to paste a screenshot here..."
              rows={7}
              className="w-full bg-[#070b14] border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 transition-all font-mono leading-relaxed resize-y"
            />
          </div>

          {/* Action Row: Load Sample, Clear, Generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className="text-xs font-medium text-purple-300 hover:text-purple-200 underline decoration-purple-400/40 underline-offset-4 cursor-pointer transition-colors"
              >
                Load Sample Scenario
              </button>
              {inputText && (
                <span className="text-xs text-slate-300 font-mono">
                  • {inputText.length} characters
                </span>
              )}
            </div>

            {/* Clear and Generate Buttons Side-by-Side */}
            <div className="flex items-center gap-2">
              {inputText && (
                <button
                  onClick={handleClearText}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 border border-slate-700 transition-all cursor-pointer shadow-md"
                  title="Clear current scenario and reset results"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}

              <button
                onClick={handleGenerateTestCases}
                disabled={isGenerating || !inputText.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Scenario & Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Generate Test Cases (AI Agent)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Step 2: Generated Results & Action Buttons */}
        {hasGenerated && suiteResult && suiteResult.testCases.length > 0 ? (
          <section id="generated-results-section" className="space-y-4 scroll-mt-24">
            {/* Action Buttons Bar */}
            <div className="bg-[#0c101d] border border-slate-700 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* View Tabs */}
                <button
                  onClick={() => setActiveTab('test_cases')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'test_cases'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-300" />
                  <span>Generated Test Cases ({suiteResult.totalCases})</span>
                </button>

                <button
                  onClick={() => setActiveTab('test_plan')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'test_plan'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-300" />
                  <span>View Test Plan</span>
                </button>

                <button
                  onClick={() => setActiveTab('playwright')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'playwright'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <span>🎭</span>
                  <span>Playwright Script</span>
                </button>

                <button
                  onClick={() => setActiveTab('cypress')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'cypress'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <span>🌲</span>
                  <span>Cypress Script</span>
                </button>
              </div>

              {/* Direct Local PC Downloads */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 transition-all cursor-pointer"
                  title="Download all generated tests, scripts, and plan in a zip file"
                >
                  <Archive className="w-4 h-4 text-sky-400" />
                  <span>Download All (.zip)</span>
                </button>
              </div>
            </div>

            {/* 1. Tab: Test Cases Table */}
            {activeTab === 'test_cases' && (
              <div className="bg-[#0c101d] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Generated Test Cases: </span>
                      <span className="text-purple-300">{currentScenario?.title || 'Scenario'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400">
                        {suiteResult.totalCases} Cases
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Analyzed {currentScenario?.fields.length || 0} fields, {currentScenario?.rules.length || 0} business rules, and {currentScenario?.roles.join(', ') || 'User'} role.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isDownloadingExcel ? 'Excel Ready!' : 'Download Excel (.xlsx)'}</span>
                  </button>
                </div>

                {/* Test Cases Table matching ChatGPT QA Matrix layout */}
                <div className="overflow-x-auto rounded-xl border border-zinc-800 w-full bg-[#000000] shadow-2xl">
                  <table className="w-full text-left text-xs border-collapse table-fixed min-w-[1050px]">
                    <thead className="bg-[#050505] text-white text-[12px] font-bold border-b border-zinc-800 tracking-wide">
                      <tr>
                        <th className="py-3.5 px-3.5 w-[7%]">TC ID</th>
                        <th className="py-3.5 px-3 w-[7%]">AC</th>
                        <th className="py-3.5 px-4 w-[23%]">Scenario / Test Title</th>
                        <th className="py-3.5 px-4 w-[20%]">Preconditions / Test Data</th>
                        <th className="py-3.5 px-4 w-[20%]">Test Steps</th>
                        <th className="py-3.5 px-4 w-[18%]">Expected Result</th>
                        <th className="py-3.5 px-3 w-[5%] text-center">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/90 font-sans">
                      {suiteResult.testCases.map((tc, idx) => (
                        <tr
                          key={tc.id}
                          className={`hover:bg-zinc-900/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-[#020204]' : 'bg-[#070709]'
                          }`}
                        >
                          {/* TC ID */}
                          <td className="py-3.5 px-3.5 align-top font-mono font-semibold text-white text-xs">
                            {tc.id}
                          </td>

                          {/* AC */}
                          <td className="py-3.5 px-3 align-top font-mono text-zinc-300 text-xs">
                            {tc.acRef || `AC-${String(idx + 1).padStart(2, '0')}`}
                          </td>

                          {/* Scenario / Test Title */}
                          <td className="py-3.5 px-4 align-top font-normal text-white text-xs leading-relaxed break-words">
                            {tc.title}
                          </td>

                          {/* Preconditions / Test Data */}
                          <td className="py-3.5 px-4 align-top text-zinc-300 text-xs leading-relaxed break-words">
                            {tc.preconditions && tc.preconditions.length > 0
                              ? tc.preconditions.join('; ')
                              : Object.entries(tc.testData || {})
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ') || 'None'}
                          </td>

                          {/* Test Steps */}
                          <td className="py-3.5 px-4 align-top text-zinc-200 text-xs leading-relaxed break-words">
                            <div className="space-y-1">
                              {tc.steps.map((step, sIdx) => {
                                const cleanStep = step.replace(/^\d+\.\s*/, '');
                                return (
                                  <div key={sIdx} className="text-zinc-200">
                                    <span className="text-zinc-400 font-mono mr-1">{sIdx + 1}.</span>
                                    <span>{cleanStep}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Expected Result */}
                          <td className="py-3.5 px-4 align-top text-white text-xs leading-relaxed break-words font-medium">
                            {tc.expectedResult}
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-3 align-top text-center font-mono font-bold text-xs">
                            <span
                              className={
                                tc.priority.startsWith('P0')
                                  ? 'text-rose-400'
                                  : tc.priority.startsWith('P1')
                                  ? 'text-amber-400'
                                  : 'text-blue-400'
                              }
                            >
                              {tc.priority.split(' ')[0] || 'P0'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Tab: Test Plan View */}
            {activeTab === 'test_plan' && (
              <div className="bg-[#0c101d] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <span>Formal Master Test Plan</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Complete test strategy, quality gates, and specifications for <strong className="text-purple-300">{currentScenario?.title}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(testPlanMarkdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Plan'}</span>
                    </button>

                    <button
                      onClick={handleDownloadWordPlan}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloadingWord ? 'Downloading Word...' : 'Download Word Plan (.docx)'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-8 overflow-y-auto max-h-[700px] shadow-inner">
                  <MarkdownRenderer content={testPlanMarkdown} />
                </div>
              </div>
            )}

            {/* 3. Tab: Playwright Script */}
            {activeTab === 'playwright' && (
              <div className="bg-[#0c101d] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>🎭 Playwright TypeScript Test Script</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Ready to execute with <code className="text-purple-300 font-mono">npx playwright test</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(suiteResult.generatedCode.playwright)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadCodeFile(suiteResult.generatedCode.playwright, '.spec.ts')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .spec.ts</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#070b14] border border-slate-700 rounded-xl p-4 overflow-x-auto max-h-[550px]">
                  <pre className="font-mono text-xs text-purple-200 leading-relaxed">
                    <code>{suiteResult.generatedCode.playwright}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* 4. Tab: Cypress Script */}
            {activeTab === 'cypress' && (
              <div className="bg-[#0c101d] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>🌲 Cypress End-to-End Test Script</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Ready to execute with <code className="text-purple-300 font-mono">npx cypress run</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(suiteResult.generatedCode.cypress)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadCodeFile(suiteResult.generatedCode.cypress, '.cy.ts')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .cy.ts</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#070b14] border border-slate-700 rounded-xl p-4 overflow-x-auto max-h-[550px]">
                  <pre className="font-mono text-xs text-emerald-200 leading-relaxed">
                    <code>{suiteResult.generatedCode.cypress}</code>
                  </pre>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* Clean Empty State when no test cases are generated */
          <section className="bg-[#0c101d] border border-slate-700 rounded-2xl p-12 text-center shadow-xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 shadow-inner">
              <Inbox className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white">No Test Cases Generated Yet</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Enter your test scenario in the box above or upload a document, then click <strong className="text-purple-300">"Generate Test Cases"</strong> to view test cases, test plan, and automation scripts here.
            </p>
          </section>
        )}
      </main>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSaveSettings={(newSettings) => {
          setAiSettings(newSettings);
          localStorage.setItem('automate_test_case_ai_settings', JSON.stringify(newSettings));
        }}
      />

      {/* Playwright Codegen Modal */}
      <CodegenModal
        isOpen={isCodegenOpen}
        onClose={() => setIsCodegenOpen(false)}
      />

      {/* Clean Minimal Plain Footer */}
      <footer className="border-t border-slate-800 bg-[#070b14] py-6 px-4 text-center text-xs text-slate-300 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-white">Think Automation Lab</span>
            <span>•</span>
            <span className="text-purple-300 font-medium">By Rounak</span>
          </div>

          <span className="text-slate-400">
            © 2026 Think Automation Lab. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
