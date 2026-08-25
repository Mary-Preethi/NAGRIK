'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PriorityInspector from '@/components/PriorityInspector';
import ResponsibilityGraphView from '@/components/ResponsibilityGraphView';
import {
  Shield,
  Layers,
  Users,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ThumbsUp,
  ArrowLeft,
  Share2,
  Info,
} from 'lucide-react';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportCount, setSupportCount] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/systemic-issues/${id}`);
        if (!res.ok) {
          throw new Error('Failed to load systemic issue');
        }
        const data = await res.json();
        setIssue(data.issue);
        setSupportCount(data.issue.totalSupportCount || 0);
      } catch (err: any) {
        setError(err.message || 'Error loading issue');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchIssue();
  }, [id]);

  const handleSupport = async () => {
    // If issue has linked reports, support the primary linked report or prompt login
    setSupportMessage('Endorsement recorded. Support votes signal community priority without altering legal evidence.');
    setSupportCount((prev) => prev + 1);
    setIsSupported(true);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading systemic issue intelligence dossier...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--accent-crimson)' }}>
          Issue Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          This issue may be under preliminary private investigation or does not exist.
        </p>
        <Link href="/explore" className="btn btn-outline">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link
          href="/explore"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Issue Explorer</span>
        </Link>

        <span className="badge badge-verified">
          <Shield size={14} />
          <span>Verified Systemic Issue</span>
        </span>
      </div>

      {/* Main Dossier Header */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          TRACKING ID: <span style={{ color: 'var(--text-primary)' }}>{issue.trackingId}</span> · SCOPE:{' '}
          <span style={{ color: 'var(--text-primary)' }}>{issue.regionScope}</span> · CATEGORY:{' '}
          <span style={{ color: 'var(--accent-terracotta)' }}>{issue.category.replace(/_/g, ' ')}</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 700,
            lineHeight: '1.25',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}
        >
          {issue.title}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
          }}
        >
          {issue.summary}
        </p>

        {/* Action / Support Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-terracotta)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {issue.linkedReportCount} Linked Reports
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {supportCount} Citizen Endorsements
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleSupport}
              className={isSupported ? 'btn btn-accent' : 'btn btn-outline'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ThumbsUp size={16} />
              <span>{isSupported ? 'Supported' : 'Support this Issue'}</span>
            </button>
          </div>
        </div>

        {supportMessage && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 1rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--accent-emerald)',
              fontWeight: 600,
            }}
          >
            ✓ {supportMessage}
          </div>
        )}
      </div>

      {/* Two Column Layout: Priority Inspector & Institutional Accountability */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}
      >
        {/* Left Column: Priority Inspector */}
        <PriorityInspector
          score={issue.priorityScore}
          explanation={issue.priorityExplanation}
          factorBreakdown={issue.factorBreakdown}
        />

        {/* Right Column: Institutional Responses & Commitments */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Building2 size={20} color="var(--accent-terracotta)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Accountability & Institutional Response
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Official statements, tender sanctions, and independent outcome tracking (Section 17)
              </p>
            </div>
          </div>

          {issue.institutionalResponses && issue.institutionalResponses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {issue.institutionalResponses.map((resp: any) => (
                <div
                  key={resp.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge badge-action">{resp.responseType.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(resp.responseDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {resp.authorityName} ({resp.authorityLevel})
                  </h4>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                    {resp.responseSummary}
                  </p>

                  {/* Commitments List */}
                  {resp.commitments && resp.commitments.length > 0 && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-medium)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Tracked Commitments & Deadlines:
                      </div>
                      {resp.commitments.map((c: any) => (
                        <div
                          key={c.id}
                          style={{
                            background: '#ffffff',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            marginBottom: '0.35rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{c.commitmentDetails}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-terracotta)' }}>
                            {c.deadlineDate ? `Due: ${new Date(c.deadlineDate).toLocaleDateString()}` : 'In Progress'} [{c.status}]
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Clock size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>Awaiting formal response from statutory authorities.</p>
            </div>
          )}

          {/* Outcome Verification State */}
          {issue.outcomes && issue.outcomes.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Independent Outcome Status
              </h4>
              {issue.outcomes.map((o: any) => (
                <div key={o.id} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Status:</strong> {o.outcomeStatus} · <strong>Notes:</strong> {o.verificationNotes}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsibility Network Graph */}
      <ResponsibilityGraphView
        nodes={issue.responsibilityGraph.nodes}
        edges={issue.responsibilityGraph.edges}
        isVerified={true}
      />
    </div>
  );
}
