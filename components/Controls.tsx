import React, { useState } from 'react';

interface ControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onDownload: (format?: 'txt' | 'pdf' | 'md') => void;
  onCopyAll: () => void;
  onClear: () => void;
  hasData: boolean;
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  isRecording, 
  onToggleRecording, 
  onDownload, 
  onCopyAll,
  onClear,
  hasData,
  showExportMenu,
  setShowExportMenu
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopyAll();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-capta-footer style={{ position: 'relative' }}>
      {/* Recording Button */}
      <button
        onClick={onToggleRecording}
        className={`btn ${isRecording ? 'btn-stop' : 'btn-start'}`}
      >
        {isRecording ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>
            Stop Recording
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            Start Recording
          </>
        )}
      </button>

      {/* Actions */}
      <div className="btn-row" style={{ position: 'relative' }}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!hasData}
          className="btn btn-export"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export
        </button>

        {showExportMenu && (
             <div style={{
                 position: 'absolute',
                 bottom: '110%',
                 left: 0,
                 width: '100%',
                 backgroundColor: 'white',
                 border: '1px solid #E5E7EB',
                 borderRadius: '0.75rem',
                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                 padding: '0.5rem',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '0.25rem',
                 zIndex: 10
             }}>
                 <button onClick={() => { onDownload('txt'); setShowExportMenu(false); }} className="btn" style={{ justifyContent: 'flex-start', fontSize: '0.875rem', fontWeight: 500, color: '#374151', padding: '0.5rem', background: 'transparent' }}>.TXT (Plain)</button>
                 <button onClick={() => { onDownload('pdf'); setShowExportMenu(false); }} className="btn" style={{ justifyContent: 'flex-start', fontSize: '0.875rem', fontWeight: 500, color: '#374151', padding: '0.5rem', background: 'transparent' }}>.PDF (Document)</button>
                 <button onClick={() => { onDownload('md'); setShowExportMenu(false); }} className="btn" style={{ justifyContent: 'flex-start', fontSize: '0.875rem', fontWeight: 500, color: '#374151', padding: '0.5rem', background: 'transparent' }}>.MD (Markdown)</button>
             </div>
        )}
        
        {/* AI Summary Button */}
        <button
            onClick={() => onDownload('ai-prompt' as any)} // specialized handler call
            disabled={!hasData}
            className="btn btn-icon"
            title="Copy AI Prompt (ChatGPT/Gemini)"
            style={{ color: '#8B5CF6', borderColor: '#E5E7EB' }} // Violet color for AI
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </button>
        
        {/* Copy All Button */}
        <button
            onClick={handleCopyClick}
            disabled={!hasData}
            className="btn btn-icon"
            title={copied ? "Copied!" : "Copy All"}
            style={{ color: copied ? '#22C55E' : '#6B7280', borderColor: copied ? '#86EFAC' : '#E5E7EB', backgroundColor: copied ? '#F0FDF4' : 'transparent' }}
        >
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
        </button>

        <button
            onClick={onClear}
            disabled={!hasData}
            className="btn btn-icon"
            title="Clear"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};
