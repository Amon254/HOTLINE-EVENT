import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { venueAPI } from '../api/venues';
import {
  MapPin, Users, Star, X, ExternalLink, Wifi, ParkingCircle,
  ChefHat, Zap, Wind, Search, SlidersHorizontal, ChevronRight, Navigation
} from 'lucide-react';

function formatPrice(p) {
  return new Intl.NumberFormat('fr-CI').format(p) + ' FCFA';
}

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro', 'Korhogo', 'Man'];
const DISTRICTS = [
  'Plateau', 'Cocody', 'Marcory', 'Treichville', 'Adjamé',
  'Yopougon', 'Abobo', 'Riviera', 'Bingerville', 'Zone 4', 'Port-Bouet'
];
const AMENITY_FILTERS = [
  { key: 'has_parking', label: '🅿️ Parking' },
  { key: 'has_wifi', label: '📶 Wifi' },
  { key: 'has_catering', label: '🍽️ Traiteur' },
  { key: 'has_ac', label: '❄️ Clim' },
  { key: 'has_generator', label: '⚡ Groupe élec.' },
];

/* ─── ISOLATED MAP CONTAINER ───────────────────────────────────────────────
   React NEVER renders children inside mapWrapperRef.
   We manually create a <div> for Leaflet and append it,
   so React's reconciler never tries to removeChild from it.
   ─────────────────────────────────────────────────────────────────────────── */
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__lfp) return window.__lfp;
  const css = (href) => {
    document.querySelectorAll('link[data-lf]').forEach((n) => n.remove());
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-lf', '1');
    document.head.appendChild(l);
  };
  const js = (src) => new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = src;
    sc.onload = () => (window.L ? res(window.L) : rej(new Error('no L')));
    sc.onerror = () => rej(new Error('load'));
    document.head.appendChild(sc);
  });
  const bases = ['https://unpkg.com/leaflet@1.9.4/dist', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist'];
  window.__lfp = (async () => {
    for (const b of bases) {
      try { css(`${b}/leaflet.css`); return await js(`${b}/leaflet.js`); } catch (_) { /* essaie le suivant */ }
    }
    window.__lfp = null;
    throw new Error('Leaflet indisponible');
  })();
  return window.__lfp;
}

function LeafletMap({ onReady }) {
  const wrapperRef = useRef(null);       // React owns this outer div
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let dead = false, map = null, ro = null, el = null;
    loadLeaflet().then((L) => {
      if (dead || !wrapperRef.current) return;
      // div créé hors de React : Leaflet en est seul propriétaire
      el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0';
      wrapperRef.current.appendChild(el);
      map = L.map(el, { center: [5.3599, -4.0083], zoom: 11 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      ro = new ResizeObserver(() => map && map.invalidateSize());
      ro.observe(wrapperRef.current);
      setTimeout(() => map && map.invalidateSize(), 60);
      onReady(map);
    }).catch(() => { if (!dead) setFailed(true); });

    return () => {
      dead = true;
      if (ro) ro.disconnect();
      if (map) map.remove();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, [tick]); // eslint-disable-line

  return (
    <>
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, background: '#e5e3df' }} />
      {failed && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', fontSize: 13 }}>
          La carte n'a pas pu se charger (connexion).
          <div><button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => { setFailed(false); setTick(t => t + 1); }}>Réessayer</button></div>
        </div>
      )}
    </>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────── */
