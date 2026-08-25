'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, CheckCircle2, History, Filter, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [user, setUser] = useState<any>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'ADMIN') {
        router.push('/login?redirect=/admin');
        return;
      }
      setUser(meData.user);

      const url = selectedEntity === 'ALL' ? '/api/admin/audit-logs' : `/api/admin/audit-logs?entity=${selectedEntity}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedEntity]);

  if (loading && !user) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying administrative security credentials...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Admin Header */}
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <History size={22} color="#f59e0b" />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700 }}>
              Immutable Append-Only Audit Trail
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Cryptographic and timestamped audit records. Invariant: History is strictly append-only; records cannot be
            mutated or deleted by any user or administrator.
          </p>
        </div>

        <button onClick={fetchAuditLogs} className="btn btn-outline btn-sm" style={{ background: '#fff', color: '#0f172a' }}>
          <RefreshCw size={14} />
          <span>Refresh Audit Records</span>
        </button>
      </div>

      {/* Filter & Filter Controls */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Filter by Target Entity:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Audit Entities</option>
            <option value="Report">Reports (Submit / Link)</option>
            <option value="SystemicIssue">Systemic Issues (Verify / Priority)</option>
            <option value="User">User Authentication</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Total Audit Records: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-medium)' }}>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Timestamp</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Action Type</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Actor & Role</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Target Entity</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Metadata Snapshot</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.45rem',
                      borderRadius: '4px',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {log.actionType}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 600 }}>{log.actorRole}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {log.actorId.substring(0, 12)}...</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 600 }}>{log.targetEntity}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {log.targetId.substring(0, 12)}...</div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                  <pre
                    style={{
                      fontSize: '0.72rem',
                      background: 'var(--bg-surface)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      maxWidth: '400px',
                      overflowX: 'auto',
                    }}
                  >
                    {log.diffJson ? log.diffJson : 'No state mutation payload'}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
