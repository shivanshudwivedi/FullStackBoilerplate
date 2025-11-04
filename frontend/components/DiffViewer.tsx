'use client';

import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { useState } from 'react';
import api from '../lib/api';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  filename: string;
  splitView?: boolean;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldCode, newCode, filename, splitView = true }) => {
  const [selectedText, setSelectedText] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    setSelectedText(text);
  };

  const generateAIComment = async () => {
    if (!selectedText || !aiPrompt) return;

    setAiLoading(true);
    setAiResult('');
    try {
      const response = await api.post('/ai/generate-comment', {
        code_block: selectedText,
        prompt: aiPrompt,
      });
      setAiResult(response.data.comment);
    } catch (err: any) {
      setAiResult('Error: ' + (err.response?.data?.detail || 'Failed to generate comment'));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="diff-viewer-container" onMouseUp={handleMouseUp}>
      {selectedText && (
        <div className="ai-toolbar">
          <span>Selected {selectedText.split('\n').length} line(s)</span>
          <button onClick={() => setShowAIModal(true)} className="btn btn-sm btn-primary">
            AI Comment
          </button>
          <button onClick={() => setSelectedText('')} className="btn btn-sm btn-secondary">
            Clear
          </button>
        </div>
      )}
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={splitView}
        compareMethod={DiffMethod.WORDS}
        styles={{
          variables: {
            light: {
              diffViewerBackground: '#fdfdff',
              diffViewerColor: '#333',
              addedBackground: '#e6ffed',
              addedColor: '#24292e',
              removedBackground: '#ffeef0',
              removedColor: '#24292e',
              wordAddedBackground: '#acf2bd',
              wordRemovedBackground: '#fdb8c0',
              emptyLineBackground: '#f1f8ff',
              gutterColor: '#999',
              gutterBackground: '#f7f7f7',
            },
          },
          line: {
            padding: '10px 10px',
            '&:hover': {
              background: '#f1f8ff',
            },
          },
        }}
      />
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate AI Comment</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Prompt</label>
                <input
                  type="text"
                  className="form-input"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Refactor this code' or 'Find potential bugs'"
                />
              </div>
              <div className="code-preview">
                <pre><code>{selectedText}</code></pre>
              </div>
              {aiResult && (
                <div className="ai-result">
                  {aiResult}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAIModal(false)} className="btn btn-secondary">
                Close
              </button>
              <button onClick={generateAIComment} className="btn btn-primary" disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .ai-toolbar {
          background-color: #f1f8ff;
          padding: 8px 12px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .code-preview {
          background-color: #f7f7f7;
          border: 1px solid #ddd;
          padding: 10px;
          margin-top: 10px;
          max-height: 200px;
          overflow-y: auto;
        }
        .ai-result {
          margin-top: 15px;
          padding: 15px;
          background-color: #f0f8ff;
          border: 1px solid #b0d8ff;
        }
      `}</style>
    </div>
  );
};

export default DiffViewer;
