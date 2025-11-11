import React from 'react';

export default function IntegrationCard({ integration, onConnect, onTest }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/70 p-5 shadow-soft transition hover:border-primary/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{integration.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{integration.description}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            integration.connected ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-300'
          }`}
        >
          {integration.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onConnect(integration.id)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
        >
          {integration.connected ? 'Reconnect' : 'Connect'}
        </button>
        <button
          onClick={() => onTest(integration.id)}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-primary hover:text-primary"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}
