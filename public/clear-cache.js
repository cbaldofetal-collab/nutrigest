// Limpar cache e service workers antigos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Limpar caches antigos
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
  });
}

// Forçar reload limpo
window.addEventListener('load', function() {
  if (window.location.search.indexOf('cleared=true') === -1) {
    window.location.href = window.location.href + '?cleared=true';
  }
});