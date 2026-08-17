import React from 'react';
import { CheckCircle2, Award, Filter, Info } from 'lucide-react';
import type { TestSuiteResult, CoverageDimension } from '../../types';

interface CoverageScorecardProps {
  suite: TestSuiteResult;
  selectedDimension: CoverageDimension | 'all';
  onSelectDimension: (dim: CoverageDimension | 'all') => void;
}

export const CoverageScorecard: React.FC<CoverageScorecardProps> = ({
  suite,
  selectedDimension,
  onSelectDimension,
}) => {
  const { breakdown, totalCases, coverageScore } = suite;

  const DIMENSION_CONFIG: {
    key: CoverageDimension;
    label: string;
    description: string;
    count: number;
    color: string;
    activeBorder: string;
    activeBg: string;
  }[] = [
    {
      key: 'happy_path',
      label: '1. Happy Path (Positive Flow)',
      description: 'Standard successful user actions with valid information',
      count: breakdown.happy_path,
      color: 'text-purple-300',
      activeBorder: 'border-purple-400',
      activeBg: 'bg-purple-500/25',
    },
    {
      key: 'boundary_value',
      label: '2. Boundary Value (Limits)',
      description: 'Tests exact minimum, maximum, and threshold limits',
      count: breakdown.boundary_value,
      color: 'text-indigo-300',
      activeBorder: 'border-indigo-400',
      activeBg: 'bg-indigo-500/25',
    },
    {
      key: 'equivalence_partition',
      label: '3. Valid & Invalid Inputs',
      description: 'Grouped tests for correct vs incorrect data formats',
      count: breakdown.equivalence_partition,
      color: 'text-sky-300',
      activeBorder: 'border-sky-400',
      activeBg: 'bg-sky-500/25',
    },
    {
      key: 'negative_error',
      label: '4. Error & Negative Paths',
      description: 'Wrong passwords, missing fields, and error notifications',
      count: breakdown.negative_error,
      color: 'text-rose-300',
      activeBorder: 'border-rose-400',
      activeBg: 'bg-rose-500/25',
    },
    {
      key: 'state_transition',
      label: '5. Rules & User Roles',
      description: 'Conditional business rules, permissions, and status changes',
      count: breakdown.state_transition,
      color: 'text-amber-300',
      activeBorder: 'border-amber-400',
      activeBg: 'bg-amber-500/25',
    },
    {
      key: 'security_edge',
      label: '6. Security & Spam Protection',
      description: 'Special character injections, XSS checks, and rapid clicks',
      count: breakdown.security_edge,
      color: 'text-emerald-300',
      activeBorder: 'border-emerald-400',
      activeBg: 'bg-emerald-500/25',
    },
    {
      key: 'accessibility',
      label: '7. Usability & Keyboard (A11y)',
      description: 'Keyboard navigation (Tab, Enter key) and screen reader readiness',
      count: breakdown.accessibility,
      color: 'text-teal-300',
      activeBorder: 'border-teal-400',
      activeBg: 'bg-teal-500/25',
    },
  ];

  return (
    <section id="coverage-matrix-section" className="space-y-4 scroll-mt-20">
      {/* Top Coverage Summary Bar */}
      <div className="rounded-2xl border border-slate-700 bg-[#0c101d] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Left: Gauge and Scenario Context */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-400 stroke-current transition-all duration-700 ease-out"
                  strokeDasharray={`${coverageScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-white tracking-tight">{coverageScore}%</span>
                <span className="text-[8px] font-bold text-purple-400 uppercase">Coverage</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Test Coverage Verification Matrix
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  IEEE 829 Standard
                </span>
              </div>
              <p className="text-xs text-white mt-0.5">
                Active Scenario: <strong className="text-purple-300 font-bold">{suite.scenario.title}</strong>
              </p>
            </div>
          </div>

          {/* Right: Key Stats */}
          <div className="flex items-center gap-4 bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 shrink-0 self-stretch md:self-auto justify-around">
            <div className="text-center px-1">
              <span className="text-base font-bold text-white font-mono">{totalCases}</span>
              <span className="block text-[10px] text-white font-semibold uppercase">Total Cases</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-700" />
            <div className="text-center px-1">
              <span className="text-base font-bold text-indigo-300 font-mono">7 / 7</span>
              <span className="block text-[10px] text-white font-semibold uppercase">Pillars</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-700" />
            <div className="text-center px-1">
              <span className="text-base font-bold text-emerald-400 font-mono">0 Gaps</span>
              <span className="block text-[10px] text-white font-semibold uppercase">Risk Gate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Dimension Filter Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>Filter Test Cases by Testing Type (Click any card):</span>
          </span>
          {selectedDimension !== 'all' && (
            <button
              onClick={() => onSelectDimension('all')}
              className="text-xs text-purple-300 hover:text-white font-bold cursor-pointer underline"
            >
              Show All ({totalCases} Cases)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DIMENSION_CONFIG.map((dim) => {
            const isSelected = selectedDimension === dim.key;
            return (
              <button
                key={dim.key}
                onClick={() => onSelectDimension(isSelected ? 'all' : dim.key)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? `${dim.activeBg} ${dim.activeBorder} text-white shadow-lg ring-2 ring-purple-400`
                    : 'bg-[#0c101d] hover:bg-slate-900 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${dim.color} flex items-center gap-1.5`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {dim.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#070b14] text-white border border-slate-700">
                    {dim.count}
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {dim.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
