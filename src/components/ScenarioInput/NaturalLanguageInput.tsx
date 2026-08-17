import React, { useState } from 'react';
import { Sparkles, Wand2, ArrowRight, Lightbulb, FileText } from 'lucide-react';
import { ScenarioModel } from '../../types';
import { parseNaturalLanguageScenario } from '../../engine/scenarioParser';

interface NaturalLanguageInputProps {
  onScenarioGenerated: (scenario: ScenarioModel) => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: 'Enterprise Jarowa List CRUD & QC Flow',
    text: `As a QC Inspector, I want to manage Jarowa Batch records with batchNumber (format: JAR-XXXX, min 5 max 20 chars), itemQuantity (number between 1 and 10,000), qcStatus (Draft, Pending_QC, QC_Passed, QC_Rejected), and notes. When user clicks "Create Batch", open modal. When batchNumber format is invalid, show "Batch Number must be 3 uppercase letters followed by hyphen and digits". When quantity > 10000, reject submission. When role is Viewer, disable approve/delete buttons.`,
  },
  {
    title: 'User Login & 2FA Auth System',
    text: `User Authentication scenario with email (valid corporate email format), password (min 8 max 64 chars, special symbol), 2faCode (6-digit OTP number), and rememberMe checkbox. When password attempts exceed 5, lock account for 15 minutes. When login succeeds with Admin role, redirect to /admin/dashboard. When login succeeds with StandardUser, redirect to /portal.`,
  },
  {
    title: 'E-Commerce Checkout & Payment Card',
    text: `Checkout payment flow with fullName (min 2 max 70 chars), cardNumber (16-digit Visa/Mastercard), expiryDate (MM/YY format), cvv (3-4 digits), couponCode (optional, min 3 max 15), and orderAmount (min $0.50 max $50,000). When coupon is SUMMER2026, apply 15% discount. When card expiry is past, block submit and display "Card is expired". Handle 402 Card Declined gracefully.`,
  },
  {
    title: 'Banking Money Transfer & Daily Limit BVA',
    text: `Online banking transfer with recipientIban (min 10 max 34 chars), transferAmount (min $1.00 max $25,000.00 daily limit), transferType (Standard, Wire, Scheduled), and reference note (max 140 chars). When transferAmount < 1.00, show boundary error "Minimum transfer is $1.00". When transferAmount > 25000.00, show "Transfer exceeds daily limit of $25,000.00". When balance is insufficient, prevent confirmation.`,
  },
];

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ onScenarioGenerated }) => {
  const [inputText, setInputText] = useState(EXAMPLE_PROMPTS[0].text);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const scenario = parseNaturalLanguageScenario(inputText);
      onScenarioGenerated(scenario);
      setIsGenerating(false);
    }, 250);
  };

  const handleApplyExample = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="space-y-4">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-sky-400" />
            Natural Language / User Story Ingestion
          </h3>
          <p className="text-xs text-slate-400">
            Paste your user story, acceptance criteria, or requirements. Our 100% coverage engine automatically detects fields, boundary ranges, validation rules, and error paths.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !inputText.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-500 hover:from-sky-400 hover:via-indigo-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing & Synthesizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 100% Coverage Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={7}
          placeholder="Describe your user scenario, fields, boundaries, validations, and expected outcomes here..."
          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono leading-relaxed resize-y"
        />
        <div className="absolute right-3 bottom-4 text-[11px] text-slate-500 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          {inputText.length} chars
        </div>
      </div>

      {/* Quick Example Chips */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Example Scenarios (Click to Load):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyExample(ex.text)}
              className="text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 group-hover:text-sky-300">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate">{ex.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                {ex.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
