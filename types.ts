export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  avatarColor?: string;
}

export interface ScraperConfig {
  platform: 'meet' | 'zoom' | 'unknown';
  captionContainerSelector: string;
}