import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the specific entry point for the Chrome Extension Content Script
const init = () => {
  // Check if already injected
  if (document.getElementById('capta-extension-root')) return;

  // Create a host element for the shadow DOM
  const host = document.createElement('div');
  host.id = 'capta-extension-root';
  document.body.appendChild(host);

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  console.log('[Capta] Injecting UI');

  // Inject minimal, CSP-safe styles directly into the shadow root so the popup shows up even if remote CSS is blocked.
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    :host { all: initial; }
    [data-capta-root] {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 420px; /* max-w-md is approx 448px, but 400-420 is safer for extension */
      max-height: 800px;
      height: calc(100vh - 40px);
      background-color: #FFFFFF; /* card-light */
      border: 1px solid #E5E7EB; /* border-gray-200 */
      border-radius: 1rem;       /* rounded-2xl */
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483647;
      color: #111827; /* text-gray-900 */
      font-family: "Inter", system-ui, -apple-system, sans-serif;
    }
    
    [data-capta-root] * { box-sizing: border-box; margin: 0; padding: 0; }
    
    /* Scrollbar */
    [data-capta-scroll]::-webkit-scrollbar { width: 6px; }
    [data-capta-scroll]::-webkit-scrollbar-track { background: transparent; }
    [data-capta-scroll]::-webkit-scrollbar-thumb { background-color: #D1D5DB; border-radius: 20px; }

    /* Header */
    [data-capta-header] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem; /* px-6 py-5 */
      background-color: #FFFFFF;
      border-bottom: 1px solid #F3F4F6; /* border-gray-100 */
      flex-shrink: 0;
    }
    
    /* Body */
    [data-capta-body] {
      flex: 1;
      overflow-y: auto;
      background-color: #FFFFFF;
      padding: 1.5rem; /* px-6 py-6 */
      display: flex;
      flex-direction: column;
      gap: 1.5rem; /* space-y-6 */
    }

    /* List Item */
    .capta-item { display: flex; gap: 1rem; /* gap-4 */ }
    .capta-avatar {
      width: 2.5rem; height: 2.5rem; /* w-10 h-10 */
      border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.875rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }
    .capta-content { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .capta-meta {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 0.25rem; /* mb-1 */
    }
    .capta-name { font-size: 0.875rem; font-weight: 600; color: #111827; }
    .capta-time { font-size: 0.75rem; color: #9CA3AF; }
    .capta-bubble {
      background-color: #F9FAFB; /* chat-bubble-light */
      border: 1px solid #F3F4F6; /* border-gray-100 */
      padding: 0.875rem; /* p-3.5 */
      border-radius: 1rem; /* rounded-2xl */
      border-top-left-radius: 0;
      color: #374151; /* text-gray-700 */
      font-size: 0.875rem; /* text-sm */
      line-height: 1.625; /* leading-relaxed */
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
    }

    /* Footer / Controls */
    [data-capta-footer] {
      background-color: #FFFFFF;
      border-top: 1px solid #F3F4F6;
      padding: 1.5rem; /* p-6 */
      flex-shrink: 0;
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1rem; /* mb-4 is roughly gap */
    }

    /* Buttons */
    .btn {
      display: flex; align-items: center; justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem; /* py-3 px-4 */
      border-radius: 0.75rem; /* rounded-xl */
      font-weight: 600;
      transition: all 0.2s;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-stop {
      background-color: #FEF2F2; /* danger-light */
      color: #EF4444; /* danger */
      border: 1px solid #FECACA; /* border-red-200 */
      width: 100%;
    }
    .btn-stop:hover { background-color: #FEE2E2; }
    
    .btn-start {
      background-color: #3B82F6; /* primary */
      color: white;
      border: 1px solid #2563EB;
      width: 100%;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
    }
    .btn-start:hover { background-color: #2563EB; }

    .btn-row { display: flex; gap: 0.75rem; }
    .btn-export {
      flex: 1;
      background-color: #FFFFFF;
      color: #3B82F6; /* primary */
      border: 1px solid #3B82F6;
      font-weight: 500;
      font-size: 0.875rem;
      padding: 0.625rem 1rem;
    }
    .btn-export:hover { background-color: #F9FAFB; }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; border-color: #E5E7EB; color: #9CA3AF; }

    .btn-icon {
      width: 3rem;
      background-color: #FFFFFF;
      color: #4B5563; /* text-gray-600 */
      border: 1px solid #E5E7EB; /* border-gray-200 */
      border-radius: 0.75rem;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-icon:hover { background-color: #F9FAFB; }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Icons */
    [data-capta-root] svg { flex-shrink: 0; }

    /* Collapsed State */
    [data-capta-root].capta-collapsed {
      width: 64px; /* w-16 */
      height: auto;
      max-height: none;
      padding: 0.75rem; /* p-3 */
      border-radius: 8px; /* rounded-lg (User requested 8px) */
      gap: 1rem; /* gap-4 */
      align-items: center;
    }
    
    .btn-collapsed {
      width: 2.5rem; height: 2.5rem; /* w-10 h-10 */
      border-radius: 8px; /* rounded-lg (User requested 8px) */
      display: flex; align-items: center; justify-content: center;
      background-color: #F3F4F6; /* bg-gray-100 */
      color: #4B5563; /* text-gray-600 */
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-collapsed:hover { background-color: #E5E7EB; color: #111827; }
    
    .btn-collapsed.is-active {
      background-color: #FEF2F2; color: #EF4444; border-color: #FECACA;
    }
    .btn-collapsed.is-active:hover { background-color: #FEE2E2; }
    
    .btn-collapsed:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  shadow.appendChild(styleTag);

  // Create React Root
  const rootDiv = document.createElement('div');
  rootDiv.id = 'shadow-root';
  shadow.appendChild(rootDiv);

  const root = ReactDOM.createRoot(rootDiv);
  root.render(
    <React.StrictMode>
      <App isExtension={true} />
    </React.StrictMode>
  );
};

// Delay init slightly to ensure DOM is ready
setTimeout(() => {
  try {
    init();
  } catch (err) {
    console.error('[Capta] Failed to init content script', err);
  }
}, 1000);
