import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messagingAPI } from '../../api/messagingAPI';
import toast from 'react-hot-toast';

export default function ContactManagerButton({ venue }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleOpen = () => {
    if (!user) { navigate('/connexion'); return; }
    if (user.role === 'manager' && user.id === venue.manager?.id) {
      toast('Vous êtes le gestionnaire de ce lieu'); return;
    }
    setOpen(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Écrivez un message'); return; }
    setSending(true);
    try {
      const { data } = await messagingAPI.startConversation(venue.id, message.trim());
      toast.success('Message envoyé !');
      setOpen(false);
      setMessage('');
      navigate(`/messages?conv=${data.id}`);
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={handleOpen}
        className="btn btn-secondary"
        style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <MessageSquare size={16} /> Contacter le gestionnaire
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28,
            width: '100%', maxWidth: 480,
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Contacter le gestionnaire</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {venue.manager?.first_name} {venue.manager?.last_name} · {venue.name}
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {/* Quick message suggestions */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Suggestions rapides :</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'Bonjour, est-ce que le lieu est disponible ?',
                  'Quels sont vos tarifs pour un mariage ?',
                  'Pouvez-vous m\'envoyer plus de photos ?',
                  'Je voudrais organiser une conférence.',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12,
                      border: '1.5px solid var(--border)',
                      background: message === suggestion ? '#E8F5EE' : '#fff',
                      color: message === suggestion ? 'var(--brand-green)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Écrivez votre message au gestionnaire…"
                rows={4}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--border)', borderRadius: 12,
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box', marginBottom: 14,
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }} disabled={sending}>
                  <Send size={15} />
                  {sending ? 'Envoi…' : 'Envoyer le message'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}