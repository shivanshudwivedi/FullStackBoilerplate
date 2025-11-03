'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { formatDate, getStatusBadgeClass, getStatusText } from '../../../../lib/utils';
import ReactMarkdown from 'react-markdown';

type Props = {
  params: { id: string };
};

interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions_md: string;
  seed_repo_url: string;
  start_by_hours: number;
  complete_within_hours: number;
  created_at: string;
  is_active: boolean;
}

interface CandidateAssessment {
  id: string;
  status: string;
  start_slug: string;
  created_at: string;
  submitted_at?: string;
  candidates: {
    name: string;
    email: string;
    github_username?: string;
  };
}

export default function AssessmentDetailPage({ params }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [candidates, setCandidates] = useState<CandidateAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    github_username: '',
  });

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/assessments/${params.id}`);
      setAssessment(response.data.assessment);
      setCandidates(response.data.candidates || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      await api.post(`/assessments/${params.id}/invite`, inviteData);
      setInviteData({ email: '', name: '', github_username: '' });
      setShowInviteForm(false);
      fetchAssessment(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Assessment not found'}</div>
        <Link href="/admin" className="btn btn-secondary mt-lg">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="assessment-detail-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">Assessments</Link>
              <span>/</span>
              <span>{assessment.title}</span>
            </div>
            <h1>{assessment.title}</h1>
            <div className="header-meta">
              <span className={`badge ${assessment.is_active ? 'badge-success' : 'badge-neutral'}`}>
                {assessment.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-muted">Created {formatDate(assessment.created_at)}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowInviteForm(true)} 
            className="btn btn-primary"
          >
            Invite Candidate
          </button>
        </div>

        <div className="content-grid">
          {/* Assessment Info */}
          <div className="main-content">
            <div className="card">
              <h3>Description</h3>
              <p className="text-muted">{assessment.description || 'No description provided'}</p>
            </div>

            <div className="card">
              <h3>Instructions</h3>
              <div className="markdown-content">
                <ReactMarkdown>{assessment.instructions_md}</ReactMarkdown>
              </div>
            </div>

            <div className="card">
              <h3>Configuration</h3>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">Repository</span>
                  <a href={assessment.seed_repo_url} target="_blank" rel="noopener noreferrer" className="config-value">
                    {assessment.seed_repo_url}
                  </a>
                </div>
                <div className="config-item">
                  <span className="config-label">Time to Start</span>
                  <span className="config-value">{assessment.start_by_hours} hours</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Time to Complete</span>
                  <span className="config-value">{assessment.complete_within_hours} hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidates Sidebar */}
          <div className="sidebar">
            <div className="card">
              <div className="card-header-row">
                <h3>Candidates</h3>
                <span className="badge badge-neutral">{candidates.length}</span>
              </div>

              {candidates.length === 0 ? (
                <div className="empty-state-small">
                  <p className="text-muted text-center">No candidates invited yet</p>
                </div>
              ) : (
                <div className="candidates-list">
                  {candidates.map((ca) => (
                    <Link 
                      key={ca.id} 
                      href={`/admin/review/${ca.id}`}
                      className="candidate-item"
                    >
                      <div>
                        <div className="candidate-name">{ca.candidates.name || ca.candidates.email}</div>
                        <div className="candidate-email">{ca.candidates.email}</div>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(ca.status)}`}>
                        {getStatusText(ca.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteForm && (
        <div className="modal-overlay" onClick={() => setShowInviteForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Candidate</h2>
              <button 
                onClick={() => setShowInviteForm(false)}
                className="close-button"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInviteSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={inviteData.github_username}
                    onChange={(e) => setInviteData({...inviteData, github_username: e.target.value})}
                    placeholder="username"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowInviteForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .assessment-detail-page {
          padding: var(--spacing-2xl) 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-2xl);
          gap: var(--spacing-lg);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .breadcrumb a {
          color: var(--color-primary);
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: var(--spacing-sm);
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: var(--spacing-2xl);
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .markdown-content {
          color: var(--color-text-secondary);
          line-height: 1.8;
        }

        .markdown-content :global(h1) { font-size: 1.5rem; margin-top: var(--spacing-lg); }
        .markdown-content :global(h2) { font-size: 1.25rem; margin-top: var(--spacing-lg); }
        .markdown-content :global(h3) { font-size: 1.125rem; margin-top: var(--spacing-md); }
        .markdown-content :global(code) {
          background: var(--color-bg-secondary);
          padding: 0.125rem 0.25rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.875em;
        }

        .config-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .config-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          letter-spacing: 0.05em;
        }

        .config-value {
          font-size: 0.875rem;
          color: var(--color-text);
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .candidates-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .candidate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          text-decoration: none;
          transition: all var(--transition-base);
        }

        .candidate-item:hover {
          background: var(--color-bg-secondary);
          border-color: var(--color-primary);
        }

        .candidate-name {
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 0.125rem;
        }

        .candidate-email {
          font-size: 0.75rem;
          color: var(--color-text-tertiary);
        }

        .empty-state-small {
          padding: var(--spacing-xl) 0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--color-text-tertiary);
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .close-button:hover {
          background: var(--color-bg-secondary);
          color: var(--color-text);
        }

        .modal-body {
          padding: var(--spacing-xl);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
