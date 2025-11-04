'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';

const TEMPLATE_KEYS = [
  { key: 'follow_up_email', label: 'Follow-Up Email' },
  { key: 'rejection_email', label: 'Rejection Email' },
  { key: 'offer_email', label: 'Offer Email' },
];

const DEFAULT_TEMPLATES: { [key: string]: string } = {
  follow_up_email: `Hi [Candidate Name],\n\nThanks for completing the assessment. We're impressed with your work and would like to schedule a follow-up interview.\n\nPlease let us know your availability.\n\nBest,\nThe Team`,
  rejection_email: `Hi [Candidate Name],\n\nThank you for your interest and for taking the time to complete our assessment. After careful consideration, we have decided not to move forward at this time.\n\nWe wish you the best of luck in your job search.\n\nSincerely,\nThe Team`,
  offer_email: `Hi [Candidate Name],\n\nWe were very impressed with your assessment and are pleased to offer you the position.\n\nFurther details about the offer will be sent in a separate email.\n\nCongratulations!\n\nThe Team`,
};

export default function SettingsPage() {
  const [activeTemplateKey, setActiveTemplateKey] = useState(TEMPLATE_KEYS[0].key);
  const [templates, setTemplates] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const fetchedTemplates: { [key: string]: string } = {};
    for (const { key } of TEMPLATE_KEYS) {
      try {
        const response = await api.get(`/settings/${key}`);
        fetchedTemplates[key] = response.data?.value || DEFAULT_TEMPLATES[key];
      } catch (error) {
        fetchedTemplates[key] = DEFAULT_TEMPLATES[key];
      }
    }
    setTemplates(fetchedTemplates);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', {
        key: activeTemplateKey,
        value: templates[activeTemplateKey],
      });
      alert('Template saved!');
    } catch (error) {
      alert('Failed to save template.');
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
          <h3>Email Templates</h3>
          <p className="text-muted">
            Define templates for various emails sent to candidates. You can use `[Candidate Name]` as a placeholder.
          </p>
          
          <div className="template-selector">
            {TEMPLATE_KEYS.map(({ key, label }) => (
              <button
                key={key}
                className={`template-tab ${activeTemplateKey === key ? 'active' : ''}`}
                onClick={() => setActiveTemplateKey(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="form-group mt-lg">
            <textarea
              className="form-textarea"
              value={templates[activeTemplateKey] || ''}
              onChange={(e) => setTemplates({ ...templates, [activeTemplateKey]: e.target.value })}
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
              {saving ? 'Saving...' : `Save ${TEMPLATE_KEYS.find(t => t.key === activeTemplateKey)?.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
