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
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const handleLineNumberClick = (lineNumber: number) => {
    if (!selection) {
      setSelection({ start: lineNumber, end: lineNumber });
    } else {
      const newSelection = {
        start: Math.min(selection.start, lineNumber),
        end: Math.max(selection.end, lineNumber),
      };
      setSelection(newSelection);
    }
  };

  const getSelectedCode = () => {
    if (!selection) return '';
    const lines = newCode.split('\n');
    return lines.slice(selection.start - 1, selection.end).join('\n');
  };

  const generateAIComment = async () => {
    const codeBlock = getSelectedCode();
    if (!codeBlock || !aiPrompt) return;

    setAiLoading(true);
    setAiResult('');
    try {
      const response = await api.post('/ai/generate-comment', {
        code_block: codeBlock,
        prompt: aiPrompt,
      });
      setAiResult(response.data.comment);
    } catch (err: any) {
      setAiResult('Error: ' + (err.response?.data?.detail || 'Failed to generate comment'));
    } finally {
      setAiLoading(false);
    }
  };

  const renderGutter = (lineNumber: number) => {
    const isSelected = selection && lineNumber >= selection.start && lineNumber <= selection.end;
    return (
      <div
        onClick={() => handleLineNumberClick(lineNumber)}
        style={{
          cursor: 'pointer',
          padding: '0 10px',
          backgroundColor: isSelected ? '#a2d2ff' : 'transparent',
        }}
      >
        {lineNumber}
      </div>
    );
  };
  
  return (
    <div className="diff-viewer-container">
      {selection && (
        <div className="ai-toolbar">
          <span>Selected lines: {selection.start} - {selection.end}</span>
          <button onClick={() => setShowAIModal(true)} className="btn btn-sm btn-primary">
            AI Comment
          </button>
          <button onClick={() => setSelection(null)} className="btn btn-sm btn-secondary">
            Clear
          </button>
        </div>
      )}
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={splitView}
        compareMethod={DiffMethod.WORDS}
        renderGutter={(props: any) => renderGutter(props.lineNumber)}
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
                <pre><code>{getSelectedCode()}</code></pre>
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
