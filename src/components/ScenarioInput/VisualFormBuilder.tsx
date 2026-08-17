import React, { useState } from 'react';
import { Plus, Trash2, Shield, Settings2, Sparkles, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { ScenarioModel, FieldDefinition, FieldDataType, BusinessRule, ActionDefinition } from '../../types';

interface VisualFormBuilderProps {
  currentScenario: ScenarioModel;
  onScenarioUpdated: (scenario: ScenarioModel) => void;
}

export const VisualFormBuilder: React.FC<VisualFormBuilderProps> = ({
  currentScenario,
  onScenarioUpdated,
}) => {
  const [scenario, setScenario] = useState<ScenarioModel>(currentScenario);

  const handleFieldChange = (index: number, key: keyof FieldDefinition, value: any) => {
    const updatedFields = [...scenario.fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    const updated = { ...scenario, fields: updatedFields };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleAddField = () => {
    const newField: FieldDefinition = {
      id: `f_${Date.now()}`,
      name: `field_${scenario.fields.length + 1}`,
      label: `New Field ${scenario.fields.length + 1}`,
      type: 'text',
      required: true,
      min: 1,
      max: 100,
      defaultValue: 'Sample Value',
    };
    const updated = { ...scenario, fields: [...scenario.fields, newField] };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = scenario.fields.filter((_, i) => i !== index);
    const updated = { ...scenario, fields: updatedFields };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleAddRule = () => {
    const newRule: BusinessRule = {
      id: `r_${Date.now()}`,
      condition: 'When field value is invalid',
      effect: 'Display specific error message and prevent action',
    };
    const updated = { ...scenario, rules: [...scenario.rules, newRule] };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = scenario.rules.filter((_, i) => i !== index);
    const updated = { ...scenario, rules: updatedRules };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleAddRole = (roleName: string) => {
    if (!roleName.trim() || scenario.roles.includes(roleName)) return;
    const updated = { ...scenario, roles: [...scenario.roles, roleName.trim()] };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  const handleRemoveRole = (role: string) => {
    const updated = { ...scenario, roles: scenario.roles.filter((r) => r !== role) };
    setScenario(updated);
    onScenarioUpdated(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Meta info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Title</label>
          <input
            type="text"
            value={scenario.title}
            onChange={(e) => {
              const updated = { ...scenario, title: e.target.value };
              setScenario(updated);
              onScenarioUpdated(updated);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Type</label>
          <select
            value={scenario.type}
            onChange={(e) => {
              const updated = { ...scenario, type: e.target.value as any };
              setScenario(updated);
              onScenarioUpdated(updated);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="workflow_crud">Workflow / CRUD Flow</option>
            <option value="ui_form">UI Form & Validation</option>
            <option value="user_story">User Story / Acceptance Criteria</option>
            <option value="api_endpoint">REST API Endpoint</option>
          </select>
        </div>
      </div>

      {/* User Roles & Access Boundaries */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Roles & RBAC Access Matrix
          </label>
          <span className="text-[11px] text-slate-400">Tests will automatically generate role permission matrix</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {scenario.roles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
            >
              {role}
              <button
                onClick={() => handleRemoveRole(role)}
                className="text-slate-400 hover:text-rose-400"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="+ Add Role (e.g. Inspector, Admin)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRole((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
          />
        </div>
      </div>

      {/* Form Fields & Boundary Values Configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-400" />
              Scenario Fields & Boundary Rules ({scenario.fields.length})
            </h4>
            <p className="text-xs text-slate-400">
              Each field generates Happy Path, Boundary (Min/Max/Overflow/Underflow), Equivalence, and Negative test cases.
            </p>
          </div>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Field
          </button>
        </div>

        <div className="space-y-2">
          {scenario.fields.map((field, idx) => (
            <div
              key={field.id || idx}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Field Label */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100"
                  />
                </div>

                {/* Field Name */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Key Name</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono"
                  />
                </div>

                {/* Field Type */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Data Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(idx, 'type', e.target.value as FieldDataType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="text">Text (String)</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="password">Password</option>
                    <option value="select">Select Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="date">Date</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>

                {/* Min / Max Boundaries */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Min Boundary</label>
                  <input
                    type="number"
                    value={field.min ?? ''}
                    placeholder="e.g. 1"
                    onChange={(e) => handleFieldChange(idx, 'min', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Max Boundary</label>
                  <input
                    type="number"
                    value={field.max ?? ''}
                    placeholder="e.g. 500"
                    onChange={(e) => handleFieldChange(idx, 'max', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Actions */}
                <div className="sm:col-span-1 flex items-center justify-end gap-2 pt-3">
                  <button
                    onClick={() => handleRemoveField(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secondary row for pattern, required, and default value */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <span className="text-[11px] font-medium">Required Field</span>
                </label>

                {field.type === 'text' && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Regex:</span>
                    <input
                      type="text"
                      placeholder="^[A-Z]{3}-[0-9]+$"
                      value={field.pattern || ''}
                      onChange={(e) => handleFieldChange(idx, 'pattern', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 font-mono text-[11px] text-sky-300 w-36"
                    />
                  </div>
                )}

                {field.type === 'select' && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Options (comma-separated):</span>
                    <input
                      type="text"
                      placeholder="Option1, Option2, Option3"
                      value={(field.options || []).join(', ')}
                      onChange={(e) =>
                        handleFieldChange(
                          idx,
                          'options',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 font-mono text-[11px] text-emerald-300 w-52"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                  <span>Sample/Default:</span>
                  <input
                    type="text"
                    value={field.defaultValue || ''}
                    onChange={(e) => handleFieldChange(idx, 'defaultValue', e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 w-36"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Rules and Branches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Business Rules & Branching Decisions ({scenario.rules.length})
            </h4>
            <p className="text-xs text-slate-400">
              Define conditional logic (e.g. IF condition THEN effect) to ensure complete branch coverage.
            </p>
          </div>
          <button
            onClick={handleAddRule}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>

        <div className="space-y-2">
          {scenario.rules.map((rule, rIdx) => (
            <div
              key={rule.id || rIdx}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
            >
              <span className="text-[11px] font-mono font-semibold text-indigo-400 shrink-0">
                Rule #{rIdx + 1}
              </span>
              <input
                type="text"
                value={rule.condition}
                placeholder="Condition: When user status is QC_Passed"
                onChange={(e) => {
                  const updatedRules = [...scenario.rules];
                  updatedRules[rIdx] = { ...updatedRules[rIdx], condition: e.target.value };
                  const updated = { ...scenario, rules: updatedRules };
                  setScenario(updated);
                  onScenarioUpdated(updated);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
              <span className="text-slate-500 text-xs">→</span>
              <input
                type="text"
                value={rule.effect}
                placeholder="Effect: Lock record from editing and disable Save"
                onChange={(e) => {
                  const updatedRules = [...scenario.rules];
                  updatedRules[rIdx] = { ...updatedRules[rIdx], effect: e.target.value };
                  const updated = { ...scenario, rules: updatedRules };
                  setScenario(updated);
                  onScenarioUpdated(updated);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
              <button
                onClick={() => handleRemoveRule(rIdx)}
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
