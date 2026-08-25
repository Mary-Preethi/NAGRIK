'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Layers, Users, ShieldAlert, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

export default function ExplorePage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'systemic' | 'individual'>('systemic');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [issuesRes, reportsRes] = await Promise.all([
          fetch('/api/systemic-issues'),
          fetch('/api/reports'),
        ]);
        const issuesData = await issuesRes.json();
        const reportsData = await reportsRes.json();
        setIssues(issuesData.issues || []);
        setReports(reportsData.reports || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === 'ALL' || issue.category === selectedCategory;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.trackingId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredReports = reports.filter((rep) => {
    const matchesCategory = selectedCategory === 'ALL' || rep.category === selectedCategory;
    const matchesSearch =
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.locationDistrict.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--accent-terracotta)',
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          Public Civic Archive
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Explore Civic Issues & Intelligence
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Browse verified systemic patterns and individual citizen reports across Indian districts.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by keyword, district, or tracking ID (e.g. SYS-2026-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="WATER_SANITATION">Water & Sanitation</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="ROADS_INFRASTRUCTURE">Roads & Infrastructure</option>
              <option value="PUBLIC_TRANSPORT">Public Transport</option>
              <option value="ENVIRONMENT">Environment</option>
              <option value="EDUCATION">Education</option>
              <option value="CIVIC_SERVICES">Civic Services</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('systemic')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: activeTab === 'systemic' ? 'var(--accent-terracotta)' : 'var(--text-muted)',
            borderBottom: activeTab === 'systemic' ? '2px solid var(--accent-terracotta)' : '2px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers size={18} />
          <span>Systemic Issues ({filteredIssues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: activeTab === 'individual' ? 'var(--accent-terracotta)' : 'var(--text-muted)',
            borderBottom: activeTab === 'individual' ? '2px solid var(--accent-terracotta)' : '2px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FileText size={18} />
          <span>Individual Reports ({filteredReports.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading civic archive records...
        </div>
      ) : activeTab === 'systemic' ? (
        <div className="grid-cols-auto-fit">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="editorial-card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
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
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: issue.priorityScore >= 80 ? 'var(--accent-crimson)' : 'var(--accent-terracotta)',
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
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    lineHeight: '1.4',
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {issue.title}
                </h3>

                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {issue.summary.length > 150 ? `${issue.summary.substring(0, 150)}...` : issue.summary}
                </p>
              </div>

              <div>
                <div
                  style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={14} />
                    <span>{issue.linkedReportCount} Linked Reports</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} />
                    <span>{issue.totalSupportCount} Supporters</span>
                  </div>
                </div>

                <Link href={`/issue/${issue.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <span>Inspect Systemic Dossier</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Individual Reports Tab */
        <div className="grid-cols-auto-fit">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="editorial-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-candidate">{rep.status.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tracking ID: {rep.trackingId} · Category: {rep.category.replace(/_/g, ' ')}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {rep.title}
                </h3>

                <p style={{ fontSize: '0.82rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {rep.description.length > 140 ? `${rep.description.substring(0, 140)}...` : rep.description}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  📍 Location: <strong>{rep.locationDistrict}, {rep.locationState}</strong>
                </div>
              </div>

              <div
                style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{rep.supportCount} Citizens Supported</span>
                <span>{rep.hasEvidence ? '📎 Optional Evidence Attached' : 'No documentary file'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
