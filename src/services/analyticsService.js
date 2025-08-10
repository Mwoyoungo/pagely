// Simple analytics service for tracking user interactions
// This can be extended to integrate with Google Analytics, Mixpanel, or other services

class AnalyticsService {
  constructor() {
    this.events = [];
    this.isEnabled = true;
  }

  // Track user events
  track(eventName, properties = {}) {
    if (!this.isEnabled) return;
    
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      }
    };
    
    this.events.push(event);
    this.logEvent(event);
    
    // Send to external analytics if configured
    this.sendToExternalAnalytics(event);
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('pagepop_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('pagepop_session_id', sessionId);
    }
    return sessionId;
  }

  // Log event to console in development
  logEvent(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }
  }

  // Send to external analytics service (placeholder)
  sendToExternalAnalytics(event) {
    // This is where you would integrate with Google Analytics, Mixpanel, etc.
    // For now, we'll just store locally and could send to a backend endpoint
    
    // Example: Google Analytics 4 integration
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', event.name, event.properties);
    // }
    
    // Example: Send to backend
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error);
  }

  // Common tracking methods for PagePop
  trackPageView(pageName) {
    this.track('page_view', {
      page: pageName
    });
  }

  trackDocumentUpload(documentId, fileSize, uploadTime) {
    this.track('document_upload', {
      documentId,
      fileSize,
      uploadTime,
      fileSizeMB: Math.round(fileSize / 1024 / 1024 * 10) / 10
    });
  }

  trackDocumentOpen(documentId, source) {
    this.track('document_open', {
      documentId,
      source // 'feed', 'my_documents', 'direct_link'
    });
  }

  trackHighlightCreated(documentId, pageNumber) {
    this.track('highlight_created', {
      documentId,
      pageNumber
    });
  }

  trackVoiceExplanation(documentId, pageNumber, duration) {
    this.track('voice_explanation', {
      documentId,
      pageNumber,
      duration
    });
  }

  trackHelpRequest(documentId, pageNumber) {
    this.track('help_request', {
      documentId,
      pageNumber
    });
  }

  trackUserSignup(method) {
    this.track('user_signup', {
      method // 'google', 'email', etc.
    });
  }

  trackUserSignin(method) {
    this.track('user_signin', {
      method
    });
  }

  trackFeatureUsage(feature, action) {
    this.track('feature_usage', {
      feature, // 'floating_fab', 'demo_mode', 'mobile_menu', etc.
      action   // 'open', 'close', 'click', etc.
    });
  }

  trackError(error, context) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  // Get analytics data (for debugging or admin dashboard)
  getEvents() {
    return this.events;
  }

  // Clear stored events
  clearEvents() {
    this.events = [];
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;