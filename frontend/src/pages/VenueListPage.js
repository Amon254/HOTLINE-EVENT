import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Heart, MapPin, Users, Star, Map as MapIcon, Crown, GitCompare, MessageCircle, ChevronLeft, ChevronRight, Wifi, ParkingCircle, ChefHat, Wind, Zap, Mic } from 'lucide-react';
import { venueAPI } from '../api/venues';
import '../styles/premium.css';

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n || 0);
const toList = (d) => (Array.isArray(d) ? d : d?.results || []);
const CITIES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo', 'Man'];
const DISTRICTS = ['Plateau', 'Cocody', 'Marcory', 'Treichville', 'Adjamé', 'Yopougon', 'Abobo', 'Riviera', 'Bingerville', 'Angré', 'Deux Plateaux', 'Zone 4', 'Port-Bouet'];
const CAPS = [[50, '50+'], [100, '100+'], [300, '300+'], [500, '500+']];
const BUDGETS = [[200000, '≤ 200 000'], [500000, '≤ 500 000'], [1000000, '≤ 1 M'], [2000000, '≤ 2 M']];
const SORTS = [['-is_featured', 'Recommandés'], ['-created_at', 'Plus récents'], ['price_per_day', 'Prix croissant'], ['-price_per_day', 'Prix décroissant'], ['-views_count', 'Populaires'], ['-capacity_max', 'Grande capacité']];
const AMENITIES = [['has_parking', 'Parking', ParkingCircle], ['has_wifi', 'Wifi', Wifi], ['has_catering', 'Traiteur', ChefHat], ['has_ac', 'Climatisation', Wind], ['has_generator', 'Groupe électrogène', Zap], ['has_sound_system', 'Sonorisation', Mic]];
const WHATSAPP = '2250757041368'; // numéro de la plateforme

const KEYS = ['search', 'city', 'district', 'capacity_min', 'price_max', 'category', 'ordering', ...AMENITIES.map((a) => a[0]), 'is_featured'];
const readFilters = (sp) => {
  const f = {};
  KEYS.forEach((k) => { const v = sp.get(k); if (v) f[k] = v; });
  return f;
};
const readLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };

function Card({ v, fav, onFav, inCompare, onCompare }) {
  const img = v.cover_image || `https://picsum.photos/seed/${v.id}/800/600`;
  const am = AMENITIES.filter(([k]) => v[k]).slice(0, 4);
  return (
    <article className="ph-card ph-vcard ph-rise" style={{ position: 'relative' }}>
      <Link to={`/lieux/${v.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
        <div className="ph-vcard__img">
          <img src={img} alt={v.name} loading="lazy" />
          <div className="ph-vcard__tag" style={{ display: 'flex', gap: 6 }}>
            {v.is_featured && <span className="ph-pill ph-pill--gold"><Crown size={11} /> Vedette</span>}
            {v.category?.name && <span className="ph-pill" style={{ background: 'rgba(255,255,255,.92)', color: '#10261C' }}>{v.category.name}</span>}
          </div>
        </div>
        <div className="ph-vcard__body">
          <h3 className="ph-vcard__name">{v.name}</h3>
          <div className="ph-muted" style={{ fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={13} />{v.district ? `${v.district}, ` : ''}{v.city}</span>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Users size={13} />{v.capacity_min}–{v.capacity_max}</span>
            {v.average_rating ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Star size={13} fill="#C9A84C" color="#C9A84C" />{v.average_rating} ({v.reviews_count})</span> : null}
          </div>
          {v.short_description && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#3b4a42', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.short_description}</p>}
          {am.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {am.map(([k, l, Icon]) => <span key={k} className="ph-pill ph-pill--green" style={{ fontWeight: 600 }}><Icon size={11} />{l}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="ph-vcard__price" style={{ fontSize: 17 }}>{fmt(v.price_per_day)} FCFA</span>
            <span className="ph-muted" style={{ fontSize: 12 }}>/ jour</span>
            {v.price_per_hour ? <span className="ph-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{fmt(v.price_per_hour)} / h</span> : null}
          </div>
        </div>
      </Link>
      <button className="ph-iconbtn" style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => onFav(v)} aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
        <Heart size={19} fill={fav ? '#C0392B' : 'none'} color={fav ? '#C0392B' : '#10261C'} />
      </button>
      <button className="ph-chip" style={{ position: 'absolute', top: 10, left: 10, display: 'none' }} onClick={() => onCompare(v)}>{inCompare ? '✓' : '+'}</button>
      <div style={{ padding: '0 16px 14px' }}>
        <button className={`ph-chip ${inCompare ? 'ph-chip--on' : ''}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => onCompare(v)}>
          <GitCompare size={14} /> {inCompare ? 'Dans la comparaison' : 'Comparer'}
        </button>
      </div>
    </article>
  );
}

