'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Shield,
  FileText,
  Image as ImageIcon,
  X,
  File,
  ArrowRight,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function ReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('WATER_SANITATION');
  const [description, setDescription] = useState('');
  const [locationState, setLocationState] = useState('Delhi');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [locationGeneral, setLocationGeneral] = useState('');
  const [incidentDate, setIncidentDate] = useState('');

  // Real Evidence File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyCitizenAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/report');
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.push('/login?redirect=/report');
          return;
        }
        if (data.user.role !== 'CITIZEN') {
          setErrorMessage(`Civic issue reports can only be filed by Citizen accounts. Your current role is "${data.user.role}".`);
        }
        setCurrentUser(data.user);
      } catch (err) {
        router.push('/login?redirect=/report');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyCitizenAuth();
  }, [router]);

  const validateAndSetFile = (file: File) => {
    setFileError(null);

    // Extension check
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file format "${ext}". Allowed types: PDF, PNG, JPG, JPEG, DOC, DOCX.`);
      return;
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds maximum allowed limit of 10MB (${formatBytes(file.size)} selected).`);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('locationState', locationState.trim());
      formData.append('locationDistrict', locationDistrict.trim());
      if (locationGeneral) formData.append('locationGeneral', locationGeneral.trim());
      if (incidentDate) formData.append('incidentDate', incidentDate);

      if (selectedFile) {
        formData.append('evidenceFile', selectedFile);
        if (evidenceDescription) {
          formData.append('evidenceDescription', evidenceDescription.trim());
        }
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage('Please log in to submit a report. Registration does not require filing a complaint.');
          router.push('/login?redirect=/report');
          return;
        }
        throw new Error(data.error || 'Submission failed');
      }

      setSubmittedReport(data.report);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying citizen authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (submittedReport) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '5rem', maxWidth: '720px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent-emerald-light)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Report Successfully Registered
          </h2>

          <div
            style={{
              display: 'inline-block',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem',
            }}
          >
            Tracking ID: {submittedReport.trackingId}
          </div>

          <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your report is permanently preserved in your private citizen dashboard. NAGRIK’s pattern intelligence engine
            is analyzing semantic clusters to detect whether this problem links with broader systemic issues in{' '}
            <strong>{submittedReport.locationDistrict}</strong>.
          </p>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              What happens next?
            </div>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>Your report is assigned preliminary classification and severity signals.</li>
              <li>If multiple corroborating reports exist in your district, a systemic issue candidate is created.</li>
              <li>You can view status updates and linked systemic actions anytime from your dashboard.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link href="/dashboard" className="btn btn-primary">
              Go to Citizen Dashboard
            </Link>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
                setLocationDistrict('');
                setSelectedFile(null);
                setEvidenceDescription('');
              }}
              className="btn btn-outline"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '2rem' }}>
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
          Citizen Voice
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Submit a Civic Issue Report
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Your report will be preserved, analyzed for systemic patterns, and protected under strict privacy boundaries.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-crimson-light)',
            color: 'var(--accent-crimson)',
            border: '1px solid rgba(185, 28, 28, 0.2)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Problem Summary / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Unfiltered tap water causing yellow tint and odor in Ward 14"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              outline: 'none',
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Civic Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              outline: 'none',
            }}
          >
            <option value="WATER_SANITATION">Water & Sanitation</option>
            <option value="HEALTHCARE">Healthcare & Primary Health Centres</option>
            <option value="ROADS_INFRASTRUCTURE">Roads, Bridges & Infrastructure</option>
            <option value="PUBLIC_TRANSPORT">Public Transport & Mobility</option>
            <option value="ENVIRONMENT">Environment & Pollution</option>
            <option value="EDUCATION">Government Schools & Educational Facilities</option>
            <option value="CIVIC_SERVICES">Municipal & Civic Services</option>
          </select>
        </div>

        {/* Location Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              State / UT *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maharashtra, Delhi, Tamil Nadu"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              District *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. North District, Pune, Chennai"
              value={locationDistrict}
              onChange={(e) => setLocationDistrict(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Ward / Locality (General)
            </label>
            <input
              type="text"
              placeholder="e.g. Sector 4, Civil Lines"
              value={locationGeneral}
              onChange={(e) => setLocationGeneral(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-main)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Detailed Description of What Happened *
          </label>
          <textarea
            required
            rows={5}
            placeholder="Describe what occurred, how long the issue has persisted, and how it impacts your neighborhood..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* REAL FILE UPLOAD: OPTIONAL SUPPORTING EVIDENCE */}
        <div
          style={{
            background: isDragging ? '#fff7ed' : 'var(--bg-surface)',
            border: isDragging ? '2px dashed var(--accent-terracotta)' : '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
            transition: 'all 200ms ease',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} color="var(--accent-terracotta)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Optional Supporting Evidence (Document / Photo / Receipt)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-terracotta)',
                background: '#ffedd5',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              OPTIONAL
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Evidence is <strong>not mandatory</strong>. A lack of files does not invalidate your report. Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX (Max: 10MB).
          </p>

          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            style={{ display: 'none' }}
          />

          {fileError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-crimson-light)',
                color: 'var(--accent-crimson)',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertCircle size={15} />
              <span>{fileError}</span>
            </div>
          )}

          {!selectedFile ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Drag and drop your file here, or browse from your computer
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '1rem' }}>
                Files remain private and encrypted within your citizen dossier
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
                style={{ background: '#ffffff' }}
              >
                Choose File / Browse
              </button>
            </div>
          ) : (
            <div>
              {/* Selected File Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedFile.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {formatBytes(selectedFile.size)} · {selectedFile.type || 'Document'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.78rem',
                      color: 'var(--accent-terracotta)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    title="Remove file"
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#dc2626',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Evidence Description Input */}
              <input
                type="text"
                placeholder="Optional description of this file (e.g. Laboratory water test certificate from 10th Aug)"
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Privacy Invariant Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginBottom: '2rem',
          }}
        >
          <Shield size={16} color="var(--accent-emerald)" />
          <span>
            <strong>Confidentiality Protection:</strong> Your personal identity is strictly protected. Only aggregated
            anonymized context is used for public systemic intelligence.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-accent btn-lg"
          style={{ width: '100%' }}
        >
          <FileCheck2 size={18} />
          <span>{submitting ? 'Submitting Report...' : 'Submit Civic Report'}</span>
        </button>
      </form>
    </div>
  );
}
