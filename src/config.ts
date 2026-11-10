/**
 * Configuration for ALIZA AI frontend client.
 * In a web browser hosted alongside server.ts, API_BASE is empty string (relative URL /api/*).
 * In an Android APK built with Capacitor, API_BASE points to the deployed backend server URL.
 */
export const API_BASE: string = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
