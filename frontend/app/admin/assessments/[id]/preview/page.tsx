'use client';

import { useEffect, useState } from 'react';
import api from '../../../../../lib/api';
import { formatDate, getTimeRemaining } from '../../../../../lib/utils';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

type Props = {
  params: { id: string };
};

interface AssessmentData {
  title: string;
  description: string;
  instructions_md: string;
  start_deadline_ts: string;
  complete_within_hours: number;
  status: string;
}

export default function AssessmentPreviewPage({ params }: Props) {
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessmentData();
  }, []);

  const fetchAssessmentData = async () => {
    try {
      const response = await api.get(`/assessments/${params.id}/preview`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assessment preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h2>Preview Not Available</h2>
          <p>{error || 'This assessment preview could not be loaded'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="start-page">
      <div className="admin-preview-banner">
        <div className="container">
          <span>ADMIN PREVIEW</span>
          <Link href={`/admin/assessments/${params.id}`} className="btn btn-sm btn-secondary">
            Exit Preview
          </Link>
        </div>
      </div>
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
                This is a preview of what the candidate will see. The "Start Assessment" button is disabled.
              </p>
            </div>
            <button 
              className="btn btn-primary btn-lg start-button"
              disabled={true}
            >
              Start Assessment
            </button>
          </div>
        </div>

        {/* Mock Started View */}
        <div className="welcome-card" style={{ marginTop: 'var(--spacing-2xl)' }}>
          <div className="instructions-section">
            <h2>After Starting</h2>
            <p className="text-muted">Below is a preview of the information a candidate will see after they start the assessment.</p>

            <div className="repo-info-card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3>Your Repository</h3>
              <div className="repo-details">
                <div className="detail-row">
                  <span className="detail-label">Repository:</span>
                  <a href="#" onClick={(e) => e.preventDefault()} className="detail-value">
                    acme-corp/candidate-name-assessment
                  </a>
                </div>
              </div>
            </div>

            <div className="instructions-card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3>Next Steps</h3>
              <ol className="steps-list">
                <li>Accept the collaborator invitation sent to your email.</li>
                <li>Clone your repository:
                  <div className="code-block">
                    <code>git clone https://github.com/acme-corp/candidate-name-assessment.git</code>
                  </div>
                </li>
                <li>Complete the assignment and push your changes.</li>
                <li>Return to this page to submit your work.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-preview-banner {
          background: var(--color-warning);
          color: white;
          padding: var(--spacing-md) 0;
          text-align: center;
          font-weight: 600;
        }
        .admin-preview-banner .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .start-page {
          padding-bottom: var(--spacing-3xl);
        }
        .welcome-card {
          margin-top: var(--spacing-xl);
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
        .repo-info-card, .instructions-card {
            background: white;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            text-align: left;
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
