/* Registers the service worker in production-like contexts only.
 * Skipped on the Astro dev server (port 4321) so HMR is never intercepted.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return;
  }
  if (location.port === '4321') return; // astro dev

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
      /* PWA support is a progressive enhancement — never break the page. */
    });
  });
})();
