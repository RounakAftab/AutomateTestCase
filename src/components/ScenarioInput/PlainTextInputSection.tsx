import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Check, CheckCircle, FileSpreadsheet, FileText, ArrowRight, X, FileCheck, Trash2, HelpCircle } from 'lucide-react';
import type { ScenarioModel, TestSuiteResult } from '../../types';
import { parseNaturalLanguageScenario } from '../../engine/scenarioParser';
import { downloadTestCasesExcel } from '../../utils/excelExporter';
import { downloadTestPlanDocx } from '../../utils/wordDocxExporter';
import { extractTextFromFile } from '../../utils/fileReaderHelper';
import { generateFormalTestPlanDocument } from '../../engine/testPlanGenerator';

interface PlainTextInputSectionProps {
  currentScenario: ScenarioModel;
  suite: TestSuiteResult;
  onScenarioGenerated: (scenario: ScenarioModel) => void;
}

const SAMPLE_SCENARIOS = [
  {
    title: 'Enterprise Login & 2FA',
    desc: 'Email format, password constraints, 6-digit OTP, account lockout after 5 fails, role routing.',
    text: `User Authentication scenario with email (valid corporate email format), password (min 8 max 64 chars, special symbol), 2faCode (6-digit OTP number), and rememberMe checkbox. When password attempts exceed 5, lock account for 15 minutes. When login succeeds with Admin role, redirect to /admin/dashboard. When login succeeds with StandardUser, redirect to /portal.`,
  },
  {
    title: 'QC Batch & Inspection',
    desc: 'Batch number regex JAR-XXXX, quantity 1-10k, status transitions, role permission gates.',
    text: `As a QC Inspector, I want to manage Jarowa Batch records with batchNumber (format: JAR-XXXX, min 5 max 20 chars), itemQuantity (number between 1 and 10,000), qcStatus (Draft, Pending_QC, QC_Passed, QC_Rejected), and notes. When user clicks "Create Batch", open modal. When batchNumber format is invalid, show "Batch Number must be 3 uppercase letters followed by hyphen and digits". When quantity > 10000, reject submission. When role is Viewer, disable approve/delete buttons.`,
  },
  {
    title: 'E-Commerce Checkout & Cards',
    desc: '16-digit card validation, CVV, expiry check, coupon SUMMER2026, 402 declined handling.',
    text: `Checkout payment flow with fullName (min 2 max 70 chars), cardNumber (16-digit Visa/Mastercard), expiryDate (MM/YY format), cvv (3-4 digits), couponCode (optional, min 3 max 15), and orderAmount (min $0.50 max $50,000). When coupon is SUMMER2026, apply 15% discount. When card expiry is past, block submit and display "Card is expired". Handle 402 Card Declined gracefully.`,
  },
  {
    title: 'Banking Wire & Daily Limits',
    desc: 'IBAN validation, transfer bounds $1-$25k daily cap, balance check, error states.',
    text: `Online banking transfer with recipientIban (min 10 max 34 chars), transferAmount (min $1.00 max $25,000.00 daily limit), transferType (Standard, Wire, Scheduled), and reference note (max 140 chars). When transferAmount < 1.00, show boundary error "Minimum transfer is $1.00". When transferAmount > 25000.00, show "Transfer exceeds daily limit of $25,000.00". When balance is insufficient, prevent confirmation.`,
  },
];

