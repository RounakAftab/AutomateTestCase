import React, { useState } from 'react';
import { Network, Plus, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { ScenarioModel, ApiDetails } from '../../types';

interface ApiSpecBuilderProps {
  currentScenario: ScenarioModel;
  onScenarioUpdated: (scenario: ScenarioModel) => void;
}

export const ApiSpecBuilder: React.FC<ApiSpecBuilderProps> = ({
  currentScenario,
  onScenarioUpdated,
}) => {
  const [method, setMethod] = useState<ApiDetails['method']>(currentScenario.apiDetails?.method || 'POST');
  const [endpoint, setEndpoint] = useState<string>(currentScenario.apiDetails?.endpoint || '/api/v1/resource');
  const [jsonBody, setJsonBody] = useState<string>(
    JSON.stringify(
      currentScenario.apiDetails?.requestBodySchema || {
        username: 'alex_smith',
        email: 'alex.smith@company.org',
        role: 'operator',
        tierLimit: 500,
      },
      null,
      2
    )
  );

  const handleApplyApiSpec = () => {
    let parsedBody: Record<string, any> = {};
    try {
      parsedBody = JSON.parse(jsonBody);
    } catch {
      parsedBody = {};
    }

    const fields = Object.entries(parsedBody).map(([k, v], i) => ({
      id: `api_f_${i}`,
      name: k,
      label: k.charAt(0).toUpperCase() + k.slice(1),
      type: (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'checkbox' : k.toLowerCase().includes('email') ? 'email' : 'text') as any,
      required: true,
      defaultValue: String(v),
      min: typeof v === 'number' ? 1 : 2,
      max: typeof v === 'number' ? 10000 : 100,
    }));

    const updated: ScenarioModel = {
      ...currentScenario,
      title: `API Service: ${method} ${endpoint}`,
      type: 'api_endpoint',
      fields,
      apiDetails: {
        method,
        endpoint,
        headers: [
          { key: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1Ni...' },
          { key: 'Content-Type', value: 'application/json' },
        ],
        queryParams: [],
        requestBodySchema: parsedBody,
        expectedStatusCodes: [200, 201, 400, 401, 403, 409, 422, 500],
      },
      rules: [
        {
          id: 'r_api_auth',
          condition: 'When Authorization Bearer token is missing or expired',
          effect: 'Return 401 Unauthorized with error code AUTH_REQUIRED',
        },
        {
          id: 'r_api_validation',
          condition: 'When payload fails schema validation',
          effect: 'Return 422 Unprocessable Entity with array of field errors',
        },
      ],
    };

    onScenarioUpdated(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Network className="w-4 h-4 text-sky-400" />
          REST API Endpoint Specification Mode
        </h3>
        <p className="text-xs text-slate-400">
          Define HTTP endpoint, payload contract, and expected response codes. 100% coverage engine derives schema, boundary, and auth error matrix.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-bold text-sky-400 font-mono sm:w-28"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="/api/v1/batches"
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
        />
        <button
          onClick={handleApplyApiSpec}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          Apply & Generate API Suite
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Request Body JSON Schema
        </label>
        <textarea
          value={jsonBody}
          onChange={(e) => setJsonBody(e.target.value)}
          rows={6}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-sky-500"
        />
      </div>
    </div>
  );
};
