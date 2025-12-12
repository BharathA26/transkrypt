import { TranscriptLine } from '../types';

type Callback = (line: TranscriptLine) => void;

interface CaptionCandidate {
  speaker: string;
  text: string;
  confidence: number;
}

export class CaptionObserver {
  private observer: MutationObserver | null = null;
  private callback: Callback;
  private isObserving: boolean = false;
  private currentPlatform: 'meet' | 'zoom' | 'unknown' = 'unknown';
  // Cache the last emitted text to avoid duplicates during high-frequency mutation updates
  private lastEmittedText: string = '';
  private lastSpeaker: string = '';
  // New: Cache a potential "Next Speaker" if we find a standalone name block
  private contextSpeaker: { name: string, seenAt: number } | null = null; 

  constructor(callback: Callback) {
    this.callback = callback;
    this.detectPlatform();
  }

  private detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('meet.google.com')) {
      this.currentPlatform = 'meet';
    } else if (host.includes('zoom.us')) {
      this.currentPlatform = 'zoom';
    }
  }

  public start() {
    if (this.isObserving) return;

    this.observer = new MutationObserver((mutations) => {
      // Debounce logic or immediate handling? 
      // Captions come in bursts. We'll handle immediately but filter duplicates in emitLine.
      let shouldScrape = false;
      for (const mutation of mutations) {
         if ((mutation.type === 'childList' && mutation.addedNodes.length > 0) || 
             mutation.type === 'characterData') {
           shouldScrape = true;
           break;
         }
      }
      
      if (shouldScrape) {
        this.handleMutation();
      }
    });

    const config = { childList: true, subtree: true, characterData: true };
    
    const targetNode = document.body;
    if (targetNode) {
      this.observer.observe(targetNode, config);
      this.isObserving = true;
      console.log(`[Capta] Started observing on ${this.currentPlatform}`);
    }
  }

  public stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
    console.log('[Capta] Stopped observing');
  }

  public manualPush(line: TranscriptLine) {
    this.callback(line);
  }

  private handleMutation() {
    if (this.currentPlatform === 'meet') {
      this.scrapeGoogleMeet();
    } else if (this.currentPlatform === 'zoom') {
      this.scrapeZoom();
    }
  }

  private scrapeGoogleMeet() {
    // Strategy 1: Known Selectors
    const knownSelectors = [
      '.a4cQT', 
      'div[jscontroller="yyMqO"]', 
      'div[jsname="dsSSad"]', 
      '.iTTPOb', 
      '.ws-kSO', 
      'div[class*="caption-visual-line"]',
      '.VbkSUe' // Another common class for caption container
    ];

    let foundWithSelector = false;

    for (const selector of knownSelectors) {
      const containers = document.querySelectorAll(selector);
      if (containers.length > 0) {
        containers.forEach(container => {
           let speakerParams = this.extractSpeakerAndText(container as HTMLElement);
           
           // Double check if extract failed but text exists
           if (!speakerParams && container.textContent) {
               // Try falling back to simple text extraction if complex extraction failed
               const raw = container.textContent;
               if (raw.length > 0) {
                   speakerParams = { speaker: 'Unknown Speaker', text: raw };
               }
           }

           if (speakerParams && this.isValidCaption(speakerParams.text)) {
             foundWithSelector = true;
             this.emitLine(speakerParams.speaker, speakerParams.text);
           }
        });
      }
      // Don't break immediately, checking multiple selector types might be useful if they capture different things
    }

    // Strategy 2: Heuristic Fallback
    if (!foundWithSelector) {
        this.runHeuristicScraping();
    }
  }

  private isValidCaption(text: string): boolean {
      if (!text || text.length < 2) return false;
      
      // Filter out emails which often appear in pre-meeting screens
      if (text.includes('@') && !text.includes(' ')) return false; 

      // Blacklist of UI terms commonly found in the bottom bar
      const invalidPhrases = [
          'Turn off microphone', 
          'Turn on microphone',
          'Turn on camera',
          'Turn off camera',
          'Share screen',
          'Raise hand',
          'Turn on captions',
          'Turn off captions',
          'More options',
          'Leave call',
          'Audio settings',
          'Video settings',
          'Jump to bottom',
          'Meeting details',
          'People',
          'format_size',
          'Font size',
          'Font color',
          'Open caption settings',
          'Chat with everyone',
          'Activities',
          'language:', 
          'language',
          'can now join this meeting', // System noise
          'Joined as',                 // System noise
          'left the meeting',           // System noise
          'No camera found',
          'Ready to join?',
          'No one else is here',
          'Camera is starting',
          'mic_none',
          'videocam',
          'FaceTime HD Camera',
          'External Microphone',
          'External Headphones',
          'Join now',
          'Other ways to join',
          'expand_more',
          'Switch account',
          'Your camera is on',
          'Your microphone is on',
          'Your camera is off',
          'Your microphone is off',
          'Camera is off',
          'have joined the call',
          'Your hand is lowered',
          'AM:', 'PM:', // Timestamp noise often scraped alone
          'close', 'Close',
          'Looking for others',
          'Admit', 'View',
          'Someone wants to join',
          'Present now',
          'Stop presenting',
          'You are presenting',
          'Stop sharing',
          'Others might still see your full video'
      ];

      for (const phrase of invalidPhrases) {
          if (text.includes(phrase)) return false;
      }

      // Specific filtering for the "Language" list noise which usually follows a specific pattern
      if (text.includes('language:') || (text.includes('English') && text.includes('Spanish') && text.includes('French'))) {
          return false;
      }

      // Check for language list (if it contains multiple language markers)
      const languageMarkers = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Russian', 'Arabic'];
      let langCount = 0;
      for (const lang of languageMarkers) {
          if (text.includes(lang)) langCount++;
      }
      if (langCount > 1) return false; 

      return true;
  }

  private extractSpeakerAndText(container: HTMLElement): { speaker: string, text: string } | null {
      // 1. Try to find an image which often indicates the speaker avatar
      const img = container.querySelector('img');
      let speaker = '';
      if (img && img.alt) {
          speaker = img.alt;
      }

      // 2. Identify speaker by structure
      if (!speaker) {
          // Heuristic: Check for spaced out caps name like "D E E P A K"
          // This often appears as the first block of text.
          const fullText = container.innerText || '';
          
          const spacedNameMatch = fullText.match(/^([A-Z] )+([A-Z]) /);
          if (spacedNameMatch) {
               speaker = spacedNameMatch[0].trim();
          } else {
              // Standard name splitting (first line or bold element)
              const lines = fullText.split(/[\n\r]/);
              const potentialName = lines[0].trim();
              if (potentialName.length > 0 && potentialName.length < 30) {
                  speaker = potentialName;
               }
          }
      }
      
      if (!speaker) speaker = 'Unknown Speaker';

      // 3. Extract text
      let text = container.innerText || container.textContent || '';
      
      // Text Cleaning
      if (text.startsWith(speaker)) {
          text = text.substring(speaker.length).trim();
      }
      
      const speakerRegex = new RegExp(`^${this.escapeRegExp(speaker)}`, 'i');
      text = text.replace(speakerRegex, '').trim();
      
      text = text.replace(/[\n\r]+/g, ' ').trim();

      if (text.length > 0) {
          return { speaker, text };
      }
      return null;
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private runHeuristicScraping() {
      // Relaxed Heuristics: Don't restrict only to bottom 25%. Some layouts put captions elsewhere.
      // But we still want to avoid capturing the entire chat or sidebar.
      
      const candidates = document.querySelectorAll('div, span');
      
      candidates.forEach(element => {
          const el = element as HTMLElement;
          const rawText = el.innerText || '';
          
          // Ignore empty or super long blocks (e.g. transcript logs)
          if (rawText.length === 0 || rawText.length > 300) return;
          if (el.childElementCount > 1) return; // Leaf nodes preferred
          
          if (!this.isValidCaption(rawText)) return;

          const rect = el.getBoundingClientRect();
          // Filter out hidden elements
          if (rect.width === 0 || rect.height === 0) return;
          
          // Filter out buttons / tiny elements
          if (el.closest('button') || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return;
          
          // Heuristic: Captions are usually centered-ish or at least not tiny side labels
          if (rect.width < 100) return; 

          let speaker = 'Unknown Speaker';
          let text = rawText;

          // Parsing Logic
          if (text.startsWith('You') && (text.length === 3 || text[3] === ' ' || text[3] === ':')) {
              speaker = 'You';
              text = text.substring(3).replace(/^[:\s]+/, '').trim();
          } else {
               // Context Speaker Logic:
               // If we previously found a "Name-like" block and now we have "Unknown Speaker", use the context.
               if (this.contextSpeaker) { // Removed 'speaker === "Unknown Speaker"' to allow context setting even if a speaker was found
                   const timeDiff = Date.now() - this.contextSpeaker.seenAt;
                   // Context is valid for 2 seconds
                   if (timeDiff < 2000) {
                       speaker = this.contextSpeaker.name;
                   }
               }
              
              const spacedNameMatch = text.match(/^([A-Z] )+([A-Z]) /);
              if (spacedNameMatch) {
                  speaker = spacedNameMatch[0].trim();
                  text = text.substring(speaker.length).trim();
              } else {
                  const colonIndex = text.indexOf(':');
                  if (colonIndex > 0 && colonIndex < 30) {
                      speaker = text.substring(0, colonIndex);
                      text = text.substring(colonIndex + 1).trim();
                  } else {
                      // Sibling Check Strategy for Google Meet
                      // Often the speaker is in a separate span just before the text
                      const prev = el.previousElementSibling as HTMLElement;
                      if (prev) {
                          const prevText = prev.innerText || '';
                          if (prevText.length > 0 && prevText.length < 40) {
                              speaker = prevText;
                          }
                      }
                      
                       // Parent's first child check (common container pattern)
                      // Container
                      //   -> Speaker Spans
                      //   -> Text Spans
                      if (speaker === 'Unknown Speaker' && el.parentElement) {
                          const siblings = Array.from(el.parentElement.children) as HTMLElement[];
                          const myIndex = siblings.indexOf(el);
                          if (myIndex > 0) {
                             const potentialSpeaker = siblings[0].innerText;
                             // Verify it's not just another line of text
                             if (potentialSpeaker && potentialSpeaker.length < 40 && !this.isValidCaption(potentialSpeaker)) {
                                 // If the "speaker" text itself looks like system noise or invalid caption, it might actually be the name (names are rarely system noise)
                                 // But wait, "Turn off mic" is noise. A name isn't.
                                 // Let's assume valid names don't look like noise.
                                 // AND usually names don't have ":" or digits in them in standard meetings (heuristic)
                                 speaker = potentialSpeaker;
                             } else if (potentialSpeaker && potentialSpeaker.length < 40) {
                                 // Standard name check
                                 speaker = potentialSpeaker;
                             }
                          }
                          
                          // Parent of Parent Check (Grandparent) (Deep Search)
                          if (speaker === 'Unknown Speaker' && el.parentElement.parentElement) {
                               const gp = el.parentElement.parentElement;
                               // Try to find any child of GP that comes *before* our parent, that looks like a name
                               const gpChildren = Array.from(gp.children) as HTMLElement[];
                               const parentIndex = gpChildren.indexOf(el.parentElement);
                               
                               if (parentIndex > 0) {
                                   const potentialGpSpeaker = gpChildren[0].innerText;
                                    if (potentialGpSpeaker && potentialGpSpeaker.length < 40 && potentialGpSpeaker.length > 2) {
                                        speaker = potentialGpSpeaker;
                                    }
                               }
                          }
                      }
                  }
              }
          }
          
          // Validate Speaker (reject if it contains noise)
          // This catches cases where the DOM gives us garbage as the "speaker"
          if (speaker !== 'Unknown Speaker' && speaker !== 'You') {
              // Check if speaker contains any blacklisted phrases
              const speakerLower = speaker.toLowerCase();
              if (speakerLower.includes('camera') || 
                  speakerLower.includes('microphone') ||
                  speakerLower.includes('might still see') ||
                  speakerLower.includes('join') ||
                  speakerLower.includes('someone wants') ||
                  speaker.length > 30) {
                  speaker = 'Unknown Speaker';
              }
          }
          
          // Special Handling for Standalone Names (Split Node Issue)
          // Clean text first (remove newlines, extra spaces)
          const cleanedText = text.replace(/[\n\r]+/g, ' ').trim();
          
          // Check if this looks like a name header
          const isNameLike = /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(cleanedText) || /^[A-Z\s]+$/.test(cleanedText);
          const isTooLong = cleanedText.length > 30;
          const isTooShort = cleanedText.length < 3;
          const hasPunctuation = /[.,:;!?]/.test(cleanedText);
          
          if (isNameLike && !isTooLong && !isTooShort && !hasPunctuation) {
               // This looks like a standalone name! Store it for the next caption.
               console.log(`[Capta] Detected speaker name: ${cleanedText}`);
               this.contextSpeaker = { name: cleanedText, seenAt: Date.now() };
               return; // Don't emit this line, it's just a name header
          }

          // Final sanity check: Speaker shouldn't be too long (it might be part of the sentence)
          if (speaker.length > 30) {
              speaker = 'Unknown Speaker';
              text = rawText; 
          }

          // Filter out very short text that is just numbers or single chars (often noise)
          if (text.length < 2) return;
          if (/^\d+:\d+$/.test(text.trim())) return; // "10:00" noise
          
          if (text.length > 0) {
            this.emitLine(speaker, text);
          }
      });
  }

  private scrapeZoom() {
    const captionWindow = document.querySelector('.caption-window, .meeting-app-caption-window, .livestream-caption-window');
    if (captionWindow) {
      let text = captionWindow.textContent || '';
      let speaker = 'Zoom Participant';

      if (text.includes(':')) {
        const parts = text.split(':');
        speaker = parts[0].trim();
        text = parts.slice(1).join(':').trim();
      }

      if (text.length > 0) {
        this.emitLine(speaker, text);
      }
    }
  }

  private emitLine(speaker: string, text: string) {
    if (!text || text.length === 0) return;

    // Deduplication logic (Stream Level)
    
    // 1. Exact match with last emitted
    if (this.lastEmittedText === text && this.lastSpeaker === speaker) return;

    // 2. Prefix Match (Extension)
    // Old: "Hello"
    // New: "Hello world"
    if (this.lastSpeaker === speaker && text.startsWith(this.lastEmittedText)) {
         // This is a stable update. We emit it, and the UI will merge it (via App.tsx logic).
    }

    // 3. Substring / Stability Check (Aggressive)
    // If the new text is contained within the last emitted text, it's a "flicker" or "jitter" -> Ignore
    // Old: "Hello world"
    // New: "Hello" (jitter)
    if (this.lastSpeaker === speaker && this.lastEmittedText.includes(text)) {
        return; 
    }

    // 4. Overlap Check (Scrolling text)
    // Old: ... "brown fox"
    // New: "fox jumps over"
    // We update the local state but let the UI handle the merging if they are distinct events.
    // However, if the overlap is substantial (nearly all of it), it might be a double scrape.
    
    this.lastEmittedText = text;
    this.lastSpeaker = speaker;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    this.callback({
      id: crypto.randomUUID(),
      speaker: speaker,
      text: text,
      timestamp: timestamp,
      avatarColor: this.getColorForSpeaker(speaker)
    });
  }

  private getColorForSpeaker(speaker: string): string {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}