export const PlainTextInputSection: React.FC<PlainTextInputSectionProps> = ({
  currentScenario,
  suite,
  onScenarioGenerated,
}) => {
  const [inputText, setInputText] = useState(currentScenario.rawText || currentScenario.description || SAMPLE_SCENARIOS[0].text);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsingFile(true);

    try {
      const content = await extractTextFromFile(file);
      if (content && content.trim().length > 0) {
        setInputText(content);
        const parsed = parseNaturalLanguageScenario(content);
        onScenarioGenerated(parsed);
        triggerGeneratedFeedback();
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearText = () => {
    setInputText('');
    handleRemoveFile();
  };

  const triggerGeneratedFeedback = () => {
    setJustGenerated(true);
    setTimeout(() => {
      const el = document.getElementById('coverage-matrix-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
    setTimeout(() => setJustGenerated(false), 3000);
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const parsed = parseNaturalLanguageScenario(inputText);
      onScenarioGenerated(parsed);
      setIsGenerating(false);
      triggerGeneratedFeedback();
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const planMd = generateFormalTestPlanDocument(suite);
      await downloadTestPlanDocx(suite, planMd);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadingDocx(false), 1500);
  };

  const handleDownloadExcel = () => {
    setIsDownloadingExcel(true);
    try {
      downloadTestCasesExcel(suite);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsDownloadingExcel(false), 1500);
  };

  return (
    <section id="scenario-input-section" className="space-y-4 scroll-mt-20">
      {/* Sample Scenario Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-white uppercase tracking-wider shrink-0 mr-1">
          Quick Templates:
        </span>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {SAMPLE_SCENARIOS.map((sample, idx) => {
            const isCurrent = currentScenario.title.toLowerCase().includes(sample.title.toLowerCase().split(' ')[0]);
            return (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sample.text);
                  setFileName(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  const parsed = parseNaturalLanguageScenario(sample.text);
                  onScenarioGenerated(parsed);
                  triggerGeneratedFeedback();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-300'
                    : 'bg-[#0c101d] hover:bg-slate-900 text-white border border-slate-700 hover:border-slate-500'
                }`}
                title={sample.desc}
              >
                {sample.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Card */}
      <div className="rounded-2xl border border-slate-700 bg-[#0c101d] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block animate-pulse" />
              <span>Input Requirement or Upload Spec Document</span>
            </h2>
            <p className="text-xs text-white mt-0.5">
              Type plain English user requirements or upload your document (<strong className="text-purple-300">Word .docx, Excel .xlsx, Text .txt</strong>).
            </p>
          </div>

          {/* Quick File Upload & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.doc,.xlsx,.xls,.txt,.json,.csv,.feature,.md,.ts,.spec.ts"
              className="hidden"
            />

            {/* If a file is currently attached, show file badge with Remove (X) option */}
            {fileName ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-900/60 border border-purple-400 text-white shadow-md animate-fade-in">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="max-w-[200px] truncate" title={fileName}>
                  {fileName}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-md text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isParsingFile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span>Extracting File...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Upload Document (.docx, .xlsx, .txt)</span>
                  </>
                )}
              </button>
            )}

            {/* Word .docx Plan download */}
            <button
              onClick={handleDownloadDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 hover:text-purple-200 transition-all cursor-pointer"
              title="Download Master Test Plan in Microsoft Word (.docx)"
            >
              {isDownloadingDocx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-purple-400" />}
              <span>{isDownloadingDocx ? 'Downloaded' : 'Word (.docx)'}</span>
            </button>

            {/* Excel .xlsx download */}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer"
              title="Download formatted Test Cases in Excel (.xlsx)"
            >
              {isDownloadingExcel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isDownloadingExcel ? 'Excel Ready' : 'Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* Text Area with High-Contrast Text */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            placeholder="Type or paste requirement here (e.g. As a QA Engineer, I want to verify password field boundary min 8 max 64, email format, 2FA code, and role permissions...)"
            className="w-full rounded-xl bg-[#070b14] border border-slate-700 p-4 font-mono text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-all leading-relaxed resize-y"
          />

          {inputText && (
            <button
              onClick={handleClearText}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Clear text and reset"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="font-mono">{inputText.length} characters</span>
            <span>•</span>
            <span className="text-white">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-white border border-slate-600">Ctrl + Enter</kbd> to generate
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {justGenerated && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400 px-3 py-1.5 rounded-lg animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>99%+ Test Suite Ready</span>
              </span>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Test Matrix...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Synthesize 99%+ Test Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
