'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { formatDate, getTimeRemaining } from '../../../lib/utils';
import ReactMarkdown from 'react-markdown';

type Props = {
  params: { slug: string };
};

interface AssessmentData {
  title: string;
  description: string;
  instructions_md: string;
  start_deadline_ts: string;
  complete_within_hours: number;
  status: string;
}

interface StartResponse {
  status: string;
  github_repo_full_name: string;
  repo_url: string;
  pinned_seed_sha: string;
  complete_deadline_ts: string;
  clone_cmd: string;
  message: string;
}

export default function CandidateStartPage({ params }: Props) {
  const [data, setData] = useState<AssessmentData | null>(null);
  const [startResponse, setStartResponse] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessmentData();
  }, []);

  const fetchAssessmentData = async () => {
    try {
      const response = await api.get(`/start/${params.slug}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const response = await api.post(`/start/${params.slug}/begin`);
      setStartResponse(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start assessment');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (confirmText !== 'CONFIRM') {
      alert('Please type CONFIRM to submit');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/submit', {
        candidate_assessment_id: params.slug, // Backend accepts slug or UUID
        confirmation_text: confirmText
      });
      setShowConfirmModal(false);
      alert('Assessment submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
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

  if (error || !data) {
    return (
      <div className="container">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h2>Assessment Not Available</h2>
          <p>{error || 'This assessment link is invalid or has expired'}</p>
        </div>
      </div>
    );
  }

  // If started, show repository info
  if (startResponse) {
    return (
      <div className="started-page">
        <div className="container-sm">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1>Assessment Started!</h1>
            <p className="success-message">{startResponse.message}</p>

            <div className="repo-info-card">
              <h3>Your Repository</h3>
              <div className="repo-details">
                <div className="detail-row">
                  <span className="detail-label">Repository:</span>
                  <a href={startResponse.repo_url} target="_blank" rel="noopener noreferrer" className="detail-value">
                    {startResponse.github_repo_full_name}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Deadline:</span>
                  <span className="detail-value">
                    {formatDate(startResponse.complete_deadline_ts, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time Remaining:</span>
                  <span className="detail-value time-remaining">
                    {getTimeRemaining(startResponse.complete_deadline_ts)}
                  </span>
                </div>
              </div>
            </div>

            <div className="instructions-card">
              <h3>Next Steps</h3>
              <ol className="steps-list">
                <li>Clone your repository:
                  <div className="code-block">
                    <code>{startResponse.clone_cmd}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(startResponse.clone_cmd)}
                      className="copy-btn"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </li>
                <li>Complete the assignment according to the instructions</li>
                <li>Push your changes to the repository</li>
                <li>When finished, return here to submit</li>
              </ol>
            </div>

            <div className="action-buttons">
              <a 
                href={startResponse.repo_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                Open Repository
              </a>
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="btn btn-success btn-lg"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Submission</h2>
              </div>
              <div className="modal-body">
                <div className="warning-box">
                  <p><strong>⚠️ Warning:</strong> Once submitted, you cannot make any more changes to your code.</p>
                </div>
                <p>Type <strong>CONFIRM</strong> to submit your assessment:</p>
                <input
                  type="text"
                  className="form-input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type CONFIRM"
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="btn btn-danger"
                  disabled={confirmText !== 'CONFIRM' || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Final Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .started-page {
            padding: var(--spacing-3xl) 0;
          }

          .success-card {
            text-align: center;
          }

          .success-icon {
            font-size: 4rem;
            margin-bottom: var(--spacing-lg);
          }

          .success-card h1 {
            font-size: 2rem;
            margin-bottom: var(--spacing-md);
          }

          .success-message {
            font-size: 1.125rem;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-2xl);
          }

          .repo-info-card,
          .instructions-card {
            background: white;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            margin-bottom: var(--spacing-xl);
            text-align: left;
          }

          .repo-info-card h3,
          .instructions-card h3 {
            margin-bottom: var(--spacing-lg);
          }

          .repo-details {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) 0;
            border-bottom: 1px solid var(--color-border);
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-weight: 500;
            color: var(--color-text-secondary);
          }

          .detail-value {
            font-weight: 500;
            color: var(--color-text);
          }

          .time-remaining {
            color: var(--color-success);
            font-weight: 600;
          }

          .steps-list {
            padding-left: var(--spacing-lg);
            line-height: 2;
          }

          .steps-list li {
            margin-bottom: var(--spacing-md);
          }

          .code-block {
            background: var(--color-bg-secondary);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            margin-top: var(--spacing-sm);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-md);
          }

          .code-block code {
            font-family: var(--font-mono);
            font-size: 0.875rem;
            flex: 1;
            word-break: break-all;
          }

          .copy-btn {
            background: white;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
            cursor: pointer;
            font-size: 1rem;
            transition: all var(--transition-fast);
          }

          .copy-btn:hover {
            background: var(--color-bg-tertiary);
          }

          .action-buttons {
            display: flex;
            gap: var(--spacing-md);
            justify-content: center;
            flex-wrap: wrap;
          }

          .warning-box {
            background: var(--color-warning-light);
            border: 1px solid var(--color-warning);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
          }

          .warning-box p {
            margin: 0;
            color: var(--color-warning);
          }

          @media (max-width: 768px) {
            .action-buttons {
              flex-direction: column;
            }

            .action-buttons .btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  // Pre-start view
  return (
    <div className="start-page">
      <div className="container-sm">
        <div className="welcome-card">
          <div className="welcome-header">
            <h1>{data.title}</h1>
            {data.description && <p className="subtitle">{data.description}</p>}
          </div>

          <div className="deadline-banner">
            <div className="deadline-item">
              <span className="deadline-label">Start By:</span>
              <span className="deadline-value">{formatDate(data.start_deadline_ts)}</span>
            </div>
            <div className="deadline-item">
              <span className="deadline-label">Time Remaining:</span>
              <span className="deadline-value time-remaining">
                {getTimeRemaining(data.start_deadline_ts)}
              </span>
            </div>
            <div className="deadline-item">
              <span className="deadline-label">Duration:</span>
              <span className="deadline-value">{data.complete_within_hours} hours</span>
            </div>
          </div>

          <div className="instructions-section">
            <h2>Instructions</h2>
            <div className="markdown-content">
              <ReactMarkdown>{data.instructions_md}</ReactMarkdown>
            </div>
          </div>

          <div className="start-section">
            <div className="info-box">
              <p>
                <strong>Ready to begin?</strong> Once you start, a private GitHub repository
                will be created for you with {data.complete_within_hours} hours to complete the assessment.
              </p>
            </div>
            <button 
              onClick={handleStart}
              className="btn btn-primary btn-lg start-button"
              disabled={starting}
            >
              {starting ? (
                <>
                  <span className="spinner"></span>
                  Starting...
                </>
              ) : (
                'Start Assessment'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .start-page {
          padding: var(--spacing-3xl) 0;
        }

        .welcome-card {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
        }

        .welcome-header {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          padding: var(--spacing-3xl) var(--spacing-2xl);
          text-align: center;
        }

        .welcome-header h1 {
          font-size: 2.5rem;
          margin-bottom: var(--spacing-md);
          color: white;
        }

        .subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .deadline-banner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .deadline-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          text-align: center;
        }

        .deadline-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          letter-spacing: 0.05em;
        }

        .deadline-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .time-remaining {
          color: var(--color-success);
        }

        .instructions-section {
          padding: var(--spacing-2xl);
        }

        .instructions-section h2 {
          margin-bottom: var(--spacing-lg);
          font-size: 1.5rem;
        }

        .markdown-content {
          color: var(--color-text-secondary);
          line-height: 1.8;
        }

        .markdown-content :global(h1) { font-size: 1.5rem; margin-top: var(--spacing-xl); }
        .markdown-content :global(h2) { font-size: 1.25rem; margin-top: var(--spacing-lg); }
        .markdown-content :global(h3) { font-size: 1.125rem; margin-top: var(--spacing-md); }
        .markdown-content :global(code) {
          background: var(--color-bg-secondary);
          padding: 0.125rem 0.25rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.875em;
        }
        .markdown-content :global(pre) {
          background: var(--color-bg-secondary);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          overflow-x: auto;
        }

        .start-section {
          padding: var(--spacing-2xl);
          background: var(--color-bg-secondary);
          text-align: center;
        }

        .info-box {
          background: white;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .info-box p {
          margin: 0;
          color: var(--color-text-secondary);
        }

        .start-button {
          min-width: 250px;
        }

        @media (max-width: 768px) {
          .deadline-banner {
            grid-template-columns: 1fr;
          }

          .welcome-header h1 {
            font-size: 2rem;
          }

          .start-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
