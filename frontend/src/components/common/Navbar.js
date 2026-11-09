import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, User, LogOut, LayoutDashboard, PlusCircle, Crown, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messagingAPI } from '../../api/messagingAPI';
import apiClient from '../../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isPro, setIsPro] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setDropOpen(false); };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!user) return;
    const fetchBadges = async () => {
      try {
        const [msgRes, subRes] = await Promise.all([
          messagingAPI.getUnreadCount(),
          apiClient.get('/subscriptions/subscription/me/'),
        ]);
        setUnreadMessages(msgRes.data.unread || 0);
        setIsPro(subRes.data?.plan?.slug === 'pro' && subRes.data?.is_active);
      } catch (_) {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => { if (!e.target.closest('[data-dropdown]')) setDropOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropOpen]);

  const isAdmin = user?.is_staff || user?.role === 'admin';

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 20, color: 'var(--brand-green)' }}>
            EventHotline
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }} className="desktop-nav">
          {[
            { to: '/lieux',                  label: 'Explorer les lieux' },
            { to: '/carte',                  label: '🗺️ Carte' },
            { to: '/lieux?is_featured=true', label: 'Lieux vedettes' },
            { to: '/a-propos',               label: 'À propos' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '8px 13px', borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
              color: isActive(to) ? 'var(--brand-green)' : 'var(--text-secondary)',
              background: isActive(to) ? 'var(--surface-2)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {user ? (
            <>
              {/* Messages badge */}
              <Link to="/messages" title="Messages" style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)', border: '1.5px solid var(--border)',
                background: '#fff', transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-green)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <MessageSquare size={16} />
                {unreadMessages > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#dc2626', color: '#fff', borderRadius: '50%',
                    width: 16, height: 16, fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Admin shortcut */}
              {isAdmin && (
                <Link to="/admin" title="Panel Admin" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: '#0F2D1F', color: '#C9A84C',
                  border: 'none', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1B6B4A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0F2D1F'}
                >
                  <Shield size={16} />
                </Link>
              )}

              {/* Pro shortcut — managers only */}
              {user.role === 'manager' && !isPro && (
                <Link to="/abonnement" style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg,#C9A84C,#A07020)',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
                }}>
                  <Crown size={12} /> Passer Pro
                </Link>
              )}

              {/* User dropdown */}
              <div style={{ position: 'relative' }} data-dropdown>
                <button onClick={() => setDropOpen(!dropOpen)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)', background: 'var(--white)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isAdmin
                      ? '#0F2D1F'
                      : isPro
                        ? 'linear-gradient(135deg,#C9A84C,#A07020)'
                        : 'var(--brand-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', flexShrink: 0,
                  }}>
                    {isAdmin
                      ? <Shield size={13} color="#C9A84C" />
                      : <User size={14} color="#fff" />
                    }
                    {isPro && !isAdmin && (
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2, fontSize: 9,
                        background: '#C9A84C', borderRadius: '50%', width: 12, height: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid #fff',
                      }}>★</span>
                    )}
                  </div>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.first_name || user.username}
                  </span>
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 48,
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    minWidth: 230, overflow: 'hidden', zIndex: 200,
                    animation: 'fadeIn 0.12s ease',
                  }}>
                    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* User info header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: isAdmin ? '#0F2D1F' : 'var(--surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: isAdmin ? '#1B6B4A' : isPro ? 'linear-gradient(135deg,#C9A84C,#A07020)' : 'var(--brand-green)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isAdmin ? <Shield size={16} color="#C9A84C" /> : <User size={16} color="#fff" />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isAdmin ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.first_name} {user.last_name}
                          </div>
                          <div style={{ fontSize: 11, color: isAdmin ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {isAdmin ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(201,168,76,0.2)', color: '#C9A84C', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, letterSpacing: 0.5 }}>
                                <Shield size={8} /> ADMIN
                              </span>
                            ) : isPro ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg,#C9A84C,#A07020)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, letterSpacing: 0.5 }}>
                                <Crown size={8} /> PRO
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      ...(isAdmin ? [{ to: '/admin', icon: <Shield size={15} />, label: 'Panel Admin', admin: true }] : []),
                      { to: '/tableau-de-bord', icon: <LayoutDashboard size={15} />, label: 'Tableau de bord' },
                      ...(user.role === 'manager' ? [{ to: '/ajouter-lieu', icon: <PlusCircle size={15} />, label: 'Ajouter un lieu' }] : []),
                      { to: '/messages', icon: <MessageSquare size={15} />, label: 'Messages', badge: unreadMessages },
                      ...(user.role === 'manager' ? [{ to: '/abonnement', icon: <Crown size={15} />, label: isPro ? 'Mon abonnement' : 'Passer au Pro', gold: true }] : []),
                    ].map(({ to, icon, label, badge, gold, admin: adm }) => (
                      <Link key={to} to={to} onClick={() => setDropOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 16px', fontSize: 14, textDecoration: 'none',
                        color: adm ? '#0F2D1F' : gold ? '#A07020' : 'var(--text-secondary)',
                        fontWeight: adm || gold ? 700 : 400,
                        background: adm ? '#FFF8E7' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = adm ? '#FEF3C7' : 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = adm ? '#FFF8E7' : 'transparent'}
                      >
                        <span style={{ color: adm ? '#C9A84C' : gold ? '#C9A84C' : 'var(--text-muted)' }}>{icon}</span>
                        {label}
                        {badge > 0 && (
                          <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                            {badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    {/* Logout */}
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px', fontSize: 14, width: '100%',
                      color: '#dc2626', background: 'none', border: 'none',
                      borderTop: '1px solid var(--border)', cursor: 'pointer',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/inscription" className="btn btn-primary btn-sm">S'inscrire</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
      `}</style>
    </nav>
  );
}