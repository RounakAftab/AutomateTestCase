import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Globe,
  Play,
  Copy,
  Check,
  Terminal,
  Loader2,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  Code2,
  Monitor,
  RefreshCw,
} from 'lucide-react';

interface CodegenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BrowserChoice = 'chromium' | 'firefox' | 'webkit';
type CodegenStatus = 'idle' | 'connecting' | 'launching' | 'recording' | 'error' | 'success';

interface BrowserOption {
  value: BrowserChoice;
  label: string;
  icon: string;
  description: string;
}

const BROWSERS: BrowserOption[] = [
  { value: 'chromium', label: 'Chromium', icon: '🔵', description: 'Google Chrome / Edge engine (recommended)' },
  { value: 'firefox', label: 'Firefox', icon: '🦊', description: 'Mozilla Firefox engine' },
  { value: 'webkit', label: 'WebKit', icon: '🍎', description: 'Safari / WebKit engine' },
];

const LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript', ext: '.spec.ts' },
  { value: 'javascript', label: 'JavaScript', ext: '.spec.js' },
  { value: 'python', label: 'Python', ext: '.py' },
  { value: 'java', label: 'Java', ext: '.java' },
  { value: 'csharp', label: 'C#', ext: '.cs' },
];

export function CodegenModal({ isOpen, onClose }: CodegenModalProps) {
  const [url, setUrl] = useState('');
  const [browser, setBrowser] = useState<BrowserChoice>('chromium');
  const [language, setLanguage] = useState('typescript');
  const [outputFile, setOutputFile] = useState('recorded_test.spec.ts');
  const [status, setStatus] = useState<CodegenStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedCommand, setGeneratedCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setStatusMessage('');
      setGeneratedCommand('');
      setServerAvailable(null);
      // Auto-focus URL input
      setTimeout(() => urlInputRef.current?.focus(), 100);
      // Check if local codegen server is available
      checkServerAvailability();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-update output filename when language changes
    const lang = LANGUAGE_OPTIONS.find((l) => l.value === language);
    if (lang) {
      setOutputFile((prev) => {
        const base = prev.replace(/\.(spec\.ts|spec\.js|py|java|cs)$/, '');
        return `${base}${lang.ext}`;
      });
    }
  }, [language]);

  const checkServerAvailability = async () => {
    try {
      const resp = await fetch('http://localhost:4321/health', { signal: AbortSignal.timeout(1500) });
      setServerAvailable(resp.ok);
    } catch {
      setServerAvailable(false);
    }
  };

  const buildCommand = (targetUrl: string) => {
    const langFlag = language !== 'typescript' ? `--lang ${language} ` : '';
    const browserFlag = browser !== 'chromium' ? `--browser ${browser} ` : '';
    const outputFlag = outputFile ? `--output ${outputFile} ` : '';
    return `npx playwright codegen ${browserFlag}${langFlag}${outputFlag}"${targetUrl}"`;
  };

  const handleLaunch = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // Validate URL
    try {
      const parsed = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
      const finalUrl = parsed.href;
      setUrl(finalUrl);

      const cmd = buildCommand(finalUrl);
      setGeneratedCommand(cmd);

      if (serverAvailable) {
        // Try to trigger via local server
        setStatus('connecting');
        setStatusMessage('Connecting to Playwright Codegen server...');
        try {
          const res = await fetch('http://localhost:4321/codegen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl, browser, language, outputFile }),
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            setStatus('recording');
            setStatusMessage('🎬 Playwright Codegen is now open and recording your actions. Close the recorder window to stop.');
          } else {
            setStatus('error');
            setStatusMessage('Server responded with an error. Use the manual command below.');
          }
        } catch {
          setStatus('error');
          setStatusMessage('Could not reach the server. Use the manual command below instead.');
        }
      } else {
        // No server — show the command
        setStatus('success');
        setStatusMessage('Copy and run the command below in your terminal to launch Playwright Codegen:');
      }
    } catch {
      setStatus('error');
      setStatusMessage('Invalid URL. Please enter a valid web address (e.g. https://example.com).');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLaunch();
    if (e.key === 'Escape') onClose();
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#0c101d] border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Playwright Codegen</h2>
              <p className="text-[11px] text-slate-400">Record browser interactions as test scripts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* How it works badge */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300/90 leading-relaxed">
            <Monitor className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>
              Playwright Codegen opens a live browser window and <strong className="text-emerald-200">records every click, type, and navigation</strong> you make — then auto-generates the corresponding test script in your selected language.
            </span>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Target URL
            </label>
            <div className="relative">
              <input
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setStatus('idle'); setGeneratedCommand(''); }}
                onKeyDown={handleKeyDown}
                placeholder="https://your-app.com  or  localhost:3000"
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
              />
            </div>
          </div>

          {/* Browser + Language Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Browser */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Browser</label>
              <div className="flex flex-col gap-1.5">
                {BROWSERS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBrowser(b.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer text-left ${
                      browser === b.value
                        ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-200'
                        : 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{b.icon}</span>
                    <span className="font-semibold">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Output Language</label>
              <div className="flex flex-col gap-1.5">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      language === lang.value
                        ? 'bg-purple-600/20 border-purple-500/60 text-purple-200'
                        : 'bg-[#070b14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{lang.label}</span>
                    <span className="font-mono text-[10px] opacity-60">{lang.ext}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced: output file */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Advanced options
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Output File Name</label>
                <input
                  type="text"
                  value={outputFile}
                  onChange={(e) => setOutputFile(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>
            )}
          </div>

          {/* Status / Result Area */}
          {status === 'connecting' && (
            <div className="flex items-center gap-3 p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs text-blue-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {status === 'recording' && (
            <div className="flex items-center gap-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2.5 p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Generated Command Box */}
          {(status === 'success' || status === 'error') && generatedCommand && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Terminal Command
                </label>
                <button
                  onClick={copyCommand}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {copied ? (
                    <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>
              <div className="bg-[#070b14] border border-amber-500/20 rounded-xl p-3.5 font-mono text-xs text-amber-200 leading-relaxed break-all select-all">
                {generatedCommand}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Run this in your project's terminal. Playwright will open a browser window — interact with your app to record actions. When done, close the browser window and the script will be saved.
              </p>
            </div>
          )}

          {/* Server Status Indicator */}
          {serverAvailable !== null && (
            <div className={`flex items-center gap-2 text-[11px] ${serverAvailable ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              {serverAvailable
                ? 'Local Codegen Server is active — will launch automatically'
                : 'Manual mode — copy the command to your terminal'}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between gap-3">
          <a
            href="https://playwright.dev/docs/codegen"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Playwright Docs
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={!url.trim() || status === 'connecting'}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              {status === 'connecting' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Launching...</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Start Recording</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
