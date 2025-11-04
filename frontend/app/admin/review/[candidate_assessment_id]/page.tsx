'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { formatDate, getStatusBadgeClass, getStatusText } from '../../../../lib/utils';
import ReactMarkdown from 'react-markdown';
import DiffViewer from '../../../../components/DiffViewer';

type Props = {
  params: { candidate_assessment_id: string };
};

export default function ReviewPage({ params }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [activeDiff, setActiveDiff] = useState<string | null>(null);
  
  const [rankScore, setRankScore] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    try {
      const response = await api.get(`/review/${params.candidate_assessment_id}`);
      setData(response.data);
      if (response.data.review) {
        setRankScore(response.data.review.stack_rank_score || 0);
        setNotes(response.data.review.manual_notes_md || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      await api.post('/ai/summary', {
        candidate_assessment_id: params.candidate_assessment_id
      });
      fetchReviewData(); // Refresh to get AI summary
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate AI summary');
    } finally {
      setAiLoading(false);
    }
  };

  const saveRanking = async () => {
    try {
      await api.post('/rank', {
        candidate_assessment_id: params.candidate_assessment_id,
        stack_rank_score: rankScore,
        manual_notes_md: notes
      });
      alert('Ranking saved successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save ranking');
    }
  };

  const sendFollowUp = async () => {
    setFollowUpLoading(true);
    try {
      await api.post('/followup/send', {
        candidate_assessment_id: params.candidate_assessment_id
      });
      alert('Follow-up email sent successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send follow-up');
    } finally {
      setFollowUpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading review data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link href="/admin" className="btn btn-secondary mt-lg">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">Assessments</Link>
              <span>/</span>
              <span>Review</span>
            </div>
            <h1>{data.candidate.name || data.candidate.email}</h1>
            <div className="header-meta">
              <span className={`badge ${getStatusBadgeClass(data.candidate_assessment.status)}`}>
                {getStatusText(data.candidate_assessment.status)}
              </span>
              <span className="text-muted">
                Submitted {data.candidate_assessment.submitted_at ? formatDate(data.candidate_assessment.submitted_at) : 'Not yet'}
              </span>
            </div>
          </div>
          <button 
            onClick={sendFollowUp}
            className="btn btn-success"
            disabled={followUpLoading}
          >
            {followUpLoading ? 'Sending...' : 'Send Follow-Up'}
          </button>
        </div>

        <div className="content-grid">
          {/* Main Content */}
          <div className="main-content">
            {/* Candidate Info */}
            <div className="card">
              <h3>Candidate Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{data.candidate.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">GitHub</span>
                  <span className="info-value">{data.candidate.github_username || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Repository</span>
                  <a href={data.repo.url} target="_blank" rel="noopener noreferrer" className="info-value">
                    {data.repo.full_name}
                  </a>
                </div>
              </div>
            </div>

            {/* Code Changes */}
            <div className="card">
              <div className="card-header-row">
                <h3>Code Changes</h3>
                <a href={data.repo.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                  View on GitHub
                </a>
              </div>
              {data.diff && data.diff.files ? (
                <div className="diff-summary">
                  <p>
                    <strong>{data.diff.files.length}</strong> files changed, 
                    <span className="text-success"> +{data.diff.files.reduce((acc: number, f: any) => acc + (f.additions || 0), 0)} </span>
                    <span className="text-error"> -{data.diff.files.reduce((acc: number, f: any) => acc + (f.deletions || 0), 0)}</span>
                  </p>
                  
                  <div className="files-list">
                    {data.diff.files.map((file: any, idx: number) => (
                      <div key={idx} className="file-item-container">
                        <button 
                          onClick={() => setActiveDiff(activeDiff === file.filename ? null : file.filename)}
                          className="file-item"
                        >
                          <div className="file-name">{file.filename}</div>
                          <div className="file-stats">
                            <span className="stat-add">+{file.additions}</span>
                            <span className="stat-del">-{file.deletions}</span>
                          </div>
                        </button>
                        {activeDiff === file.filename && (
                          <div className="diff-content">
                            <DiffViewer
                              oldCode={file.previous_content || ''}
                              newCode={file.content || ''}
                              filename={file.filename}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted">No changes detected</p>
              )}
            </div>

            {/* AI Analysis */}
            <div className="card">
              <div className="card-header-row">
                <h3>AI Analysis</h3>
                <button 
                  onClick={generateAISummary}
                  className="btn btn-sm btn-primary"
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Analyzing...' : 'Generate AI Summary'}
                </button>
              </div>
              {data.review?.ai_summary_md ? (
                <div className="ai-summary">
                  <ReactMarkdown>{data.review.ai_summary_md}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted">Click "Generate AI Summary" to analyze the code</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Stack Ranking */}
            <div className="card">
              <h3>Stack Ranking</h3>
              <div className="ranking-section">
                <div className="score-display">
                  <span className="score-number">{rankScore}</span>
                  <span className="score-label">/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rankScore}
                  onChange={(e) => setRankScore(parseInt(e.target.value))}
                  className="score-slider"
                />
                <div className="score-labels">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {data.review?.auto_score && (
                <div className="auto-score-box">
                  <span className="auto-score-label">AI Score:</span>
                  <span className="auto-score-value">{data.review.auto_score}/100</span>
                </div>
              )}

              <div className="form-group mt-lg">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your review notes..."
                  rows={6}
                />
              </div>

              <button 
                onClick={saveRanking}
                className="btn btn-primary w-full"
              >
                Save Ranking
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .review-page {
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

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .info-grid {
          display: grid;
          gap: var(--spacing-md);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .info-label {
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .info-value {
          color: var(--color-text);
        }

        .diff-summary {
          margin-top: var(--spacing-md);
        }

        .files-list {
          margin-top: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .file-item-container {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          font-family: var(--font-mono);
          font-size: 0.875rem;
          width: 100%;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .file-item:hover {
          background: var(--color-bg-tertiary);
        }

        .file-name {
          color: var(--color-text);
        }

        .file-stats {
          display: flex;
          gap: var(--spacing-sm);
        }

        .diff-content {
          border-top: 1px solid var(--color-border);
        }

        .stat-add {
          color: var(--color-success);
        }

        .stat-del {
          color: var(--color-error);
        }

        .text-success {
          color: var(--color-success);
        }

        .text-error {
          color: var(--color-error);
        }

        .ai-summary {
          background: var(--color-bg-secondary);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          line-height: 1.8;
        }

        .ranking-section {
          text-align: center;
        }

        .score-display {
          margin-bottom: var(--spacing-lg);
        }

        .score-number {
          font-size: 3rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .score-label {
          font-size: 1.5rem;
          color: var(--color-text-tertiary);
        }

        .score-slider {
          width: 100%;
          height: 8px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          outline: none;
          -webkit-appearance: none;
          margin-bottom: var(--spacing-sm);
        }

        .score-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
        }

        .score-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: none;
        }

        .score-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--color-text-tertiary);
        }

        .auto-score-box {
          background: var(--color-info-light);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .auto-score-label {
          font-size: 0.875rem;
          color: var(--color-info);
        }

        .auto-score-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-info);
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
