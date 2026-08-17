import React from 'react';
import { PRESET_TEMPLATES } from '../../data/presetTemplates';
import { ScenarioModel } from '../../types';
import { Sparkles, CheckCircle2, ArrowRight, Shield, Layers, Database, ShoppingBag, Landmark } from 'lucide-react';

interface PresetPickerProps {
  onSelectPreset: (scenario: ScenarioModel) => void;
  selectedId: string;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({ onSelectPreset, selectedId }) => {
  const getIcon = (type: string, id: string) => {
    if (id.includes('jarowa')) return <Database className="w-5 h-5 text-sky-400" />;
    if (id.includes('auth')) return <Shield className="w-5 h-5 text-indigo-400" />;
    if (id.includes('checkout')) return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
    if (id.includes('banking')) return <Landmark className="w-5 h-5 text-amber-400" />;
    return <Layers className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Industry-Standard Preset Scenario Library
        </h3>
        <p className="text-xs text-slate-400">
          Select a verified enterprise scenario. Each preset includes complete boundary values, RBAC rules, and negative test matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PRESET_TEMPLATES.map((tmpl) => {
          const isSelected = tmpl.id === selectedId;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectPreset(tmpl)}
              className={`cursor-pointer rounded-xl p-4 transition-all border flex flex-col justify-between group ${
                isSelected
                  ? 'bg-slate-900/90 border-sky-500/80 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getIcon(tmpl.type, tmpl.id)}
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                  {tmpl.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">{tmpl.fields.length} Fields • {tmpl.rules.length} Rules</span>
                <span className="flex items-center gap-1 font-semibold text-sky-400 group-hover:translate-x-0.5 transition-transform">
                  Load Preset <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