export default function VenueListPage() {
  const [sp, setSp] = useSearchParams();
  const filters = readFilters(sp);
  const page = parseInt(sp.get('page') || '1', 10);
  const [venues, setVenues] = useState([]);
  const [count, setCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [searchText, setSearchText] = useState(filters.search || '');
  const [favs, setFavs] = useState(() => readLS('favorites'));
  const [compare, setCompare] = useState(() => readLS('compareList'));
  const topRef = useRef(null);

  const apply = useCallback((next, keepPage) => {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v && v !== 'false') p.set(k, v); });
    if (keepPage && keepPage > 1) p.set('page', keepPage);
    setSp(p, { replace: true });
  }, [setSp]);

  useEffect(() => { venueAPI.getCategories().then(({ data }) => setCategories(toList(data))).catch(() => {}); }, []);

  // recherche texte avec délai
  useEffect(() => {
    const t = setTimeout(() => { if ((filters.search || '') !== searchText) apply({ ...filters, search: searchText }); }, 400);
    return () => clearTimeout(t);
  }, [searchText]); // eslint-disable-line

  const qs = sp.toString();
  useEffect(() => {
    let live = true;
    setLoading(true);
    const params = { ...readFilters(sp), page };
    if (!params.ordering) params.ordering = '-is_featured';
    venueAPI.getAll(params)
      .then(({ data }) => { if (live) { setVenues(toList(data)); setCount(data.count ?? toList(data).length); } })
      .catch(() => { if (live) { setVenues([]); setCount(0); } })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [qs]); // eslint-disable-line

  const toggleFav = (v) => {
    const next = favs.includes(v.id) ? favs.filter((i) => i !== v.id) : [...favs, v.id];
    setFavs(next); try { localStorage.setItem('favorites', JSON.stringify(next)); } catch (_) {}
  };
  const toggleCompare = (v) => {
    const has = compare.find((c) => c.id === v.id);
    const next = has ? compare.filter((c) => c.id !== v.id) : [...compare.slice(-1), { id: v.id, slug: v.slug, name: v.name, price_per_day: v.price_per_day }];
    setCompare(next); try { localStorage.setItem('compareList', JSON.stringify(next)); } catch (_) {}
  };

  const setF = (k, v) => apply({ ...filters, [k]: v === filters[k] ? '' : v });
  const clearAll = () => { setSearchText(''); apply({}); };
  const labels = {
    city: (v) => v, district: (v) => v, capacity_min: (v) => `${v}+ invités`, price_max: (v) => `≤ ${fmt(v)} FCFA`,
    category: (v) => categories.find((c) => c.slug === v)?.name || v, is_featured: () => 'Vedettes',
    ...Object.fromEntries(AMENITIES.map(([k, l]) => [k, () => l])),
  };
  const active = Object.entries(filters).filter(([k]) => labels[k]);
  const totalPages = Math.max(1, Math.ceil(count / 12));
  const goPage = (n) => { apply(filters, n); topRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const mapHref = `/carte${qs ? `?${qs}` : ''}`;
  const openSheet = () => { setDraft(filters); setSheet(true); };

  return (
    <div className="ph-page">
      <style>{`
        .vl-head{background:var(--ph-forest);color:#fff;padding:26px 0 22px}
        .vl-bar{position:sticky;top:0;z-index:40;background:rgba(250,247,240,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--ph-line);padding:12px 0}
        .vl-sheet-bg{position:fixed;inset:0;background:rgba(10,20,15,.55);z-index:200;display:flex;align-items:flex-end;justify-content:center}
        .vl-sheet{background:#fff;width:100%;max-width:560px;max-height:92vh;border-radius:24px 24px 0 0;display:flex;flex-direction:column}
        .vl-sheet__body{overflow-y:auto;padding:4px 20px 12px}
        @media(min-width:760px){.vl-sheet-bg{align-items:center}.vl-sheet{border-radius:24px}}
        .vl-tray{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:80;background:var(--ph-forest);color:#fff;border-radius:999px;padding:10px 12px 10px 18px;display:flex;gap:12px;align-items:center;box-shadow:0 12px 30px rgba(0,0,0,.3);max-width:calc(100% - 24px)}
        .vl-skel{aspect-ratio:3/4;background:linear-gradient(90deg,#efe9d9,#f7f3e8,#efe9d9);background-size:200% 100%;animation:vlsk 1.3s infinite;border-radius:20px}
        @keyframes vlsk{to{background-position:-200% 0}}
        .vl-pg{min-width:44px;min-height:44px}
      `}</style>

      <header className="vl-head">
        <div className="ph-wrap">
          <span className="ph-eyebrow" style={{ color: '#C9A84C' }}>Côte d'Ivoire</span>
          <h1 className="ph-serif" style={{ fontSize: 'clamp(1.6rem,6vw,2.4rem)', margin: '4px 0 0' }}>Explorer les lieux</h1>
        </div>
      </header>

      <div className="vl-bar" ref={topRef}>
        <div className="ph-wrap">
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B6F66' }} />
              <input className="ph-input" style={{ paddingLeft: 40, borderRadius: 999 }} placeholder="Salle, quartier, type de lieu…" value={searchText} onChange={(e) => setSearchText(e.target.value)} aria-label="Rechercher" />
            </div>
            <button className="ph-btn ph-btn--green" style={{ minWidth: 48, padding: '0 16px' }} onClick={openSheet} aria-label="Filtres">
              <SlidersHorizontal size={17} /><span className="vl-fl">Filtres{active.length ? ` · ${active.length}` : ''}</span>
            </button>
          </div>
          <div className="ph-scroll" style={{ marginTop: 10, paddingBottom: 2 }}>
            <button className={`ph-chip ${!filters.category ? 'ph-chip--on' : ''}`} onClick={() => setF('category', filters.category || '')}>Tous</button>
            {categories.map((c) => <button key={c.id} className={`ph-chip ${filters.category === c.slug ? 'ph-chip--on' : ''}`} onClick={() => setF('category', c.slug)}>{c.name}</button>)}
            <span style={{ width: 1, background: 'var(--ph-line)', margin: '4px 2px' }} />
            {CAPS.map(([v, l]) => <button key={v} className={`ph-chip ${filters.capacity_min == v ? 'ph-chip--on' : ''}`} onClick={() => setF('capacity_min', String(v))}><Users size={13} />{l}</button>)}
            {BUDGETS.map(([v, l]) => <button key={v} className={`ph-chip ${filters.price_max == v ? 'ph-chip--on' : ''}`} onClick={() => setF('price_max', String(v))}>{l}</button>)}
          </div>
        </div>
      </div>

      <main className="ph-wrap" style={{ paddingTop: 18, paddingBottom: 110 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div aria-live="polite" style={{ fontSize: 14 }}>
            {loading ? 'Recherche…' : <><b>{count}</b> lieu{count > 1 ? 'x' : ''} {active.length ? 'correspondent à vos critères' : 'disponibles'}</>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to={mapHref} className="ph-chip"><MapIcon size={14} /> Carte</Link>
            <select className="ph-input" style={{ width: 'auto', minHeight: 40, borderRadius: 999, fontSize: 14 }} value={filters.ordering || '-is_featured'} onChange={(e) => apply({ ...filters, ordering: e.target.value })} aria-label="Trier">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {active.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {active.map(([k, v]) => (
              <button key={k} className="ph-chip ph-chip--on" onClick={() => apply({ ...filters, [k]: '' })} aria-label={`Retirer ${labels[k](v)}`}>{labels[k](v)} <X size={13} /></button>
            ))}
            <button className="ph-chip" onClick={clearAll}>Tout effacer</button>
          </div>
        )}

        {loading ? (
          <div className="ph-grid">{[...Array(6)].map((_, i) => <div key={i} className="vl-skel" />)}</div>
        ) : venues.length === 0 ? (
          <div className="ph-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <h3 className="ph-serif" style={{ fontSize: 22, margin: '0 0 6px' }}>Aucun lieu ne correspond</h3>
            <p className="ph-muted" style={{ margin: '0 0 18px' }}>Élargissez votre recherche ou retirez un filtre.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ph-btn ph-btn--green" onClick={clearAll}>Réinitialiser les filtres</button>
              <a className="ph-btn ph-btn--ghost" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Bonjour, je cherche un lieu pour mon événement.")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Nous écrire sur WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="ph-grid">
            {venues.map((v) => <Card key={v.id} v={v} fav={favs.includes(v.id)} onFav={toggleFav} inCompare={!!compare.find((c) => c.id === v.id)} onCompare={toggleCompare} />)}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <nav style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28, flexWrap: 'wrap' }} aria-label="Pagination">
            <button className="ph-chip vl-pg" disabled={page <= 1} onClick={() => goPage(page - 1)} aria-label="Page précédente"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, i, arr) => (
              <React.Fragment key={n}>
                {i > 0 && n - arr[i - 1] > 1 && <span style={{ alignSelf: 'center' }}>…</span>}
                <button className={`ph-chip vl-pg ${n === page ? 'ph-chip--on' : ''}`} onClick={() => goPage(n)} aria-current={n === page}>{n}</button>
              </React.Fragment>
            ))}
            <button className="ph-chip vl-pg" disabled={page >= totalPages} onClick={() => goPage(page + 1)} aria-label="Page suivante"><ChevronRight size={16} /></button>
          </nav>
        )}

        {!loading && venues.length > 0 && (
          <div className="ph-card" style={{ marginTop: 36, padding: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div><b>Besoin d'aide pour choisir ?</b><div className="ph-muted" style={{ fontSize: 14 }}>Décrivez votre événement, nous vous orientons vers les bons lieux.</div></div>
            <a className="ph-btn ph-btn--green" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Bonjour, pouvez-vous m'aider à trouver un lieu ?")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>
          </div>
        )}
      </main>

      {compare.length > 0 && (
        <div className="vl-tray" role="status">
          <span style={{ fontSize: 14 }}><GitCompare size={15} style={{ verticalAlign: -3 }} /> {compare.length} à comparer</span>
          {compare.length >= 2 ? <Link to="/comparer" className="ph-btn ph-btn--gold" style={{ minHeight: 38, padding: '0 16px' }}>Comparer</Link> : <span style={{ fontSize: 12, opacity: .7 }}>Choisissez-en un 2e</span>}
          <button className="ph-iconbtn" style={{ width: 34, height: 34 }} aria-label="Vider" onClick={() => { setCompare([]); try { localStorage.setItem('compareList', '[]'); } catch (_) {} }}><X size={15} /></button>
        </div>
      )}

      {sheet && (
        <div className="vl-sheet-bg" onMouseDown={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="vl-sheet" role="dialog" aria-label="Filtres">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <h2 className="ph-serif" style={{ margin: 0, fontSize: 22 }}>Filtres</h2>
              <button className="ph-iconbtn" style={{ background: 'var(--ph-sand)' }} onClick={() => setSheet(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="vl-sheet__body">
              <label className="ph-label">Ville</label>
              <select className="ph-input" value={draft.city || ''} onChange={(e) => setDraft({ ...draft, city: e.target.value, district: e.target.value === 'Abidjan' ? draft.district : '' })}>
                <option value="">Toutes les villes</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              {(!draft.city || draft.city === 'Abidjan') && <>
                <label className="ph-label" style={{ marginTop: 14 }}>Quartier</label>
                <select className="ph-input" value={draft.district || ''} onChange={(e) => setDraft({ ...draft, district: e.target.value })}>
                  <option value="">Tous les quartiers</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select></>}
              <label className="ph-label" style={{ marginTop: 14 }}>Nombre d'invités (minimum)</label>
              <input className="ph-input" type="number" inputMode="numeric" min="1" placeholder="Ex : 150" value={draft.capacity_min || ''} onChange={(e) => setDraft({ ...draft, capacity_min: e.target.value })} />
              <label className="ph-label" style={{ marginTop: 14 }}>Budget maximum par jour (FCFA)</label>
              <input className="ph-input" type="number" inputMode="numeric" min="0" step="50000" placeholder="Ex : 500000" value={draft.price_max || ''} onChange={(e) => setDraft({ ...draft, price_max: e.target.value })} />
              <label className="ph-label" style={{ marginTop: 14 }}>Catégorie</label>
              <select className="ph-input" value={draft.category || ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                <option value="">Toutes</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <label className="ph-label" style={{ marginTop: 14 }}>Équipements</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AMENITIES.map(([k, l, Icon]) => {
                  const on = draft[k] === 'true';
                  return <button key={k} type="button" aria-pressed={on} className={`ph-chip ${on ? 'ph-chip--on' : ''}`} onClick={() => setDraft({ ...draft, [k]: on ? '' : 'true' })}><Icon size={14} />{l}</button>;
                })}
              </div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, fontSize: 14 }}>
                <input type="checkbox" checked={draft.is_featured === 'true'} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked ? 'true' : '' })} /> Lieux en vedette uniquement
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--ph-line)' }}>
              <button className="ph-btn ph-btn--ghost" onClick={() => setDraft({ ordering: filters.ordering })}>Effacer</button>
              <button className="ph-btn ph-btn--green" style={{ flex: 1 }} onClick={() => { setSearchText(draft.search || searchText); apply({ ...draft, search: searchText, ordering: filters.ordering }); setSheet(false); }}>Voir les résultats</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}