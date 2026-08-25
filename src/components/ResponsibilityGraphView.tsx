'use client';

import React, { useState } from 'react';
import { Network, ShieldCheck, AlertCircle, Building2, CheckCircle2, Info } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  level: 'OPERATIONAL' | 'SUPERVISORY' | 'REGULATORY_POLICY' | 'POLITICAL_MINISTERIAL' | 'CORRECTIVE';
  jurisdiction: string;
  description: string | null;
}

interface Edge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  rationale: string;
  evidenceSource: string | null;
}

interface ResponsibilityGraphViewProps {
  nodes: Node[];
  edges: Edge[];
  isVerified?: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  OPERATIONAL: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', label: 'Operational Unit' },
  SUPERVISORY: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'Supervisory Authority' },
  REGULATORY_POLICY: { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd', label: 'Regulatory & Standards' },
  POLITICAL_MINISTERIAL: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'Ministerial / Executive' },
  CORRECTIVE: { bg: '#d1fae5', text: '#047857', border: '#6ee7b7', label: 'Corrective & Overhaul' },
};

export default function ResponsibilityGraphView({ nodes, edges, isVerified = true }: ResponsibilityGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(nodes[0] || null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  if (nodes.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-medium)',
        }}
      >
        <Building2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Statutory Responsibility Map In Progress
        </h4>
        <p style={{ fontSize: '0.85rem', maxWidth: '460px', margin: '0.5rem auto 0' }}>
          This systemic issue is under preliminary analysis. The institutional responsibility graph will be published
          following investigator verification.
        </p>
      </div>
    );
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
              background: '#ede9fe',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Network size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Institutional Responsibility Map
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Statutory offices and administrative oversight hierarchy (Section 15 specification)
            </p>
          </div>
        </div>

        <div>
          {isVerified ? (
            <span className="badge badge-verified">
              <ShieldCheck size={14} />
              <span>Verified Institutional Map</span>
            </span>
          ) : (
            <span className="badge badge-candidate">
              <AlertCircle size={14} />
              <span>Preliminary Draft</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          padding: '0.75rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {Object.entries(LEVEL_COLORS).map(([key, config]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: config.bg,
              color: config.text,
              border: `1px solid ${config.border}`,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: config.text,
              }}
            />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Grid of Institutional Nodes & Relationships */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {nodes.map((node) => {
          const config = LEVEL_COLORS[node.level] || LEVEL_COLORS.OPERATIONAL;
          const isSelected = selectedNode?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => {
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? '#ffffff' : 'var(--bg-main)',
                border: isSelected ? `2px solid ${config.text}` : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: config.bg,
                    color: config.text,
                    border: `1px solid ${config.border}`,
                    textTransform: 'uppercase',
                  }}
                >
                  {config.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {node.jurisdiction}
                </span>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {node.name}
              </h4>

              {node.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {node.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Node / Edge Detail Panel */}
      {selectedNode && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Building2 size={18} color="var(--accent-terracotta)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Statutory Role & Oversight Connections
            </h4>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            {selectedNode.description || 'Statutory authority identified for this public utility area.'}
          </p>

          {/* Connected Edges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {edges
              .filter((e) => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
              .map((edge) => {
                const isOutgoing = edge.sourceNodeId === selectedNode.id;
                const otherNode = nodes.find((n) => n.id === (isOutgoing ? edge.targetNodeId : edge.sourceNodeId));

                return (
                  <div
                    key={edge.id}
                    style={{
                      background: '#ffffff',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>{isOutgoing ? 'Acts Upon / Supervises:' : 'Supervised / Regulated By:'}</span>
                      <span style={{ color: 'var(--accent-terracotta)' }}>{otherNode?.name || 'Institution'}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.35rem',
                          background: 'var(--bg-surface)',
                          borderRadius: '3px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        [{edge.relationshipType}]
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {edge.rationale}
                    </div>
                    {edge.evidenceSource && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                        Source: {edge.evidenceSource}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Non-defamation Invariant Warning */}
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
          <strong>Ethical Invariant (Section 15.1):</strong> NAGRIK models statutory institutions and offices, never
          personal causation or individual public-figure portraits.
        </span>
      </div>
    </div>
  );
}
