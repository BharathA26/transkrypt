import React from 'react';

interface SidebarHeaderProps {
  onClose: () => void;
  itemCount: number;
  showTimestamps?: boolean;
  onToggleTimestamps?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose, itemCount, showTimestamps = true, onToggleTimestamps }) => {
  return (
    <div data-capta-header>
      <div className="flex items-start gap-3" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: 'transparent', borderRadius: '0.5rem' }}>
             {/* Logo Image */}
             <img 
                src={chrome.runtime.getURL("assets/logo.png")} 
                alt="Logo" 
                style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
             />
        </div>
        <div>
           <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', lineHeight: 1.25, marginBottom: '0.125rem' }}>Transkrypt</h1>
           <p style={{ fontSize: '0.875rem', color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="animate-pulse" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#22C55E', display: 'inline-block' }}></span>
              {itemCount} lines captured
           </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
          {/* Timestamp Toggle */}
          <button
              onClick={onToggleTimestamps}
              style={{ color: showTimestamps ? '#3B82F6' : '#9CA3AF', padding: '0.25rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={showTimestamps ? "Hide Timestamps" : "Show Timestamps"}
          >
             {showTimestamps ? (
                 /* Clock Icon (Show) */
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
             ) : (
                 /* Clock Off/Slashed (Hide) */
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 22 2 2" /><path d="M21 12A9 9 0 0 0 5.4 6.6" /><path d="M3 12a9 9 0 0 0 15 17.4" /><path d="M12 7v5l2.5 1.5" /></svg>
             )}
          </button>

          <button 
              onClick={onClose}
              style={{ color: '#9CA3AF', padding: '0.25rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Collapse Sidebar"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
              {/* Collapse Icon (Chevron Right) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
          </button>
      </div>
    </div>
  );
};
