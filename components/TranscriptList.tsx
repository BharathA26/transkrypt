import React, { useEffect, useRef, useState } from 'react';
import { TranscriptLine } from '../types';

interface TranscriptListProps {
  transcript: TranscriptLine[];
  showTimestamps?: boolean;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ transcript, showTimestamps = true }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (transcript.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', backgroundColor: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <p style={{ fontWeight: 500, color: '#6B7280' }}>Waiting for speech...</p>
      </div>
    );
  }

  return (
    <div data-capta-body data-capta-scroll>
      {transcript.map((line, index) => (
        <div key={line.id + index} className="capta-item group" style={{ position: 'relative' }}>
          <div className="capta-avatar" style={{ backgroundColor: line.avatarColor || '#3B82F6' }}>
            {line.speaker.charAt(0).toUpperCase()}
          </div>
          <div className="capta-content">
            <div className="capta-meta">
              <span className="capta-name">{line.speaker}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {showTimestamps && (
                    <span className="capta-time">{line.timestamp}</span>
                  )}
                  {/* Copy Button */}
                  <button 
                    onClick={() => handleCopy(line.text, line.id + index)}
                    style={{ 
                        color: copiedId === (line.id + index) ? '#22C55E' : '#9CA3AF', 
                        cursor: 'pointer', 
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="Copy text"
                  >
                     {copiedId === (line.id + index) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                     )}
                  </button>
              </div>
            </div>
            <div className="capta-bubble">
              {line.text}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};
