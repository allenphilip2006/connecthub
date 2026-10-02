import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initMessaging } from "./lib/firebaseMessaging";

// Suppress Chrome extension interference errors
const isExtensionError = (msg) => {
  if (typeof msg !== 'string') return false;
  return msg.includes('Could not establish connection') || 
         msg.includes('Receiving end does not exist') ||
         msg.includes('Extension context') ||
         msg.includes('chrome-extension');
};

window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || String(e.reason);
  if (isExtensionError(msg)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('error', e => {
  const msg = e.message || String(e.error);
  if (isExtensionError(msg)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

// Suppress runtime extension connection errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0]?.message || args[0] || '';
  if (isExtensionError(msg)) return;
  originalConsoleError.apply(console, args);
};

window.global = window;

const storedTheme = localStorage.getItem('theme');
const initialTheme = storedTheme === 'light' ? 'light' : 'dark';
document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Optional FCM messaging bootstrap - Fixed notification permission handling
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        initMessaging();
      }
    }).catch(err => console.warn("Notification permission error:", err));
  } else if (Notification.permission === 'granted') {
    initMessaging();
  }
}
