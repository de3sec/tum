(function() {
  'use strict';

  // Configuration
  const ANALYTICS_ENDPOINT = window.ANALYTICS_CONFIG?.endpoint || 'http://localhost:3000/api/tracking/collect';
  const TRACKING_ID = window.ANALYTICS_CONFIG?.trackingId;
  
  if (!TRACKING_ID) {
    console.warn('Analytics: No tracking ID provided');
    return;
  }

  // Session management
  let sessionId = null;
  let lastActivity = Date.now();
  let pageLoadTime = Date.now();
  let scrollDepth = 0;
  let maxScrollDepth = 0;
  let isBot = /bot|crawler|spider|crawling/i.test(navigator.userAgent);
  
  // Prevent tracking bots
  if (isBot) return;

  // Generate or retrieve session ID
  function getSessionId() {
    if (sessionId) return sessionId;
    
    const stored = sessionStorage.getItem('analytics_session');
    if (stored) {
      const session = JSON.parse(stored);
      if (Date.now() - session.created < 30 * 60 * 1000) { // 30 minutes
        sessionId = session.id;
        return sessionId;
      }
    }
    
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
    sessionStorage.setItem('analytics_session', JSON.stringify({
      id: sessionId,
      created: Date.now()
    }));
    
    return sessionId;
  }

  // Device and browser detection
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      deviceType: getDeviceType(ua),
      browserInfo: getBrowserInfo(ua),
      os: getOSInfo(ua),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1'
    };
  }

  function getDeviceType(ua) {
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getBrowserInfo(ua) {
    const browsers = [
      { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
      { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
      { name: 'Safari', regex: /Safari\/([0-9.]+)/ },
      { name: 'Edge', regex: /Edge\/([0-9.]+)/ },
      { name: 'Opera', regex: /Opera\/([0-9.]+)/ },
    ];

    for (const browser of browsers) {
      const match = ua.match(browser.regex);
      if (match) return { name: browser.name, version: match[1] };
    }
    return { name: 'Unknown', version: '0' };
  }

  function getOSInfo(ua) {
    if (/Windows NT/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/Android/i.test(ua)) return 'Android';
    if (/iOS|iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    return 'Unknown';
  }

  // Event sending
  function sendEvent(eventType, eventData = {}) {
    try {
      const payload = {
        trackingId: TRACKING_ID,
        sessionId: getSessionId(),
        eventType,
        eventData: {
          ...eventData,
          ...getDeviceInfo(),
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
          timestamp: Date.now()
        }
      };

      // Use sendBeacon if available, fallback to fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
      } else {
        fetch(ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {}); // Silently fail
      }
    } catch (e) {
      // Silently fail to avoid breaking the host site
    }
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Page view tracking
  function trackPageView() {
    sendEvent('pageview', {
      loadTime: Date.now() - pageLoadTime
    });
  }

  // Click tracking
  function trackClick(event) {
    const element = event.target;
    const rect = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    sendEvent('click', {
      x: event.clientX + scrollLeft,
      y: event.clientY + scrollTop,
      element: element.tagName.toLowerCase(),
      elementText: element.textContent?.slice(0, 100) || '',
      elementClasses: element.className || '',
      elementId: element.id || '',
      elementAttributes: {
        href: element.href || null,
        type: element.type || null,
        value: element.type === 'submit' ? 'submit_button' : null
      }
    });
  }

  // Scroll tracking
  function trackScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);

    sendEvent('scroll', {
      scrollDepth,
      maxScroll: maxScrollDepth,
      scrollTop,
      windowHeight,
      documentHeight
    });
  }

  // Form submission tracking
  function trackFormSubmit(event) {
    const form = event.target;
    const formData = new FormData(form);
    const fields = {};
    
    // Collect non-sensitive field names and types
    for (const [key, value] of formData.entries()) {
      if (!isSensitiveField(key)) {
        fields[key] = {
          type: form.elements[key]?.type || 'unknown',
          hasValue: !!value,
          length: value.toString().length
        };
      }
    }

    sendEvent('form_submit', {
      formId: form.id || '',
      formClasses: form.className || '',
      fieldCount: Object.keys(fields).length,
      fields
    });
  }

  function isSensitiveField(fieldName) {
    const sensitivePatterns = /password|ssn|social|credit|card|cvv|security|secret|token/i;
    return sensitivePatterns.test(fieldName);
  }

  // Resize tracking
  const trackResize = debounce(() => {
    sendEvent('resize', {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  }, 250);

  // Engagement tracking
  function updateEngagement() {
    lastActivity = Date.now();
  }

  // Time on page tracking
  function trackTimeOnPage() {
    const timeOnPage = Date.now() - pageLoadTime;
    const engagement = Date.now() - lastActivity;
    
    sendEvent('engagement', {
      timeOnPage,
      timeSinceLastActivity: engagement,
      maxScrollDepth,
      isActive: engagement < 30000 // Active if last activity was within 30 seconds
    });
  }

  // Initialize tracking
  function init() {
    // Track page view
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
      trackPageView();
    }

    // Add event listeners
    document.addEventListener('click', trackClick, true);
    document.addEventListener('submit', trackFormSubmit, true);
    window.addEventListener('scroll', throttle(trackScroll, 250), { passive: true });
    window.addEventListener('resize', trackResize, { passive: true });
    
    // Activity tracking
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateEngagement, { passive: true });
    });

    // Send engagement data periodically
    setInterval(trackTimeOnPage, 15000); // Every 15 seconds

    // Track page unload
    window.addEventListener('beforeunload', () => {
      trackTimeOnPage();
      sendEvent('page_exit', {
        timeOnPage: Date.now() - pageLoadTime,
        maxScrollDepth
      });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        sendEvent('page_hidden', { timeVisible: Date.now() - pageLoadTime });
      } else {
        pageLoadTime = Date.now(); // Reset for new session
        sendEvent('page_visible');
      }
    });
  }

  // Custom event tracking API
  window.analytics = {
    track: function(eventName, properties = {}) {
      sendEvent('custom', {
        eventName,
        properties
      });
    },
    
    identify: function(userId, traits = {}) {
      sessionStorage.setItem('analytics_user', JSON.stringify({ userId, traits }));
      sendEvent('identify', { userId, traits });
    },

    page: function(name, properties = {}) {
      sendEvent('pageview', { 
        pageName: name,
        properties,
        loadTime: Date.now() - pageLoadTime
      });
    }
  };

  // Start tracking
  init();

})(); 