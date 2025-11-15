// Visitor tracking utility
const API_URL = import.meta.env.VITE_API_URL;

// Generate or retrieve session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

// Parse user agent to extract browser, OS, and device info
function parseUserAgent() {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('SamsungBrowser') > -1) {
    browser = 'Samsung Internet';
    browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Trident') > -1) {
    browser = 'Internet Explorer';
    browserVersion = ua.match(/rv:([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
    browser = 'Edge';
    browserVersion = ua.match(/(?:Edge|Edg)\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
  }
  
  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.indexOf('Win') > -1) {
    os = 'Windows';
    if (ua.indexOf('Windows NT 10.0') > -1) osVersion = '10';
    else if (ua.indexOf('Windows NT 6.3') > -1) osVersion = '8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) osVersion = '8';
    else if (ua.indexOf('Windows NT 6.1') > -1) osVersion = '7';
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS';
    osVersion = ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.indexOf('X11') > -1) {
    os = 'UNIX';
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android';
    osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    os = 'iOS';
    osVersion = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  }
  
  // Detect device type
  let device = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    device = 'mobile';
  }
  
  return { browser, browserVersion, os, osVersion, device };
}

// Track visitor
export async function trackVisitor(page = window.location.pathname) {
  try {
    const sessionId = getSessionId();
    const { browser, browserVersion, os, osVersion, device } = parseUserAgent();
    
    const visitorData = {
      sessionId,
      page,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      language: navigator.language,
      languages: navigator.languages || [navigator.language],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    // Send to server (fire and forget - don't wait for response)
    fetch(`${API_URL}/track-visitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visitorData)
    }).catch(err => {
      // Silently fail - tracking should not break the app
      console.debug('Visitor tracking failed:', err);
    });
  } catch (error) {
    console.debug('Error tracking visitor:', error);
  }
}

// Send heartbeat to track active time on page
async function sendHeartbeat(sessionId, page) {
  try {
    fetch(`${API_URL}/visitor-heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId, page })
    }).catch(() => {
      // Silently fail
    });
  } catch (error) {
    // Silently fail
  }
}

// Initialize tracking
export function initializeTracking() {
  let lastTrackedPath = null;
  let lastTrackTime = 0;
  let heartbeatInterval = null;
  const sessionId = getSessionId();
  
  const trackIfNeeded = (currentPath = window.location.pathname) => {
    const now = Date.now();
    // Only track if path changed OR if 30+ seconds passed since last track
    if (currentPath !== lastTrackedPath || now - lastTrackTime > 30000) {
      lastTrackedPath = currentPath;
      lastTrackTime = now;
      trackVisitor(currentPath);
      
      // Start/restart heartbeat for this page
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      heartbeatInterval = setInterval(() => {
        sendHeartbeat(sessionId, currentPath);
      }, 10000); // Every 10 seconds
    }
  };
  
  // Track initial page load
  if (document.readyState === 'complete') {
    trackIfNeeded();
  } else {
    window.addEventListener('load', () => trackIfNeeded());
  }
  
  // Track navigation changes (for SPAs)
  let lastPath = window.location.pathname;
  const checkPathChange = () => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      trackIfNeeded(currentPath);
    }
  };
  
  // Check for path changes every 2 seconds (less frequent)
  setInterval(checkPathChange, 2000);
  
  // Also track on popstate (browser back/forward)
  window.addEventListener('popstate', () => trackIfNeeded());
  
  // Stop heartbeat when user leaves the page
  window.addEventListener('beforeunload', () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });
}
