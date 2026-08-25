'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LogOut, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header
      style={{
        background: '#FAF9F6',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.75rem',
        }}
      >
        {/* Left: Brand Logo & Tagline */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#0b1120',
              border: '1.5px solid #d97706',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <Shield size={22} color="#f59e0b" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                }}
              >
                NAGRIK
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  letterSpacing: '0.04em',
                }}
              >
                CIVIC INTELLIGENCE
              </span>
            </div>
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#ea580c',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginTop: '-0.1rem',
              }}
            >
              See. Speak. Act.
            </p>
          </div>
        </Link>

        {/* Right: Navigation Links & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <Link
              href="/explore"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: pathname === '/explore' ? '#ea580c' : '#334155',
                transition: 'color var(--transition-fast)',
              }}
            >
              Explore Issues
            </Link>

            <Link
              href={currentUser ? '/report' : '/login?redirect=/report'}
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: pathname === '/report' ? '#ea580c' : '#334155',
                transition: 'color var(--transition-fast)',
              }}
            >
              Report an Issue
            </Link>

            {currentUser && (
              <Link
                href="/dashboard"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: pathname === '/dashboard' ? '#ea580c' : '#334155',
                }}
              >
                Citizen Dashboard
              </Link>
            )}

            {currentUser && (currentUser.role === 'INVESTIGATOR' || currentUser.role === 'ADMIN') && (
              <Link
                href="/investigator"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: pathname.startsWith('/investigator') ? '#ea580c' : '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Investigator Desk</span>
              </Link>
            )}

            {currentUser && currentUser.role === 'ADMIN' && (
              <Link
                href="/admin"
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: pathname.startsWith('/admin') ? '#ea580c' : '#6366f1',
                }}
              >
                Admin & Audit
              </Link>
            )}
          </nav>

          {/* User Account Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {currentUser.displayName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Role: <span style={{ fontWeight: 600 }}>{currentUser.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  title="Logout"
                  style={{ borderRadius: '8px', padding: '0.4rem 0.85rem' }}
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  href="/login"
                  className="btn btn-outline"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    background: '#FCFBF8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: '#0b1120',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                  }}
                >
                  Join NAGRIK
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
