'use client';

import React from 'react';
import { ShieldAlert, HelpCircle, Activity, Info, BarChart3 } from 'lucide-react';

interface PriorityInspectorProps {
  score: number;
  explanation: string | null;
  factorBreakdown: {
    severity: number;
    urgency: number;
    scaleEstimate: number;
    geographicSpread: number;
    evidenceStrength: number;
    persistenceScore: number;
    growthRate: number;
  };
}

const FACTOR_CONFIGS = [
  { key: 'severity', label: 'Civic Severity', weight: '25%', weightNum: 0.25, desc: 'Potential magnitude of civic harm/hazard' },
  { key: 'urgency', label: 'Urgency & Risk', weight: '20%', weightNum: 0.20, desc: 'Risk of rapid worsening if unaddressed' },
  { key: 'scaleEstimate', label: 'Population Scale', weight: '15%', weightNum: 0.15, desc: 'Estimated affected population footprint' },
  { key: 'geographicSpread', label: 'Geographic Spread', weight: '10%', weightNum: 0.10, desc: 'Ward, district, or state reach' },
  { key: 'evidenceStrength', label: 'Evidence Strength', weight: '15%', weightNum: 0.15, desc: 'Corroboration & quality of submitted material' },
  { key: 'persistenceScore', label: 'Persistence Duration', weight: '10%', weightNum: 0.10, desc: 'How long the operational failure has persisted' },
  { key: 'growthRate', label: 'Report Growth Rate', weight: '5%', weightNum: 0.05, desc: 'Velocity of incoming related citizen reports' },
] as const;

export default function PriorityInspector({ score, explanation, factorBreakdown }: PriorityInspectorProps) {
  let badgeClass = 'badge-candidate';
  let badgeText = 'Moderate';
  let scoreColor = '#d97706';

  if (score >= 80) {
    badgeClass = 'badge-critical';
    badgeText = 'Critical Priority';
    scoreColor = '#b91c1c';
  } else if (score >= 65) {
    badgeClass = 'badge-action';
    badgeText = 'High Priority';
    scoreColor = '#ea580c';
  } else if (score >= 50) {
    badgeClass = 'badge-verified';
    badgeText = 'Medium Priority';
    scoreColor = '#047857';
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deterministic Priority Score
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Explainable 7-factor mathematical evaluation (Section 12 specification)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`badge ${badgeClass}`}>{badgeText}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 800,
                color: scoreColor,
              }}
            >
              {score.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Narrative Explanation */}
      {explanation && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderLeft: `4px solid ${scoreColor}`,
            padding: '0.85rem 1.15rem',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            fontSize: '0.88rem',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
          }}
        >
          <strong>Why this priority: </strong>
          {explanation}
        </div>
      )}

      {/* 7-Factor Breakdown Progress Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FACTOR_CONFIGS.map((factor) => {
          const val = factorBreakdown[factor.key] || 5.0;
          const contribution = (val * factor.weightNum * 10).toFixed(1);
          const percentWidth = (val / 10) * 100;

          return (
            <div key={factor.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {factor.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    Weight: {factor.weight}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {val.toFixed(1)}/10
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (+{contribution} pts)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  background: 'var(--bg-surface)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentWidth}%`,
                    background: val >= 7.5 ? 'var(--accent-crimson)' : val >= 6.0 ? 'var(--accent-saffron)' : 'var(--accent-emerald)',
                    borderRadius: '4px',
                    transition: 'width 300ms ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {factor.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invariant Footer Note */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <Info size={14} />
        <span>
          <strong>Non-negotiable Invariant:</strong> Public support counts are tracked separately and do not inflate
          evidentiary strength or legal veracity.
        </span>
      </div>
    </div>
  );
}
