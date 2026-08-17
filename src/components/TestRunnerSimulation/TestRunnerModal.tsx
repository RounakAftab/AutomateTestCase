import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, X, Terminal, Monitor, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestSuiteResult, TestCaseItem } from '../../types';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: TestSuiteResult;
}

interface TestRunStatus {
  id: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  durationMs: number;
  log: string;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose, suite }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [runStatuses, setRunStatuses] = useState<TestRunStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'browser'>('console');
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize test statuses
      const initial: TestRunStatus[] = suite.testCases.map((tc) => ({
        id: tc.id,
        status: 'pending',
        durationMs: 0,
        log: `Preparing test runner for ${tc.id}...`,
      }));
      setRunStatuses(initial);
      setCurrentIndex(-1);
      startSimulation(initial);
    } else {
      setIsRunning(false);
    }
  }, [isOpen, suite]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runStatuses, currentIndex]);

  const startSimulation = (initialList: TestRunStatus[]) => {
    setIsRunning(true);
    let index = 0;
    const total = suite.testCases.length;

    const interval = setInterval(() => {
      if (index >= total) {
        clearInterval(interval);
        setIsRunning(false);
        // Trigger celebratory confetti on 100% test pass!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#6366f1', '#f59e0b'],
        });
        return;
      }

      const tc = suite.testCases[index];
      const duration = Math.floor(Math.random() * 45) + 25;

      setCurrentIndex(index);
      setRunStatuses((prev) => {
        const next = [...prev];
        next[index] = {
          id: tc.id,
          status: 'passed',
          durationMs: duration,
          log: `[Playwright] Running ${tc.id} (${tc.dimension}) -> PASSED (${duration}ms)`,
        };
        return next;
      });

      index++;
    }, 180);
  };

  if (!isOpen) return null;

  const passedCount = runStatuses.filter((s) => s.status === 'passed').length;
  const progressPercent = Math.round((passedCount / suite.testCases.length) * 100);
  const totalDuration = runStatuses.reduce((acc, curr) => acc + curr.durationMs, 0);

  const currentTestCase = currentIndex >= 0 ? suite.testCases[currentIndex] : suite.testCases[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Playwright Test Runner Simulator</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Chromium v126.0 Headless
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Executing 100% test coverage suite for <strong className="text-sky-400">{suite.scenario.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Realtime Stats */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {passedCount} Passed
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">0 Failed</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{suite.totalCases - passedCount} Remaining</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Time: {(totalDuration / 1000).toFixed(2)}s</span>
              <span className="text-sky-400 font-bold">{progressPercent}%</span>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Body: Console & Simulated Viewport */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: Test Case Pipeline Checklist */}
          <div className="md:col-span-5 border-r border-slate-800 p-4 overflow-y-auto max-h-[420px] space-y-1.5 bg-slate-950/20">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Test Execution Queue ({suite.totalCases})
            </span>
            {suite.testCases.map((tc, idx) => {
              const status = runStatuses[idx]?.status || 'pending';
              const isCurrent = currentIndex === idx;
              return (
                <div
                  key={tc.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? 'bg-sky-500/15 border border-sky-500/40 text-white'
                      : status === 'passed'
                      ? 'bg-slate-900/60 text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] text-sky-400 shrink-0">{tc.id}</span>
                    <span className="truncate">{tc.title.split('] ')[1] || tc.title}</span>
                  </div>
                  {status === 'passed' && (
                    <span className="font-mono text-[10px] text-emerald-400 shrink-0 ml-1">
                      {runStatuses[idx]?.durationMs}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Terminal Output */}
          <div className="md:col-span-7 flex flex-col bg-[#070b12] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs">
              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                stdout / execution logs
              </span>
              {!isRunning && progressPercent === 100 && (
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 100% SUITE PASSED
                </span>
              )}
            </div>

            <div className="p-4 font-mono text-[11px] overflow-y-auto max-h-[380px] space-y-1 text-slate-300 leading-relaxed">
              <div className="text-slate-500">
                &gt; npx playwright test --workers=4 --reporter=line
              </div>
              <div className="text-slate-500">
                Running {suite.totalCases} tests using 4 workers across Chromium
              </div>
              <div className="text-slate-600 my-1">
                ------------------------------------------------------------
              </div>

              {runStatuses.map((st, idx) => {
                if (st.status === 'pending') return null;
                const tc = suite.testCases[idx];
                return (
                  <div key={st.id} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-400">[{st.id}]</span>
                    <span className="text-slate-200">{tc.title}</span>
                    <span className="text-slate-500 ml-auto shrink-0">({st.durationMs}ms)</span>
                  </div>
                );
              })}

              {isCurrentIndexRunning(currentIndex) && (
                <div className="flex items-center gap-2 text-sky-400 pt-1">
                  <div className="w-2.5 h-2.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span>Executing step assertions for {currentTestCase?.id}...</span>
                </div>
              )}

              {!isRunning && progressPercent === 100 && (
                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">
                    ✨ 100% Test Coverage Suite Completed: {passedCount} passed ({((totalDuration) / 1000).toFixed(2)}s)
                  </div>
                  <div className="text-sky-400">
                    Playwright HTML report generated at: playwright-report/index.html
                  </div>
                </div>
              )}
              <div ref={terminalBottomRef} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              const initial: TestRunStatus[] = suite.testCases.map((tc) => ({
                id: tc.id,
                status: 'pending',
                durationMs: 0,
                log: `Preparing test runner for ${tc.id}...`,
              }));
              setRunStatuses(initial);
              setCurrentIndex(-1);
              startSimulation(initial);
            }}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Re-run Suite</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  function isCurrentIndexRunning(idx: number) {
    return isRunning && idx >= 0 && idx < suite.testCases.length;
  }
};
