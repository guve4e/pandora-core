(function () {
  if (window.PandoraAnalytics && window.PandoraAnalytics.__initialized) {
    return;
  }

  var config = window.PandoraAnalyticsConfig || {};
  var apiBaseUrl = config.apiBaseUrl || '';
  var siteKey = config.siteKey || '';
  var autoPageViews = config.autoPageViews !== false;

  var VISITOR_KEY = 'pl_analytics_visitor_id';
  var SESSION_KEY = 'pl_analytics_session_id';

  var lastTrackedPath = null;
  var lastTrackedAt = 0;
  var PAGE_VIEW_DEDUPE_MS = 800;

  var navTimeout = null;

  function warn() {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn.apply(console, arguments);
    }
  }

  function randomId(prefix) {
    return (
      prefix +
      '_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2)
    );
  }

  function getVisitorId() {
    try {
      var visitorId = localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = randomId('anon');
        localStorage.setItem(VISITOR_KEY, visitorId);
      }
      return visitorId;
    } catch (e) {
      return randomId('anon');
    }
  }

  function getSessionId() {
    try {
      var sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = randomId('sess');
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      return sessionId;
    } catch (e) {
      return randomId('sess');
    }
  }

  function buildPayload(events) {
    return {
      siteKey: siteKey,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      events: events,
    };
  }

  function sendEvents(events) {
    if (!apiBaseUrl || !siteKey) {
      warn('[PandoraAnalytics] missing apiBaseUrl or siteKey');
      return Promise.resolve();
    }

    return fetch(apiBaseUrl.replace(/\/$/, '') + '/public/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(events)),
    }).catch(function (error) {
      warn('[PandoraAnalytics] failed to send events', error);
    });
  }

  function track(eventName, properties, options) {
    options = options || {};

    return sendEvents([
      {
        type: options.type || 'click',
        eventName: eventName,
        occurredAt: new Date().toISOString(),
        pageUrl: window.location.href,
        pagePath: options.pagePath || window.location.pathname,
        referrer: document.referrer || undefined,
        elementId: options.elementId,
        elementText: options.elementText,
        properties: properties || {},
      },
    ]);
  }

  function shouldTrackPageView(path) {
    var now = Date.now();

    if (lastTrackedPath === path && now - lastTrackedAt < PAGE_VIEW_DEDUPE_MS) {
      return false;
    }

    lastTrackedPath = path;
    lastTrackedAt = now;
    return true;
  }

  function trackPageView(path) {
    var resolvedPath = path || window.location.pathname;

    if (!shouldTrackPageView(resolvedPath)) {
      return Promise.resolve();
    }

    return sendEvents([
      {
        type: 'page_view',
        eventName: 'page_view',
        occurredAt: new Date().toISOString(),
        pageUrl: window.location.href,
        pagePath: resolvedPath,
        referrer: document.referrer || undefined,
        properties: {
          title: document.title || '',
          path: resolvedPath,
        },
      },
    ]);
  }

  function schedulePageView(path) {
    if (navTimeout) {
      clearTimeout(navTimeout);
    }

    navTimeout = setTimeout(function () {
      requestAnimationFrame(function () {
        setTimeout(function () {
          trackPageView(path || window.location.pathname);
        }, 50);
      });
    }, 100);
  }

  function patchHistoryForSpaTracking() {
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    function afterNavigation() {
      schedulePageView(window.location.pathname);
    }

    history.pushState = function () {
      var result = originalPushState.apply(this, arguments);
      afterNavigation();
      return result;
    };

    history.replaceState = function () {
      var result = originalReplaceState.apply(this, arguments);
      afterNavigation();
      return result;
    };

    window.addEventListener('popstate', function () {
      afterNavigation();
    });

    window.addEventListener('hashchange', function () {
      afterNavigation();
    });
  }

  var api = {
    __initialized: true,
    init: function (nextConfig) {
      nextConfig = nextConfig || {};

      if (nextConfig.apiBaseUrl) apiBaseUrl = nextConfig.apiBaseUrl;
      if (nextConfig.siteKey) siteKey = nextConfig.siteKey;
      if (typeof nextConfig.autoPageViews === 'boolean') {
        autoPageViews = nextConfig.autoPageViews;
      }

      if (autoPageViews) {
        schedulePageView(window.location.pathname);
      }

      return api;
    },
    track: track,
    trackPageView: trackPageView,
    getVisitorId: getVisitorId,
    getSessionId: getSessionId,
  };

  window.PandoraAnalytics = api;
  patchHistoryForSpaTracking();

  if (apiBaseUrl && siteKey) {
    api.init();
  }
})();
