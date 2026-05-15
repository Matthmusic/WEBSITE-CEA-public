// Must load synchronously (no defer) — catches browser-level promise rejections
// before deferred scripts register their handlers.
window.addEventListener('unhandledrejection', function (e) {
  if (e.reason instanceof DOMException && e.reason.name === 'AbortError' && e.reason.message === 'Transition was skipped') {
    e.preventDefault();
  }
});
