import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, PlusCircle, Eye, Calendar, CheckCircle, XCircle, Lock, MessageSquare, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { venueAPI, reservationAPI } from '../api/venues';
import '../styles/premium.css';

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(Math.round(Number(n) || 0));
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const toList = (d) => (Array.isArray(d) ? d : d?.results || []);
const RES = {
  pending: ['En attente', 'amber'], confirmed: ['Confirmée', 'green'],
  cancelled: ['Annulée', 'red'], completed: ['Terminée', 'grey'],
};

function Pill({ status }) {
  const [label, tone] = RES[status] || [status, 'grey'];
  return <span className={`ph-pill ph-pill--${tone}`}>{label}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';
  const [tab, setTab] = useState('reservations');
  const [filter, setFilter] = useState('');
  const [venues, setVenues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const calls = [reservationAPI.getAll(), apiClient.get('/subscriptions/subscription/me/').catch(() => null)];
      if (isManager) calls.push(venueAPI.getMyVenues());
      const [r, s, v] = await Promise.all(calls);
      setReservations(toList(r.data));
      setSub(s?.data || null);
      if (v) setVenues(toList(v.data));
    } catch (_) { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }
    load();
  }, [user, navigate, load]);

  const isPro = sub?.plan?.slug === 'pro' && sub?.is_active;

  const setStatus = async (id, status) => {
    try {
      await reservationAPI.updateStatus(id, { status });
      toast.success(status === 'confirmed' ? 'Réservation confirmée' : status === 'cancelled' ? 'Réservation refusée' : 'Marquée terminée');
      load();
    } catch { toast.error('Action impossible'); }
  };

  const stats = useMemo(() => {
    const confirmed = reservations.filter((r) => ['confirmed', 'completed'].includes(r.status));
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[`${d.getFullYear()}-${d.getMonth()}`] = { label: d.toLocaleDateString('fr-CI', { month: 'short' }), n: 0 };
    }
    reservations.forEach((r) => {
      const d = new Date(r.created_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (months[k]) months[k].n += 1;
    });
    return {
      pending: reservations.filter((r) => r.status === 'pending').length,
      revenue: confirmed.reduce((s, r) => s + Number(r.total_price || 0), 0),
      views: venues.reduce((s, v) => s + (v.views_count || 0), 0),
      months: Object.values(months),
    };
  }, [reservations, venues]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

  const list = reservations.filter((r) => !filter || r.status === filter);
  const maxM = Math.max(1, ...stats.months.map((m) => m.n));
  const tabs = isManager
    ? [['reservations', 'Réservations'], ['venues', 'Mes lieux'], ['analytics', 'Statistiques']]
    : [['reservations', 'Mes demandes']];

  return (
    <div className="ph-page">
      <div className="ph-dash-head">
        <div className="ph-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span className="ph-eyebrow" style={{ color: '#C9A84C' }}>{isManager ? 'Espace gestionnaire' : 'Mon espace'}</span>
            <h1 className="ph-serif" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.3rem)', margin: '6px 0 6px' }}>Bonjour {user.first_name || user.username}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {isManager && (isPro
                ? <span className="ph-pill ph-pill--gold"><Crown size={11} /> PRO{sub?.days_remaining != null ? ` · ${sub.days_remaining} j restants` : ''}</span>
                : <span className="ph-pill" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>Plan gratuit</span>)}
            </div>
          </div>
          {isManager && <Link to="/ajouter-lieu" className="ph-btn ph-btn--gold"><PlusCircle size={16} /> Ajouter un lieu</Link>}
        </div>
      </div>

      <div className="ph-wrap">
        <div className="ph-kpis">
          {isManager ? (
            <>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>Mes lieux</span><b>{venues.length}</b></div>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>À traiter</span><b style={{ color: stats.pending ? 'var(--ph-gold-deep)' : undefined }}>{stats.pending}</b></div>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>Vues totales</span><b>{fmt(stats.views)}</b></div>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>Revenus confirmés</span><b style={{ fontSize: 20 }}>{fmt(stats.revenue)} <small style={{ fontSize: 11 }}>FCFA</small></b></div>
            </>
          ) : (
            <>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>Demandes</span><b>{reservations.length}</b></div>
              <div className="ph-card ph-kpi"><span className="ph-muted" style={{ fontSize: 12 }}>En attente</span><b>{stats.pending}</b></div>
            </>
          )}
        </div>

        {isManager && !isPro && (
          <div className="ph-card" style={{ marginTop: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderColor: 'var(--ph-gold)' }}>
            <Crown size={22} color="#A07020" />
            <div style={{ flex: 1, minWidth: 200 }}><b>Passez Pro</b><div className="ph-muted" style={{ fontSize: 13 }}>10 000 FCFA / mois : statistiques détaillées, mise en avant, badge Pro.</div></div>
            <Link to="/abonnement" className="ph-btn ph-btn--gold" style={{ minHeight: 44 }}>Voir l'offre</Link>
          </div>
        )}

        <div className="ph-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`ph-chip ${tab === id ? 'ph-chip--on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'reservations' && (
          <section style={{ paddingBottom: 48 }}>
            <div className="ph-scroll" style={{ paddingLeft: 0, margin: 0 }}>
              {[['', 'Toutes'], ['pending', 'En attente'], ['confirmed', 'Confirmées'], ['cancelled', 'Annulées']].map(([v, l]) => (
                <button key={v} className={`ph-chip ${filter === v ? 'ph-chip--on' : ''}`} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>
            <div className="ph-card" style={{ padding: '4px 16px', marginTop: 8 }}>
              {list.length === 0 && <p className="ph-muted" style={{ textAlign: 'center', padding: '28px 0', margin: 0 }}>Aucune réservation.</p>}
              {list.map((r) => (
                <div key={r.id} className="ph-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Link to={`/lieux/${r.venue_detail?.slug || ''}`} style={{ fontWeight: 700, color: 'var(--ph-ink)', textDecoration: 'none' }}>{r.venue_detail?.name || 'Lieu'}</Link>
                    <div className="ph-muted" style={{ fontSize: 13, marginTop: 2 }}>
                      <Calendar size={12} style={{ verticalAlign: -1 }} /> {fmtDate(r.event_date)} · {r.guests_count} invités · {r.event_type}
                    </div>
                    {isManager && r.client_detail && <div className="ph-muted" style={{ fontSize: 13 }}>{r.client_detail.first_name} {r.client_detail.last_name} {r.client_detail.phone ? `· ${r.client_detail.phone}` : ''}</div>}
                    {r.message && <div style={{ fontSize: 13, marginTop: 4, color: '#3b4a42' }}>« {r.message} »</div>}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <Pill status={r.status} />
                    <b style={{ fontSize: 14, color: 'var(--ph-green)' }}>{fmt(r.total_price)} FCFA</b>
                  </div>
                  {isManager && r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <button className="ph-btn ph-btn--green" style={{ flex: 1, minHeight: 44 }} onClick={() => setStatus(r.id, 'confirmed')}><CheckCircle size={16} /> Confirmer</button>
                      <button className="ph-btn ph-btn--ghost" style={{ flex: 1, minHeight: 44 }} onClick={() => setStatus(r.id, 'cancelled')}><XCircle size={16} /> Refuser</button>
                    </div>
                  )}
                  {isManager && r.status === 'confirmed' && (
                    <button className="ph-btn ph-btn--ghost" style={{ minHeight: 40 }} onClick={() => setStatus(r.id, 'completed')}>Marquer terminée</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'venues' && isManager && (
          <section style={{ paddingBottom: 48 }}>
            {venues.length === 0 ? (
              <div className="ph-card" style={{ padding: 28, textAlign: 'center' }}>
                <p className="ph-muted">Vous n'avez pas encore référencé de lieu.</p>
                <Link to="/ajouter-lieu" className="ph-btn ph-btn--green">Ajouter mon premier lieu</Link>
              </div>
            ) : (
              <div className="ph-grid">
                {venues.map((v) => (
                  <Link key={v.id} to={`/lieux/${v.slug}`} className="ph-card ph-vcard">
                    <div className="ph-vcard__img"><img src={v.cover_image || `https://picsum.photos/seed/${v.id}/800/600`} alt={v.name} loading="lazy" /></div>
                    <div className="ph-vcard__body">
                      <h3 className="ph-vcard__name">{v.name}</h3>
                      <div className="ph-muted" style={{ fontSize: 13, display: 'flex', gap: 12 }}>
                        <span><MapPin size={12} /> {v.district || v.city}</span><span><Eye size={12} /> {v.views_count}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'analytics' && isManager && (
          <section style={{ paddingBottom: 48 }}>
            <div className="ph-card ph-lock">
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 4px' }}><TrendingUp size={16} style={{ verticalAlign: -2 }} /> Demandes sur 6 mois</h3>
                <p className="ph-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>Nombre de demandes reçues par mois</p>
                <div className="ph-bars">
                  {stats.months.map((m, i) => (
                    <div key={i}><span style={{ fontWeight: 700, color: 'var(--ph-ink)' }}>{m.n}</span><i style={{ height: `${(m.n / maxM) * 80}%` }} /><span>{m.label}</span></div>
                  ))}
                </div>
                <h3 style={{ margin: '24px 0 8px' }}>Vues par lieu</h3>
                {venues.length === 0 && <p className="ph-muted" style={{ fontSize: 13 }}>Aucun lieu.</p>}
                {[...venues].sort((a, b) => b.views_count - a.views_count).map((v) => (
                  <div key={v.id} className="ph-row" style={{ padding: '10px 0' }}>
                    <span style={{ flex: 1, fontSize: 14 }}>{v.name}</span>
                    <b>{v.views_count}</b>
                  </div>
                ))}
                <p className="ph-muted" style={{ fontSize: 12, marginTop: 12 }}><MessageSquare size={12} /> Calculé à partir de vos réservations et de vos lieux.</p>
              </div>
              {!isPro && (
                <div className="ph-lock__veil">
                  <Lock size={26} color="#A07020" />
                  <b>Statistiques réservées au plan Pro</b>
                  <Link to="/abonnement" className="ph-btn ph-btn--gold">Débloquer — 10 000 FCFA / mois</Link>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}