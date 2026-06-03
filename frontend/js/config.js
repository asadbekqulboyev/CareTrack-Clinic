/**
 * CareTrack MRMS - Frontend config
 * The frontend is served by the same Express server (locally and on Render),
 * so a relative '/api' base works in all environments.
 */
window.CARETRACK_CONFIG = {
  API_BASE: '/api',
  APP_NAME: 'CareTrack Clinic',
  TOKEN_KEY: 'caretrack_token',
  USER_KEY: 'caretrack_user',
};
