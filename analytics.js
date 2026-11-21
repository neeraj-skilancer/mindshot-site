/*
 * Mindshot website analytics.
 *
 * Nothing is loaded until the visitor clicks "Accept" in the consent banner.
 * The choice is kept in localStorage ("ms-consent": "granted" | "denied") and can be
 * changed any time from the "Cookie settings" link in the footer (any element with
 * data-ms-consent-open).
 *
 * Tools:
 *   - Google Analytics 4 (GA_ID)
 *   - PostHog (POSTHOG_KEY). Leave the key empty to skip PostHog.
 *
 * Events:
 *   - page views (both tools, automatic)
 *   - play_store_click: any click on a Google Play link, with the link's position on the page
 */
(function () {
  var GA_ID = 'G-2JHH1WQRXF';
  var POSTHOG_KEY = 'phc_uJxjtbDTTwVgDAWqcHe8Wbus8pj9Ld35Z97Phkh3BVTQ'; // public project key; empty = PostHog off
  var POSTHOG_HOST = 'https://us.i.posthog.com';
  var STORE_KEY = 'ms-consent';

  function readChoice() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { localStorage.setItem(STORE_KEY, value); } catch (e) { /* private mode: ask again next visit */ }
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    // Google Analytics 4
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    // PostHog
    if (POSTHOG_KEY) {
      /* eslint-disable */
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      /* eslint-enable */
      window.posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, person_profiles: 'identified_only' });
    }
  }

  function track(name, props) {
    if (!loaded) return;
    if (window.gtag) window.gtag('event', name, props);
    if (window.posthog && POSTHOG_KEY) window.posthog.capture(name, props);
  }

  // Record clicks on Google Play links ("downloads" intent).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="play.google.com"]');
    if (!a) return;
    var where = a.getAttribute('data-placement') || (a.closest('[id]') || {}).id || 'page';
    track('play_store_click', { placement: where, page: location.pathname });
  });

  // ---- Consent banner ----
  var css = '' +
    '.ms-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:520px;margin:0 auto;' +
    'background:#1C1B22;color:#ECEBF3;border-radius:14px;padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.25);' +
    'font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.ms-consent p{margin:0 0 12px;color:#ECEBF3}.ms-consent a{color:#A5B4FC}' +
    '.ms-consent .ms-row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}' +
    '.ms-consent button{font:inherit;font-weight:600;border-radius:999px;padding:8px 16px;cursor:pointer;border:1px solid #5B5A66;background:transparent;color:#ECEBF3}' +
    '.ms-consent button.ms-yes{background:#4338CA;border-color:#4338CA;color:#fff}';

  // Remove Google Analytics and PostHog cookies when someone declines after accepting.
  function clearCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_gid|ph_)/.test(name)) return;
      ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
    try {
      Object.keys(localStorage).forEach(function (k) { if (/^ph_/.test(k)) localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
  }

  function showBanner() {
    if (document.querySelector('.ms-consent')) return;
    if (!document.getElementById('ms-consent-css')) {
      var st = document.createElement('style');
      st.id = 'ms-consent-css';
      st.textContent = css;
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.className = 'ms-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = '<p>We use cookies to count visits and see which pages help people find Mindshot. ' +
      'Nothing is tracked unless you accept. <a href="/privacy/">Privacy policy</a></p>' +
      '<div class="ms-row"><button type="button" class="ms-no">Decline</button>' +
      '<button type="button" class="ms-yes">Accept</button></div>';
    box.querySelector('.ms-yes').onclick = function () { saveChoice('granted'); box.remove(); loadAnalytics(); };
    box.querySelector('.ms-no').onclick = function () {
      var wasLoaded = loaded;
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      if (window.posthog && POSTHOG_KEY) window.posthog.opt_out_capturing();
      saveChoice('denied');
      clearCookies();
      box.remove();
      if (wasLoaded) location.reload(); // stop scripts that are already running
    };
    document.body.appendChild(box);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ms-consent-open]');
    if (!t) return;
    e.preventDefault();
    showBanner();
  });

  function start() {
    var choice = readChoice();
    if (choice === 'granted') loadAnalytics();
    else if (choice === 'denied') clearCookies();
    else showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
