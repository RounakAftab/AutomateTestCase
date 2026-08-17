import React from 'react';
import { GraduationCap, Code2, Rocket, Users, PlayCircle, Trophy } from 'lucide-react';

export const WhatWeOfferSection: React.FC = () => {
  const OFFERS = [
    {
      icon: <GraduationCap className="w-6 h-6 text-purple-600" />,
      bgIcon: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      title: 'Expert-Led Test Suites',
      description: 'Step-by-step automated test suites designed by industry professionals with real-world enterprise experience.',
    },
    {
      icon: <Code2 className="w-6 h-6 text-emerald-600" />,
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      title: 'Hands-on Frameworks',
      description: 'Generate and execute full Playwright TS, Cypress, Jest, PyTest, and Gherkin suites with complete POM fixtures.',
    },
    {
      icon: <Rocket className="w-6 h-6 text-sky-600" />,
      bgIcon: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
      title: 'Automation & 99%+ Coverage',
      description: 'Mathematically comprehensive boundary value analysis, error handling paths, and security edge cases.',
    },
    {
      icon: <Users className="w-6 h-6 text-amber-600" />,
      bgIcon: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      title: 'Master Test Plans',
      description: 'Download full IEEE 829 Master Test Plan documents and CSV execution matrices with a single click.',
    },
  ];

  const STATS = [
    {
      icon: <Users className="w-7 h-7 text-indigo-500" />,
      value: '1K+',
      label: 'Happy Engineers',
    },
    {
      icon: <PlayCircle className="w-7 h-7 text-purple-500" />,
      value: '50+',
      label: 'Scenarios & Templates',
    },
    {
      icon: <Code2 className="w-7 h-7 text-sky-500" />,
      value: '100+',
      label: 'Generated Test Suites',
    },
    {
      icon: <Trophy className="w-7 h-7 text-amber-500" />,
      value: '100%',
      label: 'Practical Guarantee',
    },
  ];

  return (
    <section id="what-we-offer" className="py-16 px-4 lg:px-8 bg-slate-900/40 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto space-y-12 text-center">
        {/* Section Heading matching user's design image */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
            WHAT WE OFFER
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need to Succeed
          </h2>
          <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full" />
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {OFFERS.map((offer, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-6 bg-[#0c101d] border border-slate-800/90 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${offer.bgIcon} transition-transform group-hover:scale-110`}>
                  {offer.icon}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {offer.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {offer.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats Card Bar matching user's design image */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#0c101d] border border-slate-800 shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          {STATS.map((stat, sIdx) => (
            <div key={sIdx} className="flex items-center justify-center gap-4 text-left">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                {stat.icon}
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
