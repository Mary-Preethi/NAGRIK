'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  FileText,
  Layers,
  Shield,
  PlusCircle,
  Clock,
  ArrowRight,
  Edit3,
  Archive,
  AlertTriangle,
  FileCheck2,
  Upload,
  X,
  File,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'WATER_SANITATION', label: 'Water & Sanitation' },
  { value: 'HEALTHCARE', label: 'Healthcare & Hospitals' },
  { value: 'ROADS_INFRASTRUCTURE', label: 'Roads & Public Infrastructure' },
  { value: 'PUBLIC_TRANSPORT', label: 'Public Transport & Mobility' },
  { value: 'EDUCATION', label: 'Education & Schools' },
  { value: 'ENVIRONMENT', label: 'Environment & Pollution' },
  { value: 'CIVIC_SERVICES', label: 'Municipal & Civic Services' },
];

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const EDITABLE_STATUSES = ['SUBMITTED', 'DRAFT', 'PENDING_TRIAGE', 'PRELIMINARY_ANALYSIS', 'AGGREGATING'];

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Modal State
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('WATER_SANITATION');
  const [editDescription, setEditDescription] = useState('');
  const [editState, setEditState] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editLocationGeneral, setEditLocationGeneral] = useState('');
  const [editIncidentDate, setEditIncidentDate] = useState('');
  const [removeEvidenceIds, setRemoveEvidenceIds] = useState<string[]>([]);
  const [newEvidenceFile, setNewEvidenceFile] = useState<File | null>(null);
  const [newEvidenceDescription, setNewEvidenceDescription] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Withdraw Modal State
  const [withdrawingReport, setWithdrawingReport] = useState<any | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Request Action Modal State (Under Investigation / Verified)
  const [requestActionReport, setRequestActionReport] = useState<any | null>(null);
  const [requestType, setRequestType] = useState<'CORRECTION' | 'WITHDRAWAL'>('CORRECTION');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [meRes, reportsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/reports?mine=true'),
      ]);

      const meData = await meRes.json();
      if (!meData.user) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      const reportsData = await reportsRes.json();
      setUser(meData.user);
      setReports(reportsData.reports || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [router]);

  // Open Edit Modal
  const openEditModal = (report: any) => {
    setEditingReport(report);
    setEditTitle(report.title || '');
    setEditCategory(report.category || 'WATER_SANITATION');
    setEditDescription(report.description || '');
    setEditState(report.locationState || '');
    setEditDistrict(report.locationDistrict || '');
    setEditLocationGeneral(report.locationGeneral || '');
    setEditIncidentDate(report.incidentDate ? new Date(report.incidentDate).toISOString().split('T')[0] : '');
    setRemoveEvidenceIds([]);
    setNewEvidenceFile(null);
    setNewEvidenceDescription('');
    setFileError(null);
  };

  const closeEditModal = () => {
    setEditingReport(null);
    setFileError(null);
  };

  // Open Withdraw Modal
  const openWithdrawModal = (report: any) => {
    setWithdrawingReport(report);
    setWithdrawReason('');
  };

  const closeWithdrawModal = () => {
    setWithdrawingReport(null);
  };

  // Open Request Action Modal
  const openRequestActionModal = (report: any, type: 'CORRECTION' | 'WITHDRAWAL') => {
    setRequestActionReport(report);
    setRequestType(type);
    setRequestReason('');
  };

  const closeRequestActionModal = () => {
    setRequestActionReport(null);
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file format "${ext}". Allowed types: PDF, PNG, JPG, JPEG, DOC, DOCX.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 10MB limit (${formatBytes(file.size)} selected).`);
      return;
    }
    setNewEvidenceFile(file);
  };

  const toggleRemoveEvidence = (evidenceId: string) => {
    setRemoveEvidenceIds((prev) =>
      prev.includes(evidenceId) ? prev.filter((id) => id !== evidenceId) : [...prev, evidenceId]
    );
  };

  // Submit Edit Report & Evidence
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    if (!editTitle.trim() || !editDescription.trim() || !editDistrict.trim() || !editState.trim()) {
      setFileError('Please fill in all required fields (Title, Description, State, District).');
      return;
    }

    setIsSavingEdit(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('category', editCategory);
      formData.append('description', editDescription.trim());
      formData.append('locationState', editState.trim());
      formData.append('locationDistrict', editDistrict.trim());
      formData.append('locationGeneral', (editLocationGeneral || editDistrict).trim());
      if (editIncidentDate) {
        formData.append('incidentDate', editIncidentDate);
      }
      if (removeEvidenceIds.length > 0) {
        formData.append('removeEvidenceIds', JSON.stringify(removeEvidenceIds));
      }
      if (newEvidenceFile) {
        formData.append('evidenceFile', newEvidenceFile);
        if (newEvidenceDescription) {
          formData.append('evidenceDescription', newEvidenceDescription.trim());
        }
      }

      const res = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes.');
      }

      setNotification({
        type: 'success',
        message: `Report ${editingReport.trackingId} updated successfully. Auditable record saved.`,
      });
      closeEditModal();
      await fetchDashboard();
    } catch (err: any) {
      setFileError(err.message || 'An error occurred while updating the report.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit Report Withdrawal
  const handleConfirmWithdraw = async () => {
    if (!withdrawingReport) return;
    setIsProcessingWithdraw(true);

    try {
      const res = await fetch(`/api/reports/${withdrawingReport.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to withdraw report.');
      }

      setNotification({
        type: 'success',
        message: data.message || `Report ${withdrawingReport.trackingId} has been withdrawn.`,
      });
      closeWithdrawModal();
      await fetchDashboard();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to withdraw report.' });
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  // Submit Action Request (for reports under investigation)
  const handleConfirmRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestActionReport) return;
    if (!requestReason.trim()) {
      alert('Please provide a reason or explanation for your request.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await fetch(`/api/reports/${requestActionReport.id}/request-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          reason: requestReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setNotification({
        type: 'success',
        message: data.message || `Your ${requestType.toLowerCase()} request has been submitted for review.`,
      });
      closeRequestActionModal();
    } catch (err: any) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading citizen portal records...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Profile Section */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-medium)',
            }}
          >
            <User size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700 }}>
                {user.displayName}
              </h1>
              <span className="badge badge-candidate">Role: {user.role}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Verified Citizen Account: <strong>{user.email}</strong> · Member since{' '}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/report" className="btn btn-accent">
            <PlusCircle size={16} />
            <span>Submit New Report</span>
          </Link>
        </div>
      </div>

      {/* Reports Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700 }}>
              Your Submitted Reports ({reports.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Every submitted report is recorded under your permanent tracking ID. You can correct mistakes or withdraw reports while preserving full audit accountability.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Reports Submitted Yet
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              When you experience a civic breakdown in your district, reporting it helps NAGRIK discover broader systemic patterns.
            </p>
            <Link href="/report" className="btn btn-primary btn-sm">
              Submit Your First Report
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reports.map((report) => {
              const isEditable = EDITABLE_STATUSES.includes(report.status);
              const isWithdrawn = report.status === 'WITHDRAWN';
              const isUnderInvestigation = !isEditable && !isWithdrawn;

              return (
                <div
                  key={report.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isWithdrawn ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: 'var(--accent-terracotta)',
                          marginRight: '0.75rem',
                        }}
                      >
                        {report.trackingId}
                      </span>
                      <span className={`badge ${isWithdrawn ? 'badge-muted' : 'badge-verified'}`}>
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Submitted: {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {report.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {report.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span>📍 {report.locationDistrict}, {report.locationState}</span>
                    <span>📁 Category: {report.category.replace(/_/g, ' ')}</span>
                    <span>📎 {report.evidence?.length || 0} Evidence Files</span>
                    <span>👍 {report.supportsCount} Citizens Supported</span>
                  </div>

                  {/* Attached Evidence List */}
                  {report.evidence && report.evidence.length > 0 && (
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Attached Evidence:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {report.evidence.map((ev: any) => (
                          <div
                            key={ev.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <FileText size={13} color="var(--accent-terracotta)" />
                            <span>{ev.fileName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({formatBytes(ev.fileSize)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Systemic Cluster Status Link */}
                  {report.systemicIssue ? (
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} color="var(--accent-terracotta)" />
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Aggregated into Systemic Issue: {report.systemicIssue.title}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Status: {report.systemicIssue.status} · Priority: {report.systemicIssue.priorityScore.toFixed(1)}/100
                          </div>
                        </div>
                      </div>

                      <Link href={`/issue/${report.systemicIssue.id}`} className="btn btn-outline btn-sm">
                        <span>View Systemic Dossier</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    !isWithdrawn && (
                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 1rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <Clock size={14} />
                        <span>Currently preserved as an individual data point in district pattern analysis.</span>
                      </div>
                    )
                  )}

                  {/* Report Actions Toolbar */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    {isWithdrawn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <Archive size={14} />
                        <span>This report has been withdrawn from active civic tracking and is archived for audit integrity.</span>
                      </div>
                    ) : isEditable ? (
                      <>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Status: Direct correction & withdrawal available.
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(report)}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Edit3 size={14} />
                            <span>Edit Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openWithdrawModal(report)}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: '#b91c1c',
                              borderColor: '#fca5a5',
                            }}
                          >
                            <Archive size={14} />
                            <span>Withdraw</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertTriangle size={13} color="#ea580c" />
                          <span>Under active investigation. Direct edits locked to preserve evidence integrity.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button
                            type="button"
                            onClick={() => openRequestActionModal(report, 'CORRECTION')}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Edit3 size={14} />
                            <span>Request Correction</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openRequestActionModal(report, 'WITHDRAWAL')}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: '#b91c1c',
                              borderColor: '#fca5a5',
                            }}
                          >
                            <Archive size={14} />
                            <span>Request Withdrawal</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Shield size={20} color="var(--accent-emerald)" />
        <div>
          <strong>Privacy & Audit Accountability:</strong> Your contact details and private evidence are never exposed publicly. Report modifications and withdrawals are recorded in an append-only audit trail to prevent tampering and preserve institutional accountability.
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. EDIT REPORT & EVIDENCE MODAL                           */}
      {/* ========================================================= */}
      {editingReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Edit Report & Evidence
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                  Tracking ID: {editingReport.trackingId}
                </span>
              </div>
              <button
                onClick={closeEditModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '1.5rem' }}>
              {fileError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="Clear description of the issue"
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Civic Category *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="form-textarea"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="Describe the issue, frequency, and impact"
                />
              </div>

              {/* Location: State & District */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    State / UT *
                  </label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* General Location & Incident Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Specific Area / Landmark
                  </label>
                  <input
                    type="text"
                    value={editLocationGeneral}
                    onChange={(e) => setEditLocationGeneral(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. Ward 12, Main Market Road"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Incident / Observation Date
                  </label>
                  <input
                    type="date"
                    value={editIncidentDate}
                    onChange={(e) => setEditIncidentDate(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Evidence Management Section */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Evidence Correction & Attachment (Optional)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 10MB (PDF, PNG, JPG, DOC)</span>
                </div>

                {/* Existing Evidence List */}
                {editingReport.evidence && editingReport.evidence.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Currently Attached Evidence:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {editingReport.evidence.map((ev: any) => {
                        const isMarkedForRemoval = removeEvidenceIds.includes(ev.id);
                        return (
                          <div
                            key={ev.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isMarkedForRemoval ? '#fee2e2' : '#ffffff',
                              border: `1px solid ${isMarkedForRemoval ? '#fca5a5' : 'var(--border-subtle)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              transition: 'all 150ms ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              <FileText size={16} color={isMarkedForRemoval ? '#dc2626' : 'var(--accent-terracotta)'} />
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    textDecoration: isMarkedForRemoval ? 'line-through' : 'none',
                                    color: isMarkedForRemoval ? '#991b1b' : 'var(--text-primary)',
                                  }}
                                >
                                  {ev.fileName}
                                </span>
                                <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  ({formatBytes(ev.fileSize)})
                                </span>
                                {isMarkedForRemoval && (
                                  <span style={{ marginLeft: '0.5rem', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700 }}>
                                    (Marked for removal)
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleRemoveEvidence(ev.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: isMarkedForRemoval ? '#15803d' : '#dc2626',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              {isMarkedForRemoval ? (
                                <>
                                  <RotateCcw size={12} />
                                  <span>Undo</span>
                                </>
                              ) : (
                                <>
                                  <X size={14} />
                                  <span>Remove</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload New / Replacement Evidence */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Upload Replacement or Additional File:
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        validateAndSetFile(e.target.files[0]);
                      }
                    }}
                  />

                  {newEvidenceFile ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCheck2 size={16} color="#16a34a" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>
                          {newEvidenceFile.name} ({formatBytes(newEvidenceFile.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewEvidenceFile(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}
                    >
                      <Upload size={14} />
                      <span>Select New File from Device</span>
                    </button>
                  )}

                  {newEvidenceFile && (
                    <input
                      type="text"
                      placeholder="Evidence description or context (optional)"
                      value={newEvidenceDescription}
                      onChange={(e) => setNewEvidenceDescription(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', fontSize: '0.8rem' }}
                    />
                  )}
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={closeEditModal} className="btn btn-outline" disabled={isSavingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving Changes...' : 'Save & Record Audit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. WITHDRAW REPORT CONFIRMATION MODAL                     */}
      {/* ========================================================= */}
      {withdrawingReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWithdrawModal();
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Archive size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Withdraw this report?
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                    {withdrawingReport.trackingId} · {withdrawingReport.title}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                Your report will be removed from active civic tracking and public district exploration, but the original record will be retained securely for accountability and audit purposes.
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Reason for withdrawal (optional)
              </label>
              <textarea
                rows={3}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="form-textarea"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="e.g. Issue resolved locally, mistaken submission, etc."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="btn btn-outline"
                  disabled={isProcessingWithdraw}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWithdraw}
                  className="btn btn-accent"
                  style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                  disabled={isProcessingWithdraw}
                >
                  {isProcessingWithdraw ? 'Withdrawing...' : 'Withdraw Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. REQUEST CORRECTION / WITHDRAWAL MODAL (INVESTIGATION)  */}
      {/* ========================================================= */}
      {requestActionReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRequestActionModal();
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#ffedd5',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Request {requestType === 'WITHDRAWAL' ? 'Withdrawal' : 'Correction'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                    {requestActionReport.trackingId} · Active Investigation Record
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                Because this report is part of an active investigation or verified pattern, direct changes are locked to prevent silent tampering. Your formal request will be recorded in the audit log and evaluated by the investigation team.
              </p>
            </div>

            <form onSubmit={handleConfirmRequest} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Request Type
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reqType"
                      checked={requestType === 'CORRECTION'}
                      onChange={() => setRequestType('CORRECTION')}
                    />
                    <span>Request Report Correction</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reqType"
                      checked={requestType === 'WITHDRAWAL'}
                      onChange={() => setRequestType('WITHDRAWAL')}
                    />
                    <span>Request Report Withdrawal</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Explanation & Proposed Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="form-textarea"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder={
                    requestType === 'WITHDRAWAL'
                      ? 'Explain why this report should be withdrawn from the investigation...'
                      : 'Specify the incorrect information and provide the accurate facts or updated details...'
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={closeRequestActionModal}
                  className="btn btn-outline"
                  disabled={isSubmittingRequest}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? 'Submitting Request...' : 'Submit to Investigation Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
