import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const { installPrompt, install, isInstalled, isIOS } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-banner-dismissed') === 'true'
  );
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setDismissed(true);
  };

  // Ne rien afficher si déjà installé ou dismissé
  if (isInstalled || dismissed) return null;

  // Ni prompt Android ni iOS → pas de bannière
  if (!installPrompt && !isIOS) return null;

  return (
    <>
      {/* ── Bannière principale ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid var(--border)',
        padding: '14px 16px', zIndex: 999,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'slideUp 0.3s ease',
      }}>
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        {/* Logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: '#1B6B4A', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22,
        }}>
          📍
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Installer EventHotline
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Accès rapide depuis votre écran d'accueil
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {installPrompt && (
            <button onClick={install} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'var(--brand-green)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <Download size={14} /> Installer
            </button>
          )}
          {isIOS && !installPrompt && (
            <button onClick={() => setShowIOSGuide(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'var(--brand-green)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <Smartphone size={14} /> Comment ?
            </button>
          )}
          <button onClick={dismiss} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface-2)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={15} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      {/* ── Guide iOS ── */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1000, padding: 0,
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 36px', width: '100%',
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Installer sur iPhone / iPad</h3>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { step: '1', icon: '📤', text: 'Appuyez sur l\'icône Partager en bas de Safari' },
                { step: '2', icon: '➕', text: 'Faites défiler et tapez "Sur l\'écran d\'accueil"' },
                { step: '3', icon: '✅', text: 'Confirmez en appuyant sur "Ajouter"' },
              ].map(({ step, icon, text }) => (
                <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#E8F5EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>{icon}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-green)', display: 'block' }}>Étape {step}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowIOSGuide(false); dismiss(); }} style={{
              marginTop: 24, width: '100%', padding: '13px', borderRadius: 12,
              background: 'var(--brand-green)', color: '#fff', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 15,
            }}>
              J'ai compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}