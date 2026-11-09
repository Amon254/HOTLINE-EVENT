import { useState, useEffect } from 'react';

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // Détecter iOS (Safari)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Détecter si déjà installée
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(installed);

    // Écouter le prompt d'installation (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Service Worker : désactivé en développement (localhost) pour toujours voir le dernier code
    if ('serviceWorker' in navigator) {
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      } else {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => {
            console.log('[PWA] Service Worker enregistré:', reg.scope);
            setSwReady(true);
          })
          .catch((err) => console.warn('[PWA] SW non enregistré:', err));
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  return { installPrompt, install, isInstalled, isIOS, swReady };
}