export default function MapPage() {
  const mapInstanceRef = useRef(null);   // shared Leaflet map instance
  const markersRef    = useRef([]);
  const selectedRef   = useRef(null);    // mirror of `selected` for marker closures

  const [leafletReady, setLeafletReady] = useState(false);
  const [allVenues,   setAllVenues]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showList,    setShowList]    = useState(true);

  const [filters, setFilters] = useState({
    search: '', city: '', district: '', category: '',
    capacity_min: '', price_max: '', price_min: '',
    has_parking: false, has_wifi: false, has_catering: false,
    has_ac: false, has_generator: false,
    ordering: '-created_at',
  });
  const updFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== 'ordering' && k !== 'search' && v !== '' && v !== false
  );
  const clearFilters = () => setFilters({
    search: '', city: '', district: '', category: '',
    capacity_min: '', price_max: '', price_min: '',
    has_parking: false, has_wifi: false, has_catering: false,
    has_ac: false, has_generator: false, ordering: '-created_at',
  });

  // Keep ref in sync so marker closures always read latest selected
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Called once by LeafletMap when the map is ready
  const handleMapReady = (map) => {
    mapInstanceRef.current = map;
    setLeafletReady(true);
  };

  // Fetch venues + categories
  useEffect(() => {
    const loadAll = async () => {
      let page = 1, out = [];
      for (;;) {
        const { data } = await venueAPI.getAll({ page });
        out = out.concat(data.results || data);
        if (!data.next || page >= 25) break;
        page += 1;
      }
      return out;
    };
    Promise.all([loadAll(), venueAPI.getCategories()]).then(([all, cRes]) => {
      const list = all.filter(v => v.latitude && v.longitude);
      setAllVenues(list);
      setFiltered(list);
      const cats = cRes.data;
      setCategories(Array.isArray(cats) ? cats : (cats.results || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Client-side filtering
  useEffect(() => {
    let r = [...allVenues];
    const { search, city, district, category, capacity_min,
      price_max, price_min, has_parking, has_wifi,
      has_catering, has_ac, has_generator, ordering } = filters;

    if (search) {
      const q = search.toLowerCase();
      r = r.filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.district || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q)
      );
    }
    if (city)         r = r.filter(v => v.city === city);
    if (district)     r = r.filter(v => (v.district || '').toLowerCase().includes(district.toLowerCase()));
    if (category)     r = r.filter(v => v.category?.slug === category);
    if (capacity_min) r = r.filter(v => v.capacity_max >= parseInt(capacity_min));
    if (price_max)    r = r.filter(v => parseFloat(v.price_per_day) <= parseFloat(price_max));
    if (price_min)    r = r.filter(v => parseFloat(v.price_per_day) >= parseFloat(price_min));
    if (has_parking)  r = r.filter(v => v.has_parking);
    if (has_wifi)     r = r.filter(v => v.has_wifi);
    if (has_catering) r = r.filter(v => v.has_catering);
    if (has_ac)       r = r.filter(v => v.has_ac);
    if (has_generator)r = r.filter(v => v.has_generator);

    if (ordering === 'price_per_day')  r.sort((a, b) => a.price_per_day - b.price_per_day);
    else if (ordering === '-price_per_day') r.sort((a, b) => b.price_per_day - a.price_per_day);
    else if (ordering === '-views_count')   r.sort((a, b) => b.views_count - a.views_count);
    else r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFiltered(r);
  }, [filters, allVenues]);

  // Rebuild markers whenever filtered list or selection changes
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !window.L) return;
    const L   = window.L;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filtered.forEach(venue => {
      const vid = venue.id;
      const isSelected = selectedRef.current?.id === vid;
      const bg   = isSelected ? '#C9A84C' : '#1B6B4A';
      const size = isSelected ? 36 : 28;

      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center">
          <div style="background:${bg};border:3px solid #fff;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            width:${size}px;height:${size}px;
            box-shadow:0 3px 10px rgba(0,0,0,0.4)"></div>
          <div style="background:${isSelected?'#C9A84C':'#fff'};
            color:${isSelected?'#fff':'#1a1a1a'};
            border:1px solid ${isSelected?'#b08030':'#ccc'};
            border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;
            margin-top:2px;white-space:nowrap;max-width:130px;
            overflow:hidden;text-overflow:ellipsis;
            box-shadow:0 1px 4px rgba(0,0,0,0.18)">${venue.name}</div>
        </div>`,
        iconSize:   [140, 56],
        iconAnchor: [70,  28],
      });

      const marker = L.marker([parseFloat(venue.latitude), parseFloat(venue.longitude)], { icon }).addTo(map);

      marker.on('click', () => {
        // Always look up from allVenues via closure-stable vid
        setSelected(prev => {
          // find venue from the latest list
          return window.__eventhotline_venues__?.find(v => v.id === vid) || prev;
        });
        map.flyTo([parseFloat(venue.latitude), parseFloat(venue.longitude)], 15, { duration: 0.6 });
      });

      markersRef.current.push(marker);
    });
  }, [filtered, selected, leafletReady]);

  // Cadrer la carte sur les lieux filtrés (si aucun lieu n'est sélectionné)
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !window.L || selectedRef.current || filtered.length === 0) return;
    const b = window.L.latLngBounds(filtered.map(v => [parseFloat(v.latitude), parseFloat(v.longitude)]));
    mapInstanceRef.current.fitBounds(b, { padding: [60, 60], maxZoom: 14 });
  }, [filtered, leafletReady]); // eslint-disable-line

  // Expose venues globally so marker click closures can always get fresh data
  useEffect(() => {
    window.__eventhotline_venues__ = allVenues;
    return () => { delete window.__eventhotline_venues__; };
  }, [allVenues]);

  const flyTo = (v) => {
    setSelected(v);
    mapInstanceRef.current?.flyTo([parseFloat(v.latitude), parseFloat(v.longitude)], 15, { duration: 0.6 });
  };

  const closeDetail = () => {
    setSelected(null);
    mapInstanceRef.current?.flyTo([5.3599, -4.0083], 11, { duration: 0.7 });
  };

  /* ── RENDER ── */
  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '10px 16px', zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
              placeholder="Nom, commune…"
              value={filters.search} onChange={e => updFilter('search', e.target.value)} />
          </div>

          <select className="input" style={{ flex: '0 1 150px', height: 38, fontSize: 13, padding: '0 28px 0 10px' }}
            value={filters.city} onChange={e => updFilter('city', e.target.value)}>
            <option value="">Toutes les villes</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="input" style={{ flex: '0 1 160px', height: 38, fontSize: 13, padding: '0 28px 0 10px' }}
            value={filters.district} onChange={e => updFilter('district', e.target.value)}>
            <option value="">Tous les quartiers</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <button onClick={() => setShowFilters(f => !f)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px',
            borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${showFilters ? 'var(--brand-green)' : 'var(--border)'}`,
            background: showFilters ? 'var(--brand-green)' : '#fff',
            color: showFilters ? '#fff' : 'var(--text-secondary)',
          }}>
            <SlidersHorizontal size={13} /> Filtres
            {hasActiveFilters && <span style={{ background: '#C9A84C', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#FEF2F2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <X size={12} /> Effacer
            </button>
          )}

          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
            <strong style={{ color: 'var(--brand-green)' }}>{filtered.length}</strong> lieu{filtered.length > 1 ? 'x' : ''}
          </span>
        </div>

        {showFilters && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Catégorie</div>
              <select className="input" style={{ height: 38, fontSize: 13, minWidth: 150, padding: '0 28px 0 10px' }}
                value={filters.category} onChange={e => updFilter('category', e.target.value)}>
                <option value="">Toutes</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Capacité min.</div>
              <input className="input" type="number" placeholder="100 pers." style={{ height: 36, fontSize: 13, width: 110 }}
                value={filters.capacity_min} onChange={e => updFilter('capacity_min', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Budget min (FCFA)</div>
              <input className="input" type="number" placeholder="200 000" style={{ height: 36, fontSize: 13, width: 128 }}
                value={filters.price_min} onChange={e => updFilter('price_min', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Budget max (FCFA)</div>
              <input className="input" type="number" placeholder="1 000 000" style={{ height: 36, fontSize: 13, width: 128 }}
                value={filters.price_max} onChange={e => updFilter('price_max', e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Trier par</div>
              <select className="input" style={{ height: 38, fontSize: 13, minWidth: 148, padding: '0 28px 0 10px' }}
                value={filters.ordering} onChange={e => updFilter('ordering', e.target.value)}>
                <option value="-created_at">Plus récents</option>
                <option value="price_per_day">Prix croissant</option>
                <option value="-price_per_day">Prix décroissant</option>
                <option value="-views_count">Populaires</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Équipements</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AMENITY_FILTERS.map(({ key, label }) => (
                  <button key={key} onClick={() => updFilter(key, !filters[key])} style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1.5px solid ${filters[key] ? 'var(--brand-green)' : 'var(--border)'}`,
                    background: filters[key] ? '#E8F5EE' : '#fff',
                    color: filters[key] ? 'var(--brand-green)' : 'var(--text-secondary)',
                    fontWeight: filters[key] ? 600 : 400,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* LEFT LIST */}
        <div style={{
          width: showList ? 278 : 0, minWidth: showList ? 278 : 0,
          background: '#fff', borderRight: '1px solid var(--border)',
          overflowY: 'auto', overflowX: 'hidden', flexShrink: 0,
          transition: 'width 0.2s ease, min-width 0.2s ease',
          zIndex: 10,
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>Aucun résultat
            </div>
          ) : filtered.map(v => (
            <button key={v.id} onClick={() => flyTo(v)} style={{
              width: '100%', padding: '11px 12px', textAlign: 'left',
              background: selected?.id === v.id ? '#E8F5EE' : '#fff',
              border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
              borderLeft: `4px solid ${selected?.id === v.id ? 'var(--brand-green)' : 'transparent'}`,
              transition: 'background 0.12s',
            }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <img src={v.cover_image || `https://picsum.photos/seed/${v.id}/80/60`}
                  alt={v.name} style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                    <MapPin size={9} /> {v.district || v.city}
                    {v.average_rating && <span style={{ marginLeft: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Star size={9} fill="#C9A84C" color="#C9A84C" />{v.average_rating}
                    </span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-green)' }}>
                      {formatPrice(v.price_per_day)}<span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 10 }}>/j</span>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Users size={9} />{v.capacity_max}
                    </span>
                  </div>
                </div>
                {selected?.id === v.id && <ChevronRight size={12} style={{ color: 'var(--brand-green)', flexShrink: 0, marginTop: 8 }} />}
              </div>
            </button>
          ))}
        </div>

        {/* Toggle list */}
        <button onClick={() => setShowList(s => !s)} style={{
          position: 'absolute', left: showList ? 270 : 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, background: '#fff', border: '1px solid var(--border)',
          borderRadius: '0 8px 8px 0', width: 20, height: 48, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 0 6px rgba(0,0,0,0.1)', transition: 'left 0.2s ease',
          fontSize: 13, color: 'var(--text-muted)',
        }}>
          {showList ? '‹' : '›'}
        </button>

        {/* MAP AREA */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>

          {/* Leaflet lives here — React never puts children inside LeafletMap */}
          <LeafletMap onReady={handleMapReady} />

          {/* DETAIL PANEL — floats over the map, fully owned by React */}
          {selected && (
            <div style={{
              position: 'absolute', top: 12, right: 12, bottom: 12,
              width: 340, background: '#fff', borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              zIndex: 1000, overflowY: 'auto', border: '1px solid var(--border)',
              animation: 'panelIn 0.2s ease',
            }}>
              <style>{`@keyframes panelIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

              {/* Close */}
              <button onClick={closeDetail} style={{
                position: 'absolute', top: 10, right: 10, zIndex: 10,
                background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                <X size={14} />
              </button>

              {/* Cover image */}
              <div style={{ height: 185, overflow: 'hidden', borderRadius: '16px 16px 0 0', position: 'relative' }}>
                <img src={selected.cover_image || `https://picsum.photos/seed/${selected.id}/700/400`}
                  alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {selected.is_featured && (
                  <div style={{ position: 'absolute', top: 10, left: 10, background: '#C9A84C', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⭐ VEDETTE</div>
                )}
                {selected.category && (
                  <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                    {selected.category.name}
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 18px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 5, lineHeight: 1.3 }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MapPin size={11} /> {selected.district ? `${selected.district}, ` : ''}{selected.city}
                  </span>
                  {selected.average_rating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
                      <Star size={11} fill="#C9A84C" color="#C9A84C" />
                      <strong>{selected.average_rating}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>({selected.reviews_count} avis)</span>
                    </span>
                  )}
                </div>

                {/* Price + capacity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>À partir de</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-green)' }}>{formatPrice(selected.price_per_day)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>/ jour</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Capacité</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} color="var(--brand-green)" />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.capacity_min}–{selected.capacity_max}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>personnes</div>
                  </div>
                </div>

                {selected.short_description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    {selected.short_description}
                  </p>
                )}

                {/* Amenities */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Équipements</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[
                      [selected.has_parking,  <ParkingCircle size={9}/>, 'Parking'],
                      [selected.has_wifi,     <Wifi size={9}/>,          'Wifi'],
                      [selected.has_catering, <ChefHat size={9}/>,       'Traiteur'],
                      [selected.has_ac,       <Wind size={9}/>,          'Clim'],
                      [selected.has_generator,<Zap size={9}/>,           'Groupe élec.'],
                    ].map(([has, icon, label]) => has ? (
                      <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', background:'#E8F5EE', borderRadius:20, fontSize:11, color:'var(--brand-green)', fontWeight:500 }}>
                        {icon} {label}
                      </span>
                    ) : null)}
                    {!selected.has_parking && !selected.has_wifi && !selected.has_catering && !selected.has_ac && !selected.has_generator && (
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>Non renseigné</span>
                    )}
                  </div>
                </div>

                {/* Event types */}
                {selected.event_types?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Types d'événements</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {selected.event_types.map(t => (
                        <span key={t} style={{ padding:'2px 8px', background:'#FFF8E7', borderRadius:20, fontSize:11, color:'#A07020', fontWeight:500 }}>
                          {t.charAt(0).toUpperCase()+t.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPS */}
                <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 14, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Navigation size={10} color="var(--brand-green)" />
                  {parseFloat(selected.latitude).toFixed(5)}, {parseFloat(selected.longitude).toFixed(5)}
                  <a href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ marginLeft:'auto', color:'var(--brand-green)', display:'flex', alignItems:'center', gap:3, fontWeight:600, fontSize:11 }}>
                    <ExternalLink size={10}/> Google Maps
                  </a>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to={`/lieux/${selected.slug}`} className="btn btn-primary"
                    style={{ textAlign:'center', justifyContent:'center' }}>
                    Voir la fiche complète
                  </Link>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:6 }}>
                    <MapPin size={13}/> Itinéraire
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}