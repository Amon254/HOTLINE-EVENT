import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Trash2, Edit3, Plus, Crown, KeyRound, Star, Search } from 'lucide-react';
import apiClient from '../api/client';

export const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n || 0);
const errMsg = (e) => e?.response?.data?.error || e?.response?.data?.detail || 'Action impossible';

/** Appel API avec toast succès/erreur. Retourne true si OK. */
export async function act(fn, okMsg) {
  try { await fn(); if (okMsg) toast.success(okMsg); return true; }
  catch (e) { toast.error(errMsg(e)); return false; }
}
export const confirmDo = (msg) => window.confirm(msg);

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  box: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  lab: { display: 'block', fontSize: 12, fontWeight: 600, margin: '12px 0 4px', color: '#5C5C52' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' },
  td: { padding: '11px 14px', fontSize: 13 },
  card: { background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'auto' },
};
const dangerBtn = { fontSize: 11, padding: '4px 9px', background: '#FEF2F2', color: '#dc2626', border: '1px solid #fca5a5' };

export function Modal({ title, onClose, children }) {
  return (
    <div style={S.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.box} role="dialog" aria-label={title}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) { return <><label style={S.lab}>{label}</label>{children}</>; }

/* ───────── Utilisateur : créer / modifier / mot de passe / Pro / supprimer ───────── */
export function UserModal({ user, me, onClose, onDone }) {
  const isNew = !user;
  const [f, setF] = useState(user ? {
    first_name: user.first_name, last_name: user.last_name, email: user.email,
    phone: user.phone || '', city: user.city || '', role: user.role,
  } : { username: '', password: '', first_name: '', last_name: '', email: '', phone: '', city: '', role: 'client' });
  const [pw, setPw] = useState('');
  const [months, setMonths] = useState(1);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const isMe = user && me && user.id === me.id;

  const save = async () => {
    const ok = await act(() => isNew ? apiClient.post('/admin-panel/users/', f) : apiClient.patch(`/admin-panel/users/${user.id}/`, f),
      isNew ? 'Compte créé' : 'Modifications enregistrées');
    if (ok) { onDone(); onClose(); }
  };
  const run = async (fn, msg) => { if (await act(fn, msg)) onDone(); };

  return (
    <Modal title={isNew ? 'Nouvel utilisateur' : `Modifier @${user.username}`} onClose={onClose}>
      {isNew && <>
        <Field label="Identifiant *"><input className="input" value={f.username} onChange={set('username')} /></Field>
        <Field label="Mot de passe * (6 min.)"><input className="input" type="text" value={f.password} onChange={set('password')} /></Field>
      </>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><Field label="Prénom"><input className="input" value={f.first_name} onChange={set('first_name')} /></Field></div>
        <div><Field label="Nom"><input className="input" value={f.last_name} onChange={set('last_name')} /></Field></div>
      </div>
      <Field label="Email"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><Field label="Téléphone"><input className="input" value={f.phone} onChange={set('phone')} /></Field></div>
        <div><Field label="Ville"><input className="input" value={f.city} onChange={set('city')} /></Field></div>
      </div>
      <Field label="Rôle">
        <select className="input" value={f.role} onChange={set('role')} disabled={isMe}>
          <option value="client">Client</option><option value="manager">Gestionnaire</option><option value="admin">Administrateur</option>
        </select>
      </Field>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={save}>
        {isNew ? 'Créer le compte' : 'Enregistrer'}
      </button>

      {!isNew && <>
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
        <b style={{ fontSize: 13 }}><KeyRound size={13} /> Réinitialiser le mot de passe</b>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="input" placeholder="Nouveau mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={() => run(() => apiClient.post(`/admin-panel/users/${user.id}/password/`, { password: pw }), 'Mot de passe changé').then(() => setPw(''))}>Appliquer</button>
        </div>
        <b style={{ fontSize: 13, display: 'block', marginTop: 18 }}><Crown size={13} /> Abonnement Pro (sans paiement)</b>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <select className="input" style={{ width: 120 }} value={months} onChange={(e) => setMonths(+e.target.value)}>
            {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} mois</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => run(() => apiClient.post(`/admin-panel/users/${user.id}/grant_pro/`, { months }), 'Pro activé')}>Offrir / prolonger</button>
          <button className="btn btn-sm" style={dangerBtn} onClick={() => confirmDo('Repasser cet utilisateur au plan gratuit ?') && run(() => apiClient.post(`/admin-panel/users/${user.id}/revoke_pro/`, {}), 'Pro retiré')}>Retirer le Pro</button>
        </div>
        {!isMe && (
          <button className="btn btn-sm" style={{ ...dangerBtn, marginTop: 22 }}
            onClick={async () => { if (confirmDo(`Supprimer définitivement @${user.username} et toutes ses données ?`) && await act(() => apiClient.delete(`/admin-panel/users/${user.id}/`), 'Compte supprimé')) { onDone(); onClose(); } }}>
            <Trash2 size={12} /> Supprimer ce compte
          </button>
        )}
      </>}
    </Modal>
  );
}

/* ───────── Lieu : modifier / supprimer ───────── */
export function VenueModal({ venue, users, categories, onClose, onDone }) {
  const [f, setF] = useState({
    name: venue.name, city: venue.city, district: venue.district || '', price_per_day: venue.price_per_day,
    capacity_max: venue.capacity_max, status: venue.status, is_featured: venue.is_featured,
    manager_id: venue.manager_id, category: categories.find((c) => c.name === venue.category)?.id || '',
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');
  const save = async () => {
    const body = { ...f, is_featured: !!f.is_featured };
    if (!body.category) delete body.category;
    if (await act(() => apiClient.patch(`/admin-panel/venues/${venue.id}/`, body), 'Lieu mis à jour')) { onDone(); onClose(); }
  };
  return (
    <Modal title={`Modifier : ${venue.name}`} onClose={onClose}>
      <Field label="Nom"><input className="input" value={f.name} onChange={set('name')} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><Field label="Ville"><input className="input" value={f.city} onChange={set('city')} /></Field></div>
        <div><Field label="Quartier"><input className="input" value={f.district} onChange={set('district')} /></Field></div>
        <div><Field label="Prix / jour (FCFA)"><input className="input" type="number" value={f.price_per_day} onChange={set('price_per_day')} /></Field></div>
        <div><Field label="Capacité max"><input className="input" type="number" value={f.capacity_max} onChange={set('capacity_max')} /></Field></div>
      </div>
      <Field label="Catégorie">
        <select className="input" value={f.category} onChange={set('category')}>
          <option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Gestionnaire">
        <select className="input" value={f.manager_id} onChange={(e) => setF((x) => ({ ...x, manager_id: +e.target.value }))}>
          {managers.map((u) => <option key={u.id} value={u.id}>{`${u.first_name} ${u.last_name}`.trim() || u.username} (@{u.username})</option>)}
        </select>
      </Field>
      <Field label="Statut">
        <select className="input" value={f.status} onChange={set('status')}>
          <option value="active">Actif</option><option value="pending">En attente</option><option value="inactive">Inactif</option>
        </select>
      </Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <input type="checkbox" checked={!!f.is_featured} onChange={(e) => setF((x) => ({ ...x, is_featured: e.target.checked }))} /> <Star size={13} /> Lieu en vedette
      </label>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={save}>Enregistrer</button>
      <button className="btn btn-sm" style={{ ...dangerBtn, marginTop: 16 }}
        onClick={async () => { if (confirmDo(`Supprimer "${venue.name}" ainsi que ses réservations et avis ?`) && await act(() => apiClient.delete(`/admin-panel/venues/${venue.id}/`), 'Lieu supprimé')) { onDone(); onClose(); } }}>
        <Trash2 size={12} /> Supprimer ce lieu
      </button>
    </Modal>
  );
}

/* ───────── Onglets simples ───────── */
export function ReviewsTab() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => apiClient.get('/admin-panel/reviews/').then((r) => setRows(r.data)).catch(() => toast.error('Erreur chargement')), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 16px', fontWeight: 800 }}>Avis ({rows.length})</h1>
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--surface-2)' }}>{['Lieu', 'Auteur', 'Note', 'Avis', 'Date', ''].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={S.td}><Link to={`/lieux/${r.venue_slug}`} target="_blank">{r.venue}</Link></td>
              <td style={S.td}>{r.author}</td>
              <td style={S.td}>{'★'.repeat(r.rating)}<span style={{ color: '#ccc' }}>{'★'.repeat(5 - r.rating)}</span></td>
              <td style={{ ...S.td, maxWidth: 320 }}><b>{r.title}</b><div style={{ color: '#5C5C52' }}>{r.comment}</div></td>
              <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('fr-CI')}</td>
              <td style={S.td}><button className="btn btn-sm" style={dangerBtn} onClick={async () => confirmDo('Supprimer cet avis ?') && (await act(() => apiClient.delete(`/admin-panel/reviews/${r.id}/`), 'Avis supprimé')) && load()}><Trash2 size={11} /></button></td>
            </tr>))}</tbody>
        </table>
        {rows.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Aucun avis</div>}
      </div>
    </div>
  );
}

