import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, ArrowRight, Crown, Map as MapIcon, MessageSquare, CalendarCheck } from 'lucide-react';
import { venueAPI } from '../api/venues';
import { useAuth } from '../context/AuthContext';
import '../styles/premium.css';

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n || 0);
const CITIES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo'];
const CAPACITIES = [
  { v: '', l: 'Capacité' }, { v: 50, l: '50+ personnes' }, { v: 100, l: '100+ personnes' },
  { v: 300, l: '300+ personnes' }, { v: 500, l: '500+ personnes' },
];
const toList = (d) => (Array.isArray(d) ? d : d?.results || []);

function VenueCard({ v }) {
  const img = v.cover_image || `https://picsum.photos/seed/${v.id}/800/600`;
  return (
    <Link to={`/lieux/${v.slug}`} className="ph-card ph-vcard ph-rise">
      <div className="ph-vcard__img">
        <img src={img} alt={v.name} loading="lazy" />
        {v.is_featured && <span className="ph-pill ph-pill--gold ph-vcard__tag"><Crown size={11} /> Vedette</span>}
      </div>
      <div className="ph-vcard__body">
        <h3 className="ph-vcard__name">{v.name}</h3>
        <div className="ph-muted" style={{ fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={13} />{v.district || v.city}</span>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Users size={13} />jusqu'à {v.capacity_max}</span>
          {v.average_rating && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Star size={13} fill="#C9A84C" color="#C9A84C" />{v.average_rating}</span>}
        </div>
        <div><span className="ph-vcard__price">{fmt(v.price_per_day)} FCFA</span> <span className="ph-muted" style={{ fontSize: 12 }}>/ jour</span></div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(null);
  const [q, setQ] = useState({ search: '', city: '', capacity_min: '' });

  useEffect(() => {
    venueAPI.getFeatured().then(({ data }) => setFeatured(toList(data))).catch(() => {});
    venueAPI.getAll({ ordering: '-created_at' }).then(({ data }) => {
      setRecent(toList(data).slice(0, 6));
      if (typeof data?.count === 'number') setTotal(data.count);
    }).catch(() => {});
    venueAPI.getCategories().then(({ data }) => setCategories(toList(data))).catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v) p.set(k, v); });
    navigate(`/lieux?${p.toString()}`);
  };

  const shown = featured.length ? featured.slice(0, 6) : recent;

  return (
    <div className="ph-page">
      <section className="ph-hero">
        <div className="ph-wrap">
          <span className="ph-eyebrow" style={{ color: '#C9A84C', position: 'relative', zIndex: 1 }}>Côte d'Ivoire · Lieux d'événements</span>
          <h1>Le lieu parfait pour votre <em>grand jour</em></h1>
          <p>Mariages, anniversaires, séminaires : comparez les espaces, localisez-les sur la carte et échangez directement avec les gestionnaires.</p>
        </div>
      </section>

      <div className="ph-wrap">
        <form className="ph-card ph-search" onSubmit={submit} role="search">
          <div>
            <label className="ph-label" htmlFor="hs">Que cherchez-vous ?</label>
            <input id="hs" className="ph-input" placeholder="Salle, rooftop, jardin…" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} />
          </div>
          <div>
            <label className="ph-label" htmlFor="hc">Ville</label>
            <select id="hc" className="ph-input" value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="ph-label" htmlFor="hk">Invités</label>
            <select id="hk" className="ph-input" value={q.capacity_min} onChange={(e) => setQ({ ...q, capacity_min: e.target.value })}>
              {CAPACITIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
          <button type="submit" className="ph-btn ph-btn--gold"><Search size={17} /> Rechercher</button>
        </form>
      </div>

      {categories.length > 0 && (
        <section className="ph-section" style={{ paddingBottom: 8 }}>
          <div className="ph-wrap">
            <div className="ph-scroll">
              {categories.map((c) => (
                <Link key={c.id} to={`/lieux?category=${c.slug}`} className="ph-chip">{c.name}</Link>
              ))}
              <Link to="/carte" className="ph-chip"><MapIcon size={14} /> Voir la carte</Link>
            </div>
          </div>
        </section>
      )}

      <section className="ph-section">
        <div className="ph-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 12 }}>
            <div>
              <span className="ph-eyebrow">{featured.length ? 'Sélection' : 'Derniers ajouts'}</span>
              <h2 className="ph-h2">{featured.length ? 'Lieux à la une' : 'Nouveaux lieux'}</h2>
            </div>
            <Link to="/lieux" className="ph-chip">Tout voir <ArrowRight size={14} /></Link>
          </div>
          {shown.length === 0 ? (
            <div className="ph-card" style={{ padding: 28, textAlign: 'center' }}>
              <p className="ph-muted" style={{ margin: 0 }}>Aucun lieu publié pour le moment.</p>
            </div>
          ) : (
            <div className="ph-grid">{shown.map((v) => <VenueCard key={v.id} v={v} />)}</div>
          )}
          {total !== null && total > 0 && (
            <p className="ph-muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>{total} lieu{total > 1 ? 'x' : ''} référencé{total > 1 ? 's' : ''} sur EventHotline</p>
          )}
        </div>
      </section>

      <section className="ph-section" style={{ background: 'var(--ph-sand)' }}>
        <div className="ph-wrap">
          <span className="ph-eyebrow">Simple et direct</span>
          <h2 className="ph-h2" style={{ marginBottom: 22 }}>Trois étapes, zéro intermédiaire</h2>
          <div className="ph-steps">
            <div className="ph-card ph-step"><Search size={20} color="#1B6B4A" /><h3 style={{ margin: '8px 0 4px' }}>Explorez</h3><p className="ph-muted" style={{ margin: 0, fontSize: 14 }}>Filtrez par ville, capacité, budget et équipements, ou parcourez la carte.</p></div>
            <div className="ph-card ph-step"><MessageSquare size={20} color="#1B6B4A" /><h3 style={{ margin: '8px 0 4px' }}>Échangez</h3><p className="ph-muted" style={{ margin: 0, fontSize: 14 }}>Posez vos questions au gestionnaire via la messagerie intégrée.</p></div>
            <div className="ph-card ph-step"><CalendarCheck size={20} color="#1B6B4A" /><h3 style={{ margin: '8px 0 4px' }}>Réservez</h3><p className="ph-muted" style={{ margin: 0, fontSize: 14 }}>Envoyez votre demande de date et suivez la réponse en ligne.</p></div>
          </div>
        </div>
      </section>

      {(!user || user.role === 'manager') && (
        <section className="ph-section">
          <div className="ph-wrap">
            <div className="ph-cta-band">
              <div>
                <span className="ph-eyebrow" style={{ color: '#C9A84C' }}>Gestionnaires d'espaces</span>
                <h2 className="ph-h2" style={{ color: '#fff' }}>Remplissez votre agenda</h2>
                <p style={{ color: 'rgba(255,255,255,.8)', margin: '10px 0 0', fontSize: 15, lineHeight: 1.6 }}>Référencez vos espaces et recevez des demandes qualifiées. Plan Pro : 10 000 FCFA / mois.</p>
              </div>
              <Link to={user ? '/abonnement' : '/inscription'} className="ph-btn ph-btn--gold"><Crown size={16} /> {user ? 'Découvrir le Pro' : 'Créer mon compte'}</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}