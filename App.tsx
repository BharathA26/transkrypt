import React, { useState, useEffect, useRef } from 'react';
import { TranscriptLine } from './types';
import { CaptionObserver } from './services/captionObserver';
import { TranscriptList } from './components/TranscriptList';
import { Controls } from './components/Controls';
import { SidebarHeader } from './components/SidebarHeader';
import { jsPDF } from 'jspdf';

interface AppProps {
  isExtension?: boolean;
}

const App: React.FC<AppProps> = ({ isExtension = true }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const observerRef = useRef<CaptionObserver | null>(null);

  useEffect(() => {
    // Initialize the observer service
    observerRef.current = new CaptionObserver((newLine) => {
      setTranscript((prev) => {
        // Advanced Deduplication & Stability Logic
        const updated = [...prev];
        const lookbackWindow = 8; // Look a bit deeper
        const startIndex = Math.max(0, updated.length - lookbackWindow);

        // We search backwards to find the most recent relevant message
        for (let i = updated.length - 1; i >= startIndex; i--) {
            const existing = updated[i];
            
            // Only consider merging if speaker matches OR if speaker is "Unknown Speaker" which might just be a missing label
            if (existing.speaker === newLine.speaker || (newLine.speaker === 'Unknown Speaker' && existing.speaker !== 'Unknown Speaker')) {
                
                // 1. Exact Identity check (Text + Timestamp close enough?)
                if (existing.text === newLine.text) return prev;

                // 2. Prefix Match (The standard "correction/extension" case)
                // New: "Hello world this is"
                // Old: "Hello world"
                if (newLine.text.startsWith(existing.text)) {
                    updated[i] = { ...newLine, id: existing.id, speaker: existing.speaker }; // Keep original speaker if new is generic
                    return updated;
                }

                // 3. Suffix / Overlap Match (Streaming text case)
                // Old: "Hello world this is"
                // New: "world this is a test"
                // This happens when the caption window scrolls.
                // We check if the *start* of the new line matches the *end* of the old line.
                
                // Helper to check overlap
                // We only care if the overlap is significant (> 5 chars)
                const overlapCheck = (oldText: string, newText: string): boolean => {
                    const minOverlap = 8;
                    const maxCheck = Math.min(oldText.length, newText.length);
                    // Check suffixes of oldText against prefixes of newText
                    for (let len = maxCheck; len >= minOverlap; len--) {
                        if (oldText.endsWith(newText.substring(0, len))) {
                             // Found overlap!
                             // However, we only want to merge if newText adds something.
                             return true;
                        }
                    }
                    return false;
                }

                // 4. Fuzzy / Correction Match (Caption changed slightly)
                // Old: "Hello world thes is"
                // New: "Hello world this is"
                // We can use a simple substring contains check for stability
                const commonLength = Math.min(existing.text.length, newLine.text.length);
                if (commonLength > 10) {
                     const oldSub = existing.text.substring(0, 10);
                     const newSub = newLine.text.substring(0, 10);
                     if (oldSub === newSub) {
                         // Starts same, assume update
                         updated[i] = { ...newLine, id: existing.id, speaker: existing.speaker };
                         return updated;
                     }
                }
            }
        }
        
        return [...prev, newLine];
      });
    });

    // Auto-start recording when running as an extension so captions begin without a manual click
    if (observerRef.current && isExtension) {
      observerRef.current.start();
      setIsRecording(true);
    }

    return () => {
      observerRef.current?.stop();
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      observerRef.current?.stop();
      setIsRecording(false);
    } else {
      observerRef.current?.start();
      setIsRecording(true);
      // If running locally (not in extension), simulate data for preview
      if (!isExtension) {
        simulateCaptions();
      }
    }
  };

  /* 
   * Enhanced Download/Export Handler
   * Now supporting: TXT, PDF, MD, and AI Prompt Copy
   */
  const handleDownload = (format: 'txt' | 'pdf' | 'md' | 'ai-prompt' = 'txt') => {
    const timestamp = new Date().toISOString().split('T')[0];

    // AI Prompt Mode (Copy to Clipboard)
    if (format === 'ai-prompt') {
        const transcriptText = transcript.map(line => `[${line.timestamp}] ${line.speaker}: ${line.text}`).join('\n');
        const prompt = `Please analyze the following transcript and generate a structured "Minutes of Meeting" (MOM) document.
        
Includes:
1. 📅 Meeting Summary (Context & Goal)
2. ✅ Key Agreements & Decisions
3. 👣 Action Items (Who needs to do what)
4. 📌 Important Notes

Transcript:
${transcriptText}
`;
        navigator.clipboard.writeText(prompt);
        // Visual feedback could be added here, but for now relying on the user pasting it
        // Maybe trigger a small toast or reuse the "copied" state from controls if we lifted it up, 
        // but for now simple action is fine.
        alert("Copied AI Prompt to Clipboard! \n\nPaste this into ChatGPT or Gemini to get your MOM.");
        return;
    }
    
    // PDF Mode
    if (format === 'pdf') {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(16);
        doc.text(`Transkrypt Session - ${timestamp}`, 10, 10);
        
        // Content
        doc.setFontSize(10);
        let y = 20;
        
        transcript.forEach((line) => {
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            
            const timeSpeaker = `[${line.timestamp}] ${line.speaker}:`;
            const text = line.text;
            
            doc.setFont('helvetica', 'bold');
            doc.text(timeSpeaker, 10, y);
            
            const textWidth = doc.getTextWidth(timeSpeaker);
            
            doc.setFont('helvetica', 'normal');
            
            // Simple approach for text wrapping
            const splitText = doc.splitTextToSize(text, 180);
            doc.text(splitText, 10, y + 5);
            
            y += 7 + (splitText.length * 4); // basic spacing
        });
        
        doc.save(`Transkrypt_${timestamp}.pdf`);
        setShowExportMenu(false);
        return; 
    }

    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'md') {
        content = `# Transcript - ${timestamp}\n\n` + transcript.map(line => `**${line.speaker}** (${line.timestamp}):\n> ${line.text}\n`).join('\n');
        mimeType = 'text/markdown';
        extension = 'md';
    } else {
        content = transcript.map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`).join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transkrypt_${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleClear = () => {
    setTranscript([]);
  };

  // Helper to simulate captions for local development
  const simulateCaptions = () => {
    const speakers = ['Alice', 'Bob', 'Charlie'];
    let count = 0;
    const interval = setInterval(() => {
      if (count > 5) {
        clearInterval(interval);
        return;
      }
      const speaker = speakers[Math.floor(Math.random() * speakers.length)];
      observerRef.current?.manualPush({
        id: crypto.randomUUID(),
        speaker,
        text: `This is a simulated caption sentence number ${count + 1}.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      count++;
    }, 2000);
  };

  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 16 });
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; initialLeft: number; initialTop: number }>({ 
    isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: position.x,
      initialTop: position.y
    };
    
    // Use window to catch events outside the shadow root context more reliably
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.initialLeft + dx,
      y: dragRef.current.initialTop + dy
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const handleCopyAll = () => {
    const content = transcript.map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`).join('\n');
    navigator.clipboard.writeText(content);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-white text-blue-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-100"
      >
        <img 
            src={chrome.runtime.getURL("assets/logo.png")} 
            alt="Transkrypt" 
            style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
        />
      </button>
    );
  }

  // Collapsed View
  if (isCollapsed) {
     return (
        <div
            data-capta-root
            className="capta-collapsed"
            style={{
                position: 'fixed',
                top: `${position.y}px`,
                left: `${position.x}px`,
                zIndex: 2147483647,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Expand Button (Draggable Handle) */}
            <div onMouseDown={handleMouseDown} className="cursor-move">
                <button 
                    onClick={() => setIsCollapsed(false)} 
                    className="btn-collapsed" 
                    title="Expand"
                    style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }} /* Blue-100/700 hover like */
                >
                    {/* Expand Icon (Chevron Left) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="11 17 6 12 11 7"></polyline>
                       <polyline points="18 17 13 12 18 7"></polyline>
                    </svg>
                </button>
            </div>

            {/* Mic Button */}
            <button 
                onClick={handleToggleRecording} 
                className={`btn-collapsed ${isRecording ? 'is-active' : ''}`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
            >
                {isRecording ? (
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#EF4444', borderRadius: '2px' }}></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                )}
            </button>

            {/* Export Button */}
            <button 
                onClick={() => handleDownload('txt')}
                disabled={transcript.length === 0}
                className="btn-collapsed"
                title="Export TXT"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>

            {/* Trash Button */}
            <button 
                onClick={handleClear} 
                disabled={transcript.length === 0}
                className="btn-collapsed hover:text-red-500 hover:bg-red-50"
                title="Clear Transcript"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
     );
  }

  // Expanded View
  return (
    <div
      data-capta-root
      className={`fixed w-96 max-h-[calc(100vh-2rem)] bg-white shadow-2xl rounded-xl flex flex-col z-[9999] border border-gray-200 font-sans transition-opacity duration-300 ${!isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        // dynamic positioning prevents using 'right' or 'bottom'
        width: '420px',
        maxHeight: 'calc(100vh - 40px)',
        height: '800px',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        // Styles are now handled mainly by content.tsx class injection, but keeping basic layout props here for safety
        zIndex: 2147483647
      }}
    >
      <div onMouseDown={handleMouseDown} className="cursor-move">
        <SidebarHeader 
            onClose={() => setIsCollapsed(true)} 
            itemCount={transcript.length} 
            showTimestamps={showTimestamps}
            onToggleTimestamps={() => setShowTimestamps(!showTimestamps)}
        />
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-gray-50 mb-0" data-capta-body data-capta-scroll>
        <TranscriptList transcript={transcript} showTimestamps={showTimestamps} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl" data-capta-controls>
        <Controls 
          isRecording={isRecording} 
          onToggleRecording={handleToggleRecording} 
          onDownload={handleDownload}
          onCopyAll={handleCopyAll}
          onClear={handleClear}
          hasData={transcript.length > 0}
          showExportMenu={showExportMenu}
          setShowExportMenu={setShowExportMenu}
        />
      </div>
    </div>
  );
};

export default App;
