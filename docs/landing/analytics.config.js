/**
 * Cloudflare Web Analytics Configuration
 * 
 * To enable analytics:
 * 1. Get your token from Cloudflare Dashboard → Analytics & Logs → Web Analytics
 * 2. Set CLOUDFLARE_ANALYTICS_TOKEN environment variable, OR
 * 3. Replace 'YOUR_TOKEN_HERE' below with your actual token
 * 
 * Privacy: Cloudflare Web Analytics is cookieless and privacy-first
 * - No personal data tracking
 * - No cross-site tracking
 * - GDPR/CCPA compliant by design
 */

const ANALYTICS_CONFIG = {
  // Cloudflare Web Analytics Token
  token: process.env.CLOUDFLARE_ANALYTICS_TOKEN || 'YOUR_TOKEN_HERE',
  
  // Enable/disable analytics (set to false to disable all tracking)
  enabled: true,
  
  // Custom events to track
  events: {
    downloadWindows: 'download_windows',
    downloadAndroid: 'download_android',
    openWebApp: 'open_web_app',
    viewFeatures: 'view_features',
    viewAbout: 'view_about',
    openConsole: 'open_console'
  }
};

// Export for use in landing page
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ANALYTICS_CONFIG;
}
