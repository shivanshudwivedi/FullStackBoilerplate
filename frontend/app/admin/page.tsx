'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { formatDate, formatRelativeTime, getStatusBadgeClass, getStatusText } from '../../lib/utils';

interface Assessment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await api.get('/assessments');
      setAssessments(response.data.assessments || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assessments');
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted">Manage assessments and review candidate submissions</p>
          </div>
          <Link href="/admin/assessments/new" className="btn btn-primary">
            Create Assessment
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Assessments Yet</h3>
            <p>Create your first assessment to get started</p>
            <Link href="/admin/assessments/new" className="btn btn-primary mt-lg">
              Create Assessment
            </Link>
          </div>
        ) : (
          <div className="assessments-grid">
            {assessments.map((assessment) => (
              <Link 
                key={assessment.id} 
                href={`/admin/assessments/${assessment.id}`}
                className="assessment-card"
              >
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="assessment-title">{assessment.title}</h3>
                    <span className={`badge ${assessment.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {assessment.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="assessment-description">
                    {assessment.description || 'No description provided'}
                  </p>
                  <div className="assessment-meta">
                    <span className="meta-item">
                      📅 {formatDate(assessment.created_at)}
                    </span>
                    <span className="meta-item text-muted">
                      {formatRelativeTime(assessment.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          padding: var(--spacing-2xl) 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-2xl);
          flex-wrap: wrap;
          gap: var(--spacing-lg);
        }

        .dashboard-header h1 {
          font-size: 2rem;
          margin-bottom: var(--spacing-xs);
        }

        .loading-state {
          text-align: center;
          padding: var(--spacing-3xl);
        }

        .loading-state .spinner {
          margin: 0 auto var(--spacing-lg);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-3xl);
          background: white;
          border-radius: var(--radius-xl);
          border: 2px dashed var(--color-border);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: var(--spacing-sm);
        }

        .empty-state p {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
        }

        .assessments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .assessment-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          padding: var(--spacing-xl);
          transition: all var(--transition-base);
          text-decoration: none;
          display: block;
        }

        .assessment-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary);
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .assessment-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          flex: 1;
        }

        .assessment-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .assessment-meta {
          display: flex;
          gap: var(--spacing-md);
          font-size: 0.875rem;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        @media (max-width: 768px) {
          .assessments-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
