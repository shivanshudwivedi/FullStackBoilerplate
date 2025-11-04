'use client';

import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { useEffect, useState } from 'react';
import api from '../lib/api';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  filename: string;
  splitView?: boolean;
  onComment: (comment: { file_path: string; line_start: number; line_end: number; body_md: string }) => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldCode, newCode, filename, splitView = true, onComment }) => {
  const [selectedText, setSelectedText] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [manualComment, setManualComment] = useState('');
  const [lineStart, setLineStart] = useState(1);
  const [lineEnd, setLineEnd] = useState(1);

  const handleAddCommentClick = () => {
    setLineStart(1);
    setLineEnd(1);
    setManualComment('');
    setShowCommentModal(true);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text) {
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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

  const handleSaveComment = () => {
    if (!manualComment) return;
    const start = Math.max(1, Number(lineStart));
    const end = Math.max(start, Number(lineEnd));

    onComment({
      file_path: filename,
      line_start: start,
      line_end: end,
      body_md: manualComment,
    });

    setManualComment('');
    setLineStart(1);
    setLineEnd(1);
    setShowCommentModal(false);
  };

  return (
    <div className="diff-viewer-container">
      <div className="toolbar">
        <button onClick={handleAddCommentClick} className="btn btn-sm btn-secondary">
          Add Comment
        </button>
        <div className="toolbar-spacer" />
        <button
          onClick={() => setShowAIModal(true)}
          className="btn btn-sm btn-primary"
          disabled={!selectedText}
        >
          AI Comment
        </button>
      </div>
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

      {showCommentModal && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Comment</h2>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Line Start</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={lineStart}
                    onChange={(e) => setLineStart(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Line End</label>
                  <input
                    type="number"
                    min={lineStart}
                    className="form-input"
                    value={lineEnd}
                    onChange={(e) => setLineEnd(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (Markdown supported)</label>
                <textarea
                  className="form-textarea"
                  value={manualComment}
                  onChange={(e) => setManualComment(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCommentModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveComment} className="btn btn-primary" disabled={!manualComment.trim()}>
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}

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
                {selectedText ? (
                  <pre><code>{selectedText}</code></pre>
                ) : (
                  <p className="text-muted">Select code in the diff above to enable AI comments.</p>
                )}
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
              <button onClick={generateAIComment} className="btn btn-primary" disabled={aiLoading || !selectedText || !aiPrompt.trim()}>
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .toolbar {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }
        .toolbar-spacer {
          flex: 1;
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
        .form-row {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DiffViewer;
