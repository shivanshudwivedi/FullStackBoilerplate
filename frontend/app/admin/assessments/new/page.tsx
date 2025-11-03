'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function NewAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions_md: '',
    seed_repo_url: '',
    start_by_hours: 72,
    complete_within_hours: 48,
    email_template: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('hours') ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/assessments', formData);
      router.push(`/admin/assessments/${response.data.assessment_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create assessment');
      console.error('Error creating assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-assessment-page">
      <div className="container-sm">
        <div className="page-header">
          <div>
            <h1>Create New Assessment</h1>
            <p className="text-muted">Set up a new coding challenge for candidates</p>
          </div>
          <Link href="/admin" className="btn btn-secondary">
            Cancel
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="card form-card">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title" className="form-label required">
                  Assessment Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Full Stack Engineer Take-Home"
                  required
                />
                <p className="form-help">A clear, descriptive title for this assessment</p>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief overview of what this assessment tests..."
                  rows={3}
                />
                <p className="form-help">A short summary of the assessment goals</p>
              </div>

              <div className="form-group">
                <label htmlFor="instructions_md" className="form-label required">
                  Instructions (Markdown)
                </label>
                <textarea
                  id="instructions_md"
                  name="instructions_md"
                  className="form-textarea"
                  value={formData.instructions_md}
                  onChange={handleChange}
                  placeholder="# Instructions&#10;&#10;## Objective&#10;Build a feature that...&#10;&#10;## Requirements&#10;- Requirement 1&#10;- Requirement 2"
                  rows={12}
                  required
                />
                <p className="form-help">Detailed instructions in Markdown format</p>
              </div>
            </div>

            {/* Repository Configuration */}
            <div className="form-section">
              <h3 className="section-title">Repository Configuration</h3>
              
              <div className="form-group">
                <label htmlFor="seed_repo_url" className="form-label required">
                  Seed Repository URL
                </label>
                <input
                  id="seed_repo_url"
                  name="seed_repo_url"
                  type="url"
                  className="form-input"
                  value={formData.seed_repo_url}
                  onChange={handleChange}
                  placeholder="https://github.com/username/starter-template"
                  required
                />
                <p className="form-help">
                  GitHub repository URL that will be cloned for each candidate
                </p>
              </div>
            </div>

            {/* Time Configuration */}
            <div className="form-section">
              <h3 className="section-title">Time Configuration</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_by_hours" className="form-label required">
                    Hours to Start
                  </label>
                  <input
                    id="start_by_hours"
                    name="start_by_hours"
                    type="number"
                    className="form-input"
                    value={formData.start_by_hours}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <p className="form-help">Hours candidates have to begin</p>
                </div>

                <div className="form-group">
                  <label htmlFor="complete_within_hours" className="form-label required">
                    Hours to Complete
                  </label>
                  <input
                    id="complete_within_hours"
                    name="complete_within_hours"
                    type="number"
                    className="form-input"
                    value={formData.complete_within_hours}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <p className="form-help">Hours to complete once started</p>
                </div>
              </div>
            </div>

            {/* Email Template */}
            <div className="form-section">
              <h3 className="section-title">Email Template</h3>
              
              <div className="form-group">
                <label htmlFor="email_template" className="form-label">
                  Custom Email Message
                </label>
                <textarea
                  id="email_template"
                  name="email_template"
                  className="form-textarea"
                  value={formData.email_template}
                  onChange={handleChange}
                  placeholder="Add a personal message to the invitation email..."
                  rows={4}
                />
                <p className="form-help">Optional custom message for invitation emails</p>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <Link href="/admin" className="btn btn-secondary">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  'Create Assessment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .new-assessment-page {
          padding: var(--spacing-2xl) 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-2xl);
          gap: var(--spacing-lg);
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: var(--spacing-xs);
        }

        .form-card {
          padding: var(--spacing-2xl);
        }

        .form-section {
          margin-bottom: var(--spacing-2xl);
          padding-bottom: var(--spacing-2xl);
          border-bottom: 1px solid var(--color-border);
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
          color: var(--color-text);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          padding-top: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
