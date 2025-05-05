
// useMCPAgents.ts
import { useState, useEffect } from 'react';

export function useMCPAgent(agentId: string, payload: any) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const runAgent = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`/api/mcp/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, input: payload })
      });

      const data = await response.json();
      setResult(data);
      setStatus('success');
    } catch (err) {
      console.error('Agent run failed:', err);
      setError(err);
      setStatus('error');
    }
  };

  return { runAgent, status, result, error };
}
