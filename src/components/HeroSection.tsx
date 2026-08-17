import React from 'react';
import { ArrowRight, User, CheckCircle2, Code2, Users, Play, Settings, Database, Activity, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onAboutClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onAboutClick }) => {
  return (
    <section className="relative overflow-hidden bg-[#070b14] pt-8 pb-14 px-4 lg:px-8 border-b border-slate-800/60">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left Column: Hero Text & CTAs */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
            <span className="font-mono text-purple-400">&lt;/&gt;</span>
            <span className="tracking-wider uppercase text-[11px] font-bold text-slate-200">
              LEARN • BUILD • AUTOMATE • EXCEL
            </span>
          </div>

          {/* Large Hero Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            Think Automation.<br />
            Build <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">The Future.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            A hands-on platform for Automation Testing, Test Engineering, and Quality Assurance enthusiasts. Input your scenarios to automatically generate <strong>99%+ coverage test suites</strong> and master test plans.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              onClick={onExploreClick}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore Generator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onAboutClick}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#0b0f19] hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <User className="w-4 h-4 text-purple-400" />
              <span>About Rounak</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Practical Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Real Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>99%+ Coverage Guarantee</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Code IDE & Floating Tech Badges matching design */}
        <div className="lg:col-span-6 relative flex items-center justify-center pt-6 lg:pt-0">
          {/* Outer dotted grid container */}
          <div className="relative w-full max-w-lg p-6">
            {/* Top Left Floating Badge: Playwright */}
            <div className="absolute -top-1 left-2 sm:left-4 z-20 flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-lg shadow-purple-500/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-sm">
                &#123;&#125;
              </div>
              <span className="text-[10px] font-semibold text-slate-300">Playwright</span>
            </div>

            {/* Bottom Left Floating Badge: Selenium */}
            <div className="absolute -bottom-1 left-2 sm:left-4 z-20 flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                Se
              </div>
              <span className="text-[10px] font-semibold text-slate-300">Selenium</span>
            </div>

            {/* Top Right Floating Badge: API Testing */}
            <div className="absolute -top-1 right-2 sm:right-4 z-20 flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-lg shadow-amber-500/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-300">API Testing</span>
            </div>

            {/* Bottom Right Floating Badge: CI/CD */}
            <div className="absolute -bottom-1 right-2 sm:right-4 z-20 flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30 shadow-lg shadow-sky-500/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-300">CI/CD</span>
            </div>

            {/* Central Mock IDE / Code Window matching the user's image */}
            <div className="relative rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl overflow-hidden mx-6 my-4">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0d1322] border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>

              {/* Code Snippet lines */}
              <div className="p-5 font-mono text-xs text-slate-300 leading-relaxed bg-[#090d16]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 select-none text-[11px] w-3">1</span>
                    <span>
                      <span className="text-purple-400">describe</span>(<span className="text-emerald-300">'Automation Lab'</span>, () =&gt; &#123;
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pl-4">
                    <span className="text-slate-600 select-none text-[11px] w-3">2</span>
                    <span>
                      <span className="text-purple-400">it</span>(<span className="text-emerald-300">'makes QA smarter'</span>, () =&gt; &#123;
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pl-8">
                    <span className="text-slate-600 select-none text-[11px] w-3">3</span>
                    <span className="text-sky-300">think();</span>
                  </div>
                  <div className="flex items-center gap-4 pl-8">
                    <span className="text-slate-600 select-none text-[11px] w-3">4</span>
                    <span className="text-indigo-400">automate();</span>
                  </div>
                  <div className="flex items-center gap-4 pl-8">
                    <span className="text-slate-600 select-none text-[11px] w-3">5</span>
                    <span>
                      <span className="text-amber-400">assert</span>(quality === <span className="text-emerald-300">'perfect'</span>);
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pl-4">
                    <span className="text-slate-600 select-none text-[11px] w-3">6</span>
                    <span>&#125;);</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 select-none text-[11px] w-3">7</span>
                    <span>&#125;);</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
