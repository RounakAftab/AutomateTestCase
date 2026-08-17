import React, { useState } from 'react';
import { X, Cpu, Key, Check, Shield, Zap, Sparkles } from 'lucide-react';
import { AISettings } from '../types';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Engine & AI Configuration</h3>
              <p className="text-xs text-slate-400">Configure deterministic offline rule engine or cloud LLM provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Coverage Engine Provider</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'offline_heuristic' })}
                className={`p-3 rounded-xl border text-left transition-all ${localSettings.provider === 'offline_heuristic'
                  ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400 mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  Deterministic Engine
                </div>
                <p className="text-[11px] text-slate-400">
                  100% Offline, mathematically complete BVA, equivalence & negative matrix. Instant speed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, provider: 'gemini' })}
                className={`p-3 rounded-xl border text-left transition-all ${localSettings.provider === 'gemini'
                  ? 'bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini API / Cloud LLM
                </div>
                <p className="text-[11px] text-slate-400">
                  Enhanced reasoning for complex natural language user stories.
                </p>
              </button>
            </div>
          </div>

          {/* API Key Input (if cloud provider chosen) */}
          {localSettings.provider !== 'offline_heuristic' && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">API Key</label>
                  {localSettings.provider === 'gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                    >
                      Get Gemini API key →
                    </a>
                  )}
                  {localSettings.provider === 'openai' && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                    >
                      Get OpenAI API key →
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter your API Key..."
                    value={localSettings.apiKey || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Keys are stored exclusively in your local browser session and never sent elsewhere.
                </span>
              </div>
            </div>

          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved Settings</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
