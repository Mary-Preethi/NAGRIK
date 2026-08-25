'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PriorityInspector from '@/components/PriorityInspector';
import ResponsibilityGraphView from '@/components/ResponsibilityGraphView';
import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Layers,
  Building2,
  ShieldAlert,
  Sliders,
  Send,
  RefreshCw,
  PlusCircle,
  Eye,
  Info,
} from 'lucide-react';

export default function InvestigatorPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Verification Form State
  const [verificationAction, setVerificationAction] = useState('VERIFY');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Priority Factor Adjustment State
  const [factors, setFactors] = useState({
    severity: 5.0,
    urgency: 5.0,
    scaleEstimate: 5.0,
    geographicSpread: 5.0,
    evidenceStrength: 5.0,
    persistenceScore: 5.0,
    growthRate: 5.0,
  });

  // Institutional Response State
  const [authorityName, setAuthorityName] = useState('');
  const [authorityLevel, setAuthorityLevel] = useState('District');
  const [responseSummary, setResponseSummary] = useState('');
  const [commitmentDetails, setCommitmentDetails] = useState('');

  const fetchWorkbench = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || (meData.user.role !== 'INVESTIGATOR' && meData.user.role !== 'ADMIN')) {
        router.push('/login?redirect=/investigator');
        return;
      }
      setCurrentUser(meData.user);

      const res = await fetch('/api/systemic-issues?all=true');
      const data = await res.json();
      setCandidates(data.issues || []);
      if (data.issues && data.issues.length > 0) {
        loadIssueDetail(data.issues[0].id);
      }
    } catch (err) {
      console.error('Investigator workbench error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadIssueDetail = async (issueId: string) => {
    try {
      const res = await fetch(`/api/systemic-issues/${issueId}`);
      const data = await res.json();
      setSelectedIssue(data.issue);
      if (data.issue?.factorBreakdown) {
        setFactors(data.issue.factorBreakdown);
      }
      setActionSuccess(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkbench();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      const res = await fetch('/api/investigator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemicIssueId: selectedIssue.id,
          action: verificationAction,
          notes: verificationNotes || `Verified by investigator ${currentUser?.displayName}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Verification action successfully recorded: ${verificationAction}. Audit entry logged.`);
        setVerificationNotes('');
        fetchWorkbench();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFactorUpdate = async () => {
    if (!selectedIssue) return;
    try {
      const res = await fetch('/api/investigator/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemicIssueId: selectedIssue.id,
          factors,
          reason: 'Investigator factor adjustment following evidence verification.',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Priority deterministically recalculated to ${data.priorityResult.score.toFixed(1)}/100.`);
        loadIssueDetail(selectedIssue.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !authorityName || !responseSummary) return;

    try {
      const commitments = commitmentDetails
        ? [
            {
              commitmentDetails,
              deadlineDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
              status: 'IN_PROGRESS',
            },
          ]
        : [];

      const res = await fetch('/api/investigator/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemicIssueId: selectedIssue.id,
          authorityName,
          authorityLevel,
          responseSummary,
          responseType: 'OFFICIAL_STATEMENT',
          commitments,
          outcomeUpdate: {
            status: 'IN_ACTION',
            notes: 'Institutional response officially logged.',
          },
        }),
      });

      if (res.ok) {
        setActionSuccess('Institutional response & accountability commitments recorded.');
        setAuthorityName('');
        setResponseSummary('');
        setCommitmentDetails('');
        loadIssueDetail(selectedIssue.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishGraph = async () => {
    if (!selectedIssue || !selectedIssue.rawNodes) return;
    try {
      const res = await fetch('/api/investigator/responsibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemicIssueId: selectedIssue.id,
          nodes: selectedIssue.rawNodes.map((n: any) => ({ ...n, isVerified: true })),
          edges: (selectedIssue.rawEdges || []).map((e: any) => ({ ...e, isVerified: true })),
        }),
      });
      if (res.ok) {
        setActionSuccess('Responsibility graph verified and approved for public publication.');
        loadIssueDetail(selectedIssue.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading investigator workbench & priority queue...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Workbench Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0b1120 0%, #1e293b 100%)',
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
            <FileSearch size={22} color="#f59e0b" />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700 }}>
              Investigator Verification Workbench
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Authorised verification console. Inspect corroborating reports, adjust explainable factor weights, verify
            statutory responsibility maps, and log institutional commitments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-verified">Logged as {currentUser?.displayName}</span>
          <button onClick={fetchWorkbench} className="btn btn-outline btn-sm" style={{ background: '#fff', color: '#0f172a' }}>
            <RefreshCw size={14} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            background: 'var(--accent-emerald-light)',
            color: 'var(--accent-emerald)',
            border: '1px solid rgba(4, 120, 87, 0.2)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          ✓ {actionSuccess}
        </div>
      )}

      {/* Main Two-Column Workbench */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '2rem',
        }}
      >
        {/* Left Column: Priority Candidate Queue */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Candidate Priority Queue ({candidates.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {candidates.map((cand) => {
              const isSelected = selectedIssue?.id === cand.id;
              return (
                <div
                  key={cand.id}
                  onClick={() => loadIssueDetail(cand.id)}
                  style={{
                    background: isSelected ? 'var(--bg-main)' : '#ffffff',
                    border: isSelected ? '2px solid var(--accent-terracotta)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="badge badge-candidate" style={{ fontSize: '0.68rem' }}>
                      {cand.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                      {cand.priorityScore.toFixed(1)}/100
                    </span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {cand.trackingId} · {cand.category.replace(/_/g, ' ')}
                  </div>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.3' }}>
                    {cand.title}
                  </h4>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Reports Linked: {cand.linkedReportCount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Issue Workbench */}
        {selectedIssue ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header & Verification Action Panel */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-terracotta)' }}>
                    {selectedIssue.trackingId} · Scope: {selectedIssue.regionScope} · Category: {selectedIssue.category}
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, marginTop: '0.25rem' }}>
                    {selectedIssue.title}
                  </h2>
                </div>
                <span className="badge badge-verified">Current Status: {selectedIssue.status}</span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {selectedIssue.summary}
              </p>

              {/* Action Form */}
              <form onSubmit={handleVerifySubmit} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Execute Verification Action (Audited)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    value={verificationAction}
                    onChange={(e) => setVerificationAction(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="VERIFY">VERIFY (Publish to Public)</option>
                    <option value="REQUEST_MORE_EVIDENCE">REQUEST MORE EVIDENCE</option>
                    <option value="MARK_INSUFFICIENT">MARK INSUFFICIENT</option>
                    <option value="ESCALATE">ESCALATE (To Action)</option>
                    <option value="REJECT">REJECT</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Verification notes / audit rationale..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />

                  <button type="submit" className="btn btn-accent btn-sm">
                    Execute Action
                  </button>
                </div>
              </form>
            </div>

            {/* Linked Reports Review */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Layers size={20} color="var(--accent-terracotta)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Aggregated Citizen Reports ({selectedIssue.linkedReports?.length || selectedIssue.linkedReportCount})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(selectedIssue.linkedReports || []).map((rep: any) => (
                  <div
                    key={rep.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {rep.trackingId}: {rep.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📍 {rep.locationDistrict}, {rep.locationState}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong>Rationale:</strong> {rep.rationale || 'District-level semantic cluster'} ·{' '}
                      <strong>Evidence:</strong> {rep.hasEvidence ? 'Attached' : 'Lived Experience Only'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Factor Tuning */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={20} color="var(--accent-terracotta)" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Tune Priority Factors (Deterministic Recalculation)
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Adjust factors based on verified evidence; recomputes score deterministically with audit logging.
                    </p>
                  </div>
                </div>
                <button onClick={handleFactorUpdate} className="btn btn-primary btn-sm">
                  Save & Recalculate Score
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {Object.entries(factors).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{(val as number).toFixed(1)} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.5"
                      value={val as number}
                      onChange={(e) => setFactors({ ...factors, [key]: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Responsibility Graph Review & Verification */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="var(--accent-terracotta)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Responsibility Graph Verification
                  </h3>
                </div>
                <button onClick={handlePublishGraph} className="btn btn-accent btn-sm">
                  <CheckCircle2 size={14} />
                  <span>Verify & Publish Graph to Public</span>
                </button>
              </div>

              <ResponsibilityGraphView
                nodes={selectedIssue.rawNodes || selectedIssue.responsibilityGraph?.nodes || []}
                edges={selectedIssue.rawEdges || selectedIssue.responsibilityGraph?.edges || []}
                isVerified={selectedIssue.isPublic}
              />
            </div>

            {/* Institutional Response Logger */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Building2 size={20} color="var(--accent-terracotta)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Log Official Institutional Response & Commitments
                </h3>
              </div>

              <form onSubmit={handleRecordResponse}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Authority / Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Municipal Water Supply Division"
                      value={authorityName}
                      onChange={(e) => setAuthorityName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Authority Level
                    </label>
                    <select
                      value={authorityLevel}
                      onChange={(e) => setAuthorityLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="Ward / Local">Ward / Local</option>
                      <option value="District">District</option>
                      <option value="State">State</option>
                      <option value="National">National</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Response Summary *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Summary of official statement, investigation ordered, or tender sanctioned..."
                    value={responseSummary}
                    onChange={(e) => setResponseSummary(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Action Commitment & Remedy Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1.2 Cr filtration overhaul sanctioned; target completion Nov 2026."
                    value={commitmentDetails}
                    onChange={(e) => setCommitmentDetails(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <button type="submit" className="btn btn-accent btn-sm">
                  Record Institutional Response & Commitments
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an issue candidate from the queue to start investigation.
          </div>
        )}
      </div>
    </div>
  );
}
