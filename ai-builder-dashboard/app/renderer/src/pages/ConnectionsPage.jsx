import React, { useEffect, useState } from 'react';
import IntegrationCard from '../components/IntegrationCard.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function ConnectionsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refresh = async () => {
    try {
      const list = await window.api.listIntegrations();
      setIntegrations(list);
    } catch (error) {
      toast.showToast({ title: 'Failed to load integrations', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleConnect = async (integrationId) => {
    const result = await window.api.connectIntegration(integrationId);
    if (result?.success) {
      toast.showToast({ title: 'Integration connected', description: result.message, type: 'success' });
    } else {
      toast.showToast({ title: 'Connection failed', description: result?.message, type: 'error' });
    }
    refresh();
  };

  const handleTest = async (integrationId) => {
    const result = await window.api.testIntegration(integrationId);
    if (result?.success) {
      toast.showToast({ title: 'Test successful', description: result.message, type: 'success' });
    } else {
      toast.showToast({ title: 'Test failed', description: result?.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Pipedream Connections</h2>
        <p className="mt-1 text-sm text-slate-400">
          Securely authenticate services via OAuth. Credentials are stored in your macOS Keychain.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={handleConnect}
            onTest={handleTest}
          />
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-surface/50 p-5 text-sm text-slate-400">
        <h3 className="text-sm font-semibold text-white">OAuth Setup</h3>
        <p className="mt-2">
          Provide <span className="text-white">PIPEDREAM_CLIENT_ID</span> and <span className="text-white">PIPEDREAM_CLIENT_SECRET</span>{' '}
          environment variables before running the desktop app to enable automatic OAuth token exchange.
        </p>
      </div>
    </div>
  );
}
