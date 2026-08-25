import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#0b1120',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        paddingTop: '4rem',
        paddingBottom: '3rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="#f59e0b" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.08em',
                }}
              >
                NAGRIK
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#94a3b8' }}>
              A citizen issue intelligence and institutional accountability platform. Transforming individual voices into
              explainable patterns and measurable civic outcomes.
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#fcd34d',
                fontWeight: 600,
                marginTop: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              See. Speak. Act.
            </p>
          </div>

          {/* Pillars */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Core Principles
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={14} color="#059669" />
                <span>Every report permanently stored</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} color="#3b82f6" />
                <span>Zero private citizen identity leakage</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={14} color="#f59e0b" />
                <span>Deterministic explainable priority</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} color="#a855f7" />
                <span>Append-only immutable audit trail</span>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <li>
                <Link href="/explore" style={{ color: '#cbd5e1' }}>
                  Explore Public Issues
                </Link>
              </li>
              <li>
                <Link href="/report" style={{ color: '#cbd5e1' }}>
                  Submit Civic Report
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ color: '#cbd5e1' }}>
                  Citizen & Investigator Login
                </Link>
              </li>
              <li>
                <Link href="/register" style={{ color: '#cbd5e1' }}>
                  Join the Civic Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Non-Affiliation / Academic Statement */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Independent Civic Concept
            </h4>
            <p style={{ fontSize: '0.78rem', lineHeight: '1.6', color: '#64748b' }}>
              NAGRIK is an independent academic/product concept. It does not represent, nor is it affiliated with or endorsed by
              any single NGO, political party, or governmental body. AI is utilized solely as an investigative assistant with
              human-in-the-loop verification.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div>© {new Date().getFullYear()} NAGRIK Civic Intelligence Platform. All rights reserved.</div>
          <div>Built for institutional transparency, privacy protection & citizen empowerment.</div>
        </div>
      </div>
    </footer>
  );
}
