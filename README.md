# Transkrypt

**Transkrypt** is a powerful Chrome Extension that records, transcribes, and organizes live captions from Google Meet and Zoom meetings in real-time. It provides a non-intrusive, draggable sidebar overlay that captures speech, identifies speakers, and allows for instant export of meeting transcripts.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 Key Features

- **Live Caption Capture**: Real-time extraction of captions from Google Meet and Zoom using intelligent DOM observation.
- **Smart Speaker Identification**: Automatically identifies speakers and attributes text correctly, even with interruption.
- **Draggable Overlay**: A sleek, non-intrusive sidebar that floats over your meeting window.
- **Multi-Format Export**:
  - 📄 **.TXT**: Plain text transcript.
  - 📑 **.PDF**: Formatted document.
  - 📝 **.MD**: Markdown file.
  - 🤖 **AI Prompt**: One-click copy formatted for ChatGPT/Gemini summarization.
- **Noise Filtering**: Advanced filtering to remove system messages, meeting codes, and non-speech artifacts.
- **Privacy First**: All processing happens locally in your browser. No data is sent to external servers.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd transkrypt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   This runs the standalone React app (useful for UI development).
   ```bash
   npm run dev
   ```

### Building the Chrome Extension

1. **Build the project**
   ```bash
   npm run build
   ```
   This will generate a `dist` folder containing the compiled extension.

2. **Load into Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** in the top right corner.
   - Click **"Load unpacked"**.
   - Select the `dist` folder from your project directory.

3. **Usage**
   - Open a Google Meet or Zoom web meeting.
   - Turn on captions in the meeting platform (CC button).
   - The Transkrypt sidebar will automatically appear.

## 🏗️ Project Structure

```
transkrypt/
├── App.tsx              # Main application logic & state management
├── content.tsx          # Chrome Extension content script (injected into pages)
├── index.tsx            # Standalone entry point for local dev
├── types.ts             # TypeScript interfaces and types
├── manifest.json        # Chrome Extension V3 manifest
├── components/          # UI Components
│   ├── Controls.tsx     # Play/Stop, Export, and Action buttons
│   ├── SidebarHeader.tsx # Header with logo and stats
│   └── TranscriptList.tsx # Scrollable list of captured captions
└── services/            # Core Services
    └── captionObserver.ts # Intelligent DOM scraper & mutation observer
```

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Direct CSS injection (Shadow DOM) for isolation
- **Extension**: Manifest V3
- **Export**: jsPDF

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
