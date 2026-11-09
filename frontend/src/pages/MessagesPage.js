import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagingAPI } from '../api/messagingAPI';
import { Send, MessageSquare, MapPin, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-CI', { weekday: 'short' });
  return d.toLocaleDateString('fr-CI', { day: 'numeric', month: 'short' });
}

function Avatar({ user, size = 36 }) {
  const initial = (user?.first_name || user?.username || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--brand-green)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conv');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await messagingAPI.getConversations();
      const list = data.results || data;
      setConversations(list);

      // Auto-open from URL param or first conversation
      if (initialConvId && !activeConv) {
        const found = list.find(c => String(c.id) === String(initialConvId));
        if (found) setActiveConv(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    messagingAPI.getMessages(activeConv.id)
      .then(({ data }) => {
        setMessages(data.results || data);
        // Update unread count in conversation list
        setConversations(prev => prev.map(c =>
          c.id === activeConv.id ? { ...c, unread_count: 0 } : c
        ));
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }, [activeConv]);

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5s when a conversation is open
  useEffect(() => {
    if (!activeConv) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await messagingAPI.getMessages(activeConv.id);
        const newMsgs = data.results || data;
        setMessages(prev => {
          if (JSON.stringify(prev.map(m => m.id)) !== JSON.stringify(newMsgs.map(m => m.id))) {
            return newMsgs;
          }
          return prev;
        });
      } catch (_) {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const { data } = await messagingAPI.sendMessage(activeConv.id, newMessage.trim());
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      // Refresh conversation list to update last_message
      loadConversations();
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    navigate('/connexion');
    return null;
  }

  const otherParty = (conv) => user?.id === conv?.client?.id ? conv?.manager_detail : conv?.client_detail;

  const filteredConvs = conversations.filter(c => {
    const other = otherParty(c);
    const name = `${other?.first_name || ''} ${other?.last_name || ''}`.toLowerCase();
    const venue = (c.venue_detail?.name || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || venue.includes(q);
  });

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', background: 'var(--surface)' }}>

      {/* ── LEFT: conversation list ── */}
      <div style={{
        width: 320, flexShrink: 0, background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Messages</h2>
            {conversations.reduce((s, c) => s + (c.unread_count || 0), 0) > 0 && (
              <span style={{ background: 'var(--brand-green)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>
                {conversations.reduce((s, c) => s + (c.unread_count || 0), 0)}
              </span>
            )}
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              {search ? 'Aucun résultat' : 'Aucune conversation'}
              {!search && (
                <p style={{ marginTop: 8, fontSize: 12 }}>
                  Contactez un gestionnaire depuis la fiche d'un lieu.
                </p>
              )}
            </div>
          ) : (
            filteredConvs.map(conv => {
              const other = otherParty(conv);
              const isActive = activeConv?.id === conv.id;
              const lastMsg = conv.last_message;
              const hasUnread = (conv.unread_count || 0) > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  style={{
                    width: '100%', padding: '12px 16px', textAlign: 'left',
                    background: isActive ? '#E8F5EE' : '#fff',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    borderLeft: `4px solid ${isActive ? 'var(--brand-green)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar user={other} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {other?.first_name} {other?.last_name}
                        </span>
                        {lastMsg && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 6 }}>
                            {formatTime(lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                        <MapPin size={9} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.venue_detail?.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: hasUnread ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {lastMsg ? lastMsg.body : 'Démarrer la conversation'}
                        </span>
                        {hasUnread && (
                          <span style={{ background: 'var(--brand-green)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: chat window ── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Avatar user={otherParty(activeConv)} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {otherParty(activeConv)?.first_name} {otherParty(activeConv)?.last_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} />
                <Link to={`/lieux/${activeConv.venue_detail?.slug}`} style={{ color: 'var(--brand-green)', fontWeight: 500 }}>
                  {activeConv.venue_detail?.name}
                </Link>
              </div>
            </div>
            <Link to={`/lieux/${activeConv.venue_detail?.slug}`} className="btn btn-ghost btn-sm">
              Voir le lieu
            </Link>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface)' }}>
            {loadingMsgs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 14 }}>Aucun message. Démarrez la conversation !</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.sender === user?.id || msg.sender_detail?.id === user?.id;
                const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1]?.created_at).toDateString();

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 12px', borderRadius: 20 }}>
                          {new Date(msg.created_at).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                      {!isMine && <Avatar user={msg.sender_detail} size={28} />}
                      <div style={{
                        maxWidth: '65%',
                        background: isMine ? 'var(--brand-green)' : '#fff',
                        color: isMine ? '#fff' : 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        border: isMine ? 'none' : '1px solid var(--border)',
                      }}>
                        <div>{msg.body}</div>
                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' })}
                          {isMine && <span style={{ marginLeft: 4 }}>{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="Écrivez votre message… (Entrée pour envoyer)"
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)',
                borderRadius: 20, fontSize: 14, fontFamily: 'inherit',
                resize: 'none', outline: 'none', lineHeight: 1.5,
                background: 'var(--surface)',
                maxHeight: 120, overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: newMessage.trim() ? 'var(--brand-green)' : 'var(--surface-3)',
                color: newMessage.trim() ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: 12 }}>
          <MessageSquare size={56} style={{ opacity: 0.15 }} />
          <p style={{ fontSize: 15, fontWeight: 500 }}>Sélectionnez une conversation</p>
          <p style={{ fontSize: 13 }}>ou contactez un gestionnaire depuis la fiche d'un lieu</p>
          <Link to="/lieux" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
            Explorer les lieux
          </Link>
        </div>
      )}
    </div>
  );
}