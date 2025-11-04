'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings/follow_up_email_template');
      if (response.data && response.data.value) {
        setTemplate(response.data.value);
      } else {
        const defaultTemplate = `Hi [Candidate Name],

Thanks for completing the assessment. We're impressed with your work and would like to schedule a follow-up interview.

Please let us know your availability.

Best,
The Team`;
        setTemplate(defaultTemplate);
      }
    } catch (error) {
      // Handle not found error gracefully
      const defaultTemplate = `Hi [Candidate Name],

Thanks for completing the assessment. We're impressed with your work and would like to schedule a follow-up interview.

Please let us know your availability.

Best,
The Team`;
      setTemplate(defaultTemplate);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', {
        key: 'follow_up_email_template',
        value: template,
      });
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="container-sm">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <div className="card">
          <h3>Follow-up Email Template</h3>
          <p className="text-muted">
            This template will be used when you send a follow-up email to a candidate after they've submitted their assessment.
            You can use `[Candidate Name]` as a placeholder.
          </p>
          <div className="form-group mt-lg">
            <textarea
              className="form-textarea"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              disabled={loading}
            />
          </div>
          <div className="form-actions">
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
