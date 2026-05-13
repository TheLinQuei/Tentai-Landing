/**
 * Analytics Helper for Landing Page
 * Cloudflare Web Analytics Integration
 */

// Load analytics beacon dynamically (only if token is configured)
function initializeAnalytics() {
  // Check if token is configured
  if (!window.ANALYTICS_TOKEN || window.ANALYTICS_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('ℹ️ Analytics: No token configured. Set CLOUDFLARE_ANALYTICS_TOKEN to enable tracking.');
    return;
  }

  // Inject Cloudflare Web Analytics beacon
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({
    token: window.ANALYTICS_TOKEN
  }));
  
  document.head.appendChild(script);
  console.log('✅ Analytics: Cloudflare Web Analytics initialized');
}

// Track custom events
function trackEvent(eventName, metadata = {}) {
  if (!window.ANALYTICS_TOKEN || window.ANALYTICS_TOKEN === 'YOUR_TOKEN_HERE') {
    return; // Skip if analytics not configured
  }

  // Cloudflare Web Analytics will auto-track pageviews
  // Custom events can be logged and correlated via server logs if needed
  console.log(`📊 Event: ${eventName}`, metadata);
  
  // For more advanced tracking, you could:
  // 1. Use Cloudflare's custom event API (if available)
  // 2. Send to your own analytics endpoint
  // 3. Use navigator.sendBeacon for reliability
}

// Auto-track download button clicks
function setupDownloadTracking() {
  // Windows download
  document.querySelectorAll('a[href*="sol-calendar.exe"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('download_windows', { 
        platform: 'windows',
        source: 'landing_page'
      });
    });
  });

  // Android download
  document.querySelectorAll('a[href*="sol-calendar"]').forEach(link => {
    if (link.href.includes('.apk')) {
      link.addEventListener('click', () => {
        trackEvent('download_android', { 
          platform: 'android',
          source: 'landing_page'
        });
      });
    }
  });

  // Web app launch
  document.querySelectorAll('a[href*="app.html"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('open_web_app', { 
        source: 'landing_page'
      });
    });
  });

  // Console launch
  document.querySelectorAll('a[href*="/console/"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('open_console', { 
        source: 'landing_page'
      });
    });
  });

  // Feature section visibility (scroll tracking)
  const featuresSection = document.querySelector('#features');
  if (featuresSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackEvent('view_features', { 
            scrollDepth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
          });
          observer.unobserve(entry.target); // Track only once
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(featuresSection);
  }

  // About section visibility
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackEvent('view_about', { 
            scrollDepth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(aboutSection);
  }

  console.log('✅ Download tracking initialized');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    setupDownloadTracking();
  });
} else {
  initializeAnalytics();
  setupDownloadTracking();
}