export function CategoriesTab({ onChange }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const load = useCallback(() => apiClient.get('/admin-panel/categories/').then((r) => { setRows(r.data); onChange && onChange(r.data); }), [onChange]);
  useEffect(() => { load(); }, [load]);
  const rename = async (c) => {
    const n = window.prompt('Nouveau nom', c.name);
    if (n && n.trim() && (await act(() => apiClient.patch(`/admin-panel/categories/${c.id}/`, { name: n.trim() }), 'Catégorie renommée'))) load();
  };
  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 16px', fontWeight: 800 }}>Catégories ({rows.length})</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="Nouvelle catégorie…" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={async () => name.trim() && (await act(() => apiClient.post('/admin-panel/categories/', { name }), 'Catégorie ajoutée')) && (setName(''), load())}><Plus size={13} /> Ajouter</button>
      </div>
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--surface-2)' }}>{['Nom', 'Slug', 'Lieux', ''].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={S.td}><b>{c.name}</b></td><td style={S.td}><code>{c.slug}</code></td><td style={S.td}>{c.venues_count}</td>
              <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => rename(c)}><Edit3 size={11} /></button>
                <button className="btn btn-sm" style={dangerBtn} onClick={async () => confirmDo(`Supprimer "${c.name}" ? Les ${c.venues_count} lieux associés resteront sans catégorie.`) && (await act(() => apiClient.delete(`/admin-panel/categories/${c.id}/`), 'Supprimée')) && load()}><Trash2 size={11} /></button>
              </td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

