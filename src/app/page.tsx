import React from 'react';
import Link from 'next/link';
import StorytellingQuoteReel from '@/components/StorytellingQuoteReel';
import ScrollRevealObserver from '@/components/ScrollRevealObserver';
import {
  Shield,
  ArrowRight,
  TrendingUp,
  Layers,
  Search,
  Eye,
  MessageSquare,
  Users,
  BarChart2,
  Scale,
  ClipboardList,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { db } from '@/lib/db';
import { serializePublicSystemicIssue } from '@/lib/dto';

export const revalidate = 0; // Dynamic server-side rendering

async function getHomepageData() {
  try {
    const [totalReports, totalSystemicIssues, verifiedCount, totalSupports, totalCitizens] = await Promise.all([
      db.report.count(),
      db.systemicIssue.count(),
      db.systemicIssue.count({ where: { status: { in: ['VERIFIED', 'IN_ACTION', 'RESOLVED', 'PARTIALLY_RESOLVED'] } } }),
      db.reportSupport.count(),
      db.user.count({ where: { role: 'CITIZEN', isActive: true } }),
    ]);

    const featuredIssues = await db.systemicIssue.findMany({
      where: { isPublic: true },
      include: {
        reportLinks: {
          include: {
            report: {
              include: { supports: true },
            },
          },
        },
        responsibilityNodes: true,
        responsibilityEdges: true,
        institutionalResponses: {
          include: { commitments: true },
        },
        outcomeUpdates: true,
      },
      orderBy: { priorityScore: 'desc' },
      take: 3,
    });

    const serializedFeatured = featuredIssues.map((issue) => {
      const supporterUserIds = new Set<string>();
      issue.reportLinks.forEach((link) => {
        link.report.supports.forEach((s) => supporterUserIds.add(s.userId));
      });
      return serializePublicSystemicIssue(issue, supporterUserIds.size);
    });

    return {
      stats: {
        totalReports,
        totalSystemicIssues,
        verifiedCount,
        totalSupports,
        totalCitizens,
      },
      featuredIssues: serializedFeatured,
    };
  } catch (error) {
    console.error('Homepage data error:', error);
    return {
      stats: { totalReports: 0, totalSystemicIssues: 0, verifiedCount: 0, totalSupports: 0, totalCitizens: 0 },
      featuredIssues: [],
    };
  }
}

export default async function HomePage() {
  const { stats, featuredIssues } = await getHomepageData();

  return (
    <div style={{ background: 'var(--bg-main)', color: '#0f172a', minHeight: '100vh' }}>
      <ScrollRevealObserver />

      {/* 1. HERO SECTION: CLEAN CANVAS WITH COMPACT QUOTE CARD */}
      <section
        className="reveal-on-scroll"
        style={{
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
          position: 'relative',
        }}
      >
        <div className="container">
          <StorytellingQuoteReel />
        </div>
      </section>

      {/* 2. EDITORIAL NARRATIVE SUBTITLE: INDIA'S PROBLEMS ARE MANY. OUR VOICES ARE ONE. */}
      <section
        className="reveal-on-scroll reveal-delay-1"
        style={{ paddingTop: '1.5rem', paddingBottom: '2.5rem' }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 480px) 1fr',
              gap: '3rem',
              alignItems: 'center',
              maxWidth: '1040px',
              margin: '0 auto',
            }}
          >
            {/* Left: Heading with Orange Underline Accent */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2.1rem, 3.8vw, 2.85rem)',
                  fontWeight: 800,
                  lineHeight: '1.16',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                India’s problems are many.
                <br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  Our voices are one.
                  <span
                    style={{
                      position: 'absolute',
                      left: '0',
                      bottom: '-6px',
                      width: '100%',
                      height: '3.5px',
                      background: '#ea580c',
                      borderRadius: '2px',
                    }}
                  />
                </span>
              </h2>
            </div>

            {/* Right: Explanatory Narrative */}
            <div>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: '#475569',
                  fontWeight: 400,
                }}
              >
                From everyday issues to systemic failures, NAGRIK collects, understands, prioritizes, and pushes for
                accountable action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 6-STEP PROCESS BAR (SEE, SPEAK, UNDERSTAND, PRIORITIZE, ACT, TRACK) */}
      <section
        className="reveal-on-scroll reveal-delay-2"
        style={{
          paddingTop: '1.5rem',
          paddingBottom: '3.5rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.5rem',
              maxWidth: '1180px',
              margin: '0 auto',
              alignItems: 'flex-start',
            }}
          >
            {/* 01: SEE */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#ffedd5',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Eye size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  SEE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Be aware of issues that matter
                </div>
              </div>
            </div>

            {/* 02: SPEAK */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  SPEAK
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Report what you experience
                </div>
              </div>
            </div>

            {/* 03: UNDERSTAND */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  UNDERSTAND
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Discover patterns & systemic problems
                </div>
              </div>
            </div>

            {/* 04: PRIORITIZE */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BarChart2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  PRIORITIZE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Focus on what needs attention most
                </div>
              </div>
            </div>

            {/* 05: ACT */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Scale size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  ACT
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Push for responsible institutions
                </div>
              </div>
            </div>

            {/* 06: TRACK */}
            <div className="process-step-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="process-step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ClipboardList size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                  TRACK
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.35', marginTop: '0.1rem' }}>
                  Follow action & measure outcomes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HIGH-PRIORITY VERIFIED SYSTEMIC ISSUES */}
      <section className="section-padding reveal-on-scroll">
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ea580c',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Verified Intelligence
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Active Systemic Issues
              </h2>
            </div>

            <Link href="/explore" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>View All Public Issues</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-cols-auto-fit">
            {featuredIssues.map((issue, idx) => (
              <div
                key={issue.id}
                className={`editorial-card reveal-on-scroll reveal-delay-${(idx % 3) + 1}`}
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-verified">{issue.status.replace(/_/g, ' ')}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Priority:</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: issue.priorityScore >= 80 ? '#b91c1c' : '#ea580c',
                        }}
                      >
                        {issue.priorityScore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    ID: {issue.trackingId} · Category: {issue.category.replace(/_/g, ' ')}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      lineHeight: '1.35',
                      color: '#0f172a',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {issue.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: '1.6',
                      color: '#475569',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {issue.summary.length > 140 ? `${issue.summary.substring(0, 140)}...` : issue.summary}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      paddingTop: '1rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: '#64748b',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Layers size={15} />
                      <span>{issue.linkedReportCount} Linked Reports</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{issue.totalSupportCount} Supporters</span>
                    </div>
                  </div>

                  <Link
                    href={`/issue/${issue.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <span>Inspect Dossier & Institutional Map</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CIVIC STATISTICS BAR */}
      <section
        className="reveal-on-scroll"
        style={{
          background: '#0b1120',
          color: '#ffffff',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            <div className="stat-metric-card">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fcd34d',
                  marginBottom: '0.2rem',
                }}
              >
                50,000+
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Citizens joined the NAGRIK Network
              </div>
            </div>

            <div className="stat-metric-card">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fcd34d',
                  marginBottom: '0.2rem',
                }}
              >
                {stats.totalReports}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Citizen Reports Preserved
              </div>
            </div>

            <div className="stat-metric-card">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fcd34d',
                  marginBottom: '0.2rem',
                }}
              >
                {stats.totalSystemicIssues}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Systemic Patterns Uncovered
              </div>
            </div>

            <div className="stat-metric-card">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fcd34d',
                  marginBottom: '0.2rem',
                }}
              >
                {stats.verifiedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Verified Institutional Cases
              </div>
            </div>

            <div className="stat-metric-card">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fcd34d',
                  marginBottom: '0.2rem',
                }}
              >
                {stats.totalSupports}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Citizen Endorsement Signals
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
