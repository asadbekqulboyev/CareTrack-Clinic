/**
 * CareTrack MRMS - Frontend config
 *
 * API_BASE rules:
 *   - On localhost  → use same-origin '/api' (Express serves both)
 *   - On Netlify    → set API_URL meta tag in HTML, or hard-code your deployed backend URL below
 *
 * To deploy: replace REMOTE_API_URL with your actual backend URL (e.g. https://caretrack-api.onrender.com/api)
 */
(function () {
  const REMOTE_API_URL = 'https://YOUR-BACKEND-URL.onrender.com/api'; // ← CHANGE ME after deploying backend

  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const API_BASE = isLocal ? '/api' : REMOTE_API_URL;

  window.CARETRACK_CONFIG = {
    API_BASE,
    APP_NAME: 'CareTrack Clinic',
    TOKEN_KEY: 'caretrack_token',
    USER_KEY: 'caretrack_user',
  };
})();