export function PlansTab() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => apiClient.get('/admin-panel/plans/').then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const upd = (id, k, v) => setRows((rs) => rs.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  const save = async (p) => (await act(() => apiClient.patch(`/admin-panel/plans/${p.id}/`, p), 'Plan enregistré')) && load();
  const checks = [['has_analytics', 'Analytics'], ['has_priority_listing', 'Mise en avant'], ['has_messaging', 'Messagerie']];
  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 6px', fontWeight: 800 }}>Plans d'abonnement</h1>
      <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 16px' }}>Note : l'affichage du prix sur la page Abonnement reste fixé à 10 000 FCFA côté interface ; ce prix sert au calcul serveur.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {rows.map((p) => (
          <div key={p.id} style={{ ...S.card, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{p.slug.toUpperCase()}</b><span style={{ fontSize: 12, color: '#9CA3AF' }}>{p.subscribers} abonné(s)</span></div>
            <Field label="Nom"><input className="input" value={p.name} onChange={(e) => upd(p.id, 'name', e.target.value)} /></Field>
            <Field label="Prix mensuel (FCFA)"><input className="input" type="number" value={p.price_monthly} onChange={(e) => upd(p.id, 'price_monthly', e.target.value)} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[['max_venues', 'Lieux'], ['max_photos', 'Photos'], ['max_videos', 'Vidéos']].map(([k, l]) => (
                <div key={k}><Field label={l}><input className="input" type="number" value={p[k]} onChange={(e) => upd(p.id, k, e.target.value)} /></Field></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
              {checks.map(([k, l]) => <label key={k} style={{ fontSize: 12, display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={!!p[k]} onChange={(e) => upd(p.id, k, e.target.checked)} />{l}</label>)}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => save(p)}>Enregistrer</button>
          </div>))}
      </div>
    </div>
  );
}

/* ───────── Page Utilisateurs (premium) ───────── */
const ROLE = {
  admin: { label: 'Admin', bg: '#0A0E0C', color: '#34D399' },
  manager: { label: 'Gestionnaire', bg: '#E8F5EE', color: '#1B6B4A' },
  client: { label: 'Client', bg: '#F1F5F3', color: '#5B6661' },
};
const initials = (u) => ((u.first_name?.[0] || '') + (u.last_name?.[0] || '') || u.username?.[0] || '?').toUpperCase();
const dShort = (d) => (d ? new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const daysLeft = (d) => (d ? Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000)) : null);
const PER_PAGE = 10;

function Kpi({ label, value, hint, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', borderTop: `3px solid ${accent || '#1B6B4A'}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase', color: '#9CA3AF' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{hint}</div>}
    </div>
  );
}

export function UsersTab({ users, me, onReload, onEdit, onCreate }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState('');
  const [plan, setPlan] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  const isPro = (u) => u.subscription?.plan === 'Pro Gestionnaire' && u.subscription?.is_active;
  const counts = {
    total: users.length,
    manager: users.filter((u) => u.role === 'manager').length,
    client: users.filter((u) => u.role === 'client').length,
    admin: users.filter((u) => u.role === 'admin').length,
    pro: users.filter(isPro).length,
    suspended: users.filter((u) => !u.is_active).length,
  };
  const weekAgo = Date.now() - 7 * 86400000;
  const newWeek = users.filter((u) => new Date(u.date_joined) > weekAgo).length;

  let rows = users.filter((u) =>
    (!role || u.role === role) &&
    (!state || (state === 'active' ? u.is_active : !u.is_active)) &&
    (!plan || (plan === 'pro' ? isPro(u) : !isPro(u))) &&
    (!q || `${u.username} ${u.email} ${u.first_name} ${u.last_name} ${u.phone || ''} ${u.city || ''}`.toLowerCase().includes(q.toLowerCase())));
  rows = [...rows].sort((a, b) =>
    sort === 'name' ? `${a.first_name}${a.username}`.localeCompare(`${b.first_name}${b.username}`)
      : sort === 'venues' ? b.venues_count - a.venues_count
        : sort === 'activity' ? (b.reservations_count + b.venues_count) - (a.reservations_count + a.venues_count)
          : new Date(b.date_joined) - new Date(a.date_joined));
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const view = rows.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const reset = (fn) => (v) => { fn(v); setPage(1); };

  const toggle = async (u) => {
    if (u.is_active && !confirmDo(`Suspendre @${u.username} ? Il ne pourra plus se connecter.`)) return;
    if (await act(() => apiClient.patch(`/admin-panel/users/${u.id}/`, { is_active: !u.is_active }), u.is_active ? 'Compte suspendu' : 'Compte réactivé')) onReload();
  };

  const exportCsv = () => {
    const head = ['Identifiant', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Rôle', 'Plan', 'Expiration', 'Lieux', 'Réservations', 'Inscrit le', 'Actif'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [head, ...rows.map((u) => [u.username, u.first_name, u.last_name, u.email, u.phone, u.city, u.role,
      u.subscription?.plan, u.subscription?.expires_at ? dShort(u.subscription.expires_at) : '', u.venues_count, u.reservations_count, dShort(u.date_joined), u.is_active ? 'oui' : 'non'])]
      .map((r) => r.map(esc).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `utilisateurs-eventhotline-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const chip = (active) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
    border: `1.5px solid ${active ? '#0A0E0C' : 'var(--border)'}`, background: active ? '#0A0E0C' : '#fff',
    color: active ? '#fff' : 'var(--text-secondary)', fontWeight: active ? 600 : 500,
  });
  const sel = { height: 36, fontSize: 13, width: 'auto', minWidth: 130 };

  return (
    <div>
      <style>{`@media (max-width: 900px){.adm-hide-sm{display:none!important}}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Utilisateurs</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Comptes, rôles, abonnements et accès de la plateforme</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>Exporter CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={onReload} aria-label="Actualiser">↻</button>
          <button className="btn btn-primary btn-sm" onClick={onCreate}><Plus size={13} /> Nouvel utilisateur</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <Kpi label="Utilisateurs" value={counts.total} hint={`+${newWeek} cette semaine`} />
        <Kpi label="Gestionnaires" value={counts.manager} accent="#34D399" />
        <Kpi label="Clients" value={counts.client} accent="#0A0E0C" />
        <Kpi label="Abonnés Pro" value={counts.pro} hint={counts.manager ? `${Math.round((counts.pro / counts.manager) * 100)} % des gestionnaires` : ''} accent="#1B6B4A" />
        <Kpi label="Suspendus" value={counts.suspended} accent="#B91C1C" />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input className="input" style={{ paddingLeft: 32, height: 36, fontSize: 13 }} placeholder="Nom, email, téléphone, ville…" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
        </div>
        <select className="input" style={sel} value={state} onChange={(e) => reset(setState)(e.target.value)}><option value="">Tous les états</option><option value="active">Actifs</option><option value="suspended">Suspendus</option></select>
        <select className="input" style={sel} value={plan} onChange={(e) => reset(setPlan)(e.target.value)}><option value="">Tous les plans</option><option value="pro">Pro</option><option value="free">Gratuit</option></select>
        <select className="input" style={sel} value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Plus récents</option><option value="name">Nom A→Z</option><option value="venues">Plus de lieux</option><option value="activity">Plus actifs</option></select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
        {[['', 'Tous', counts.total], ['manager', 'Gestionnaires', counts.manager], ['client', 'Clients', counts.client], ['admin', 'Admins', counts.admin]].map(([v, l, n]) => (
          <button key={v} style={chip(role === v)} onClick={() => reset(setRole)(v)}>{l} <span style={{ opacity: .6, marginLeft: 4 }}>{n}</span></button>))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#F4F6F5' }}>
            {[['Utilisateur', ''], ['Rôle', ''], ['Plan', ''], ['Activité', 'adm-hide-sm'], ['Inscrit', 'adm-hide-sm'], ['État', ''], ['', '']].map(([h, c], i) => <th key={i} className={c} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {view.map((u) => {
              const r = ROLE[u.role] || ROLE.client;
              const pro = isPro(u); const dl = daysLeft(u.subscription?.expires_at);
              return (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)', opacity: u.is_active ? 1 : .55 }}>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: pro ? 'linear-gradient(135deg,#34D399,#1B6B4A)' : '#E8F5EE', color: pro ? '#fff' : '#1B6B4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initials(u)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{`${u.first_name} ${u.last_name}`.trim() || u.username} {u.id === me?.id && <span style={{ fontSize: 10, color: '#9CA3AF' }}>(vous)</span>}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>@{u.username} · {u.email || 'pas d\'email'}</div>
                        {(u.phone || u.city) && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{[u.phone, u.city].filter(Boolean).join(' · ')}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.bg, color: r.color }}>{r.label}</span></td>
                  <td style={S.td}>
                    {pro ? <div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 9px', borderRadius: 20, background: '#0A0E0C', color: '#34D399', fontSize: 10, fontWeight: 800 }}><Crown size={9} /> PRO</span>
                      {dl !== null && <div style={{ fontSize: 11, color: dl < 8 ? '#B91C1C' : '#9CA3AF', marginTop: 3 }}>{dl} j restants</div>}</div>
                      : <span style={{ fontSize: 12, color: '#9CA3AF' }}>Gratuit</span>}
                  </td>
                  <td className="adm-hide-sm" style={{ ...S.td, fontSize: 12, color: '#6B7280' }}>{u.venues_count} lieu{u.venues_count > 1 ? 'x' : ''}<br />{u.reservations_count} réservation{u.reservations_count > 1 ? 's' : ''}</td>
                  <td className="adm-hide-sm" style={{ ...S.td, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{dShort(u.date_joined)}</td>
                  <td style={S.td}><span style={{ fontSize: 12, fontWeight: 700, color: u.is_active ? '#1B6B4A' : '#B91C1C' }}>● {u.is_active ? 'Actif' : 'Suspendu'}</span></td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u)}><Edit3 size={11} /> Gérer</button>{' '}
                    {u.id !== me?.id && <button className="btn btn-sm" style={u.is_active ? dangerBtn : { fontSize: 11, padding: '4px 9px', background: '#E8F5EE', color: '#1B6B4A', border: '1px solid #86efac' }} onClick={() => toggle(u)}>{u.is_active ? 'Suspendre' : 'Réactiver'}</button>}
                  </td>
                </tr>);
            })}
          </tbody>
        </table>
        {view.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Aucun utilisateur ne correspond à ces filtres</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: '#9CA3AF', flexWrap: 'wrap', gap: 8 }}>
        <span>{rows.length} résultat{rows.length > 1 ? 's' : ''} · page {cur} / {pages}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>← Précédent</button>
          <button className="btn btn-ghost btn-sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Suivant →</button>
        </div>
      </div>
    </div>
  );
}