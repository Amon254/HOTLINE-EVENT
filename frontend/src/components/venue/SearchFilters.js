import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const ABIDJAN_DISTRICTS = [
  'Plateau', 'Cocody', 'Marcory', 'Treichville', 'Adjamé',
  'Yopougon', 'Abobo', 'Riviera', 'Bingerville', 'Angré',
  'Deux Plateaux', 'Zone 4', 'Port-Bouet'
];

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro', 'Korhogo', 'Man'];

export default function SearchFilters({ filters, onChange, categories: categoriesProp = [] }) {
  const categories = Array.isArray(categoriesProp) ? categoriesProp : (categoriesProp?.results || []);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  const clearAll = () => onChange({
    search: '', city: '', district: '', capacity_min: '', price_max: '',
    price_min: '', category: '', has_parking: false, has_wifi: false,
    has_catering: false, has_ac: false, has_generator: false,
    ordering: '-created_at'
  });

  const hasActiveFilters = Object.entries(filters).some(([k, v]) =>
    k !== 'ordering' && v !== '' && v !== false
  );

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: showAdvanced ? 20 : 0 }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 38 }}
            placeholder="Rechercher un lieu, quartier…"
            value={filters.search || ''}
            onChange={e => update('search', e.target.value)} />
        </div>

        <select className="input" style={{ flex: '0 1 160px' }}
          value={filters.city || ''} onChange={e => update('city', e.target.value)}>
          <option value="">Toutes les villes</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="input" style={{ flex: '0 1 160px' }}
          value={filters.district || ''} onChange={e => update('district', e.target.value)}>
          <option value="">Tous les quartiers</option>
          {ABIDJAN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <button className={`btn ${showAdvanced ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowAdvanced(!showAdvanced)}>
          <SlidersHorizontal size={15} />
          Filtres {hasActiveFilters && <span style={{ background: 'var(--brand-gold)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>!</span>}
        </button>

        {hasActiveFilters && (
          <button className="btn btn-ghost" onClick={clearAll} style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
            <X size={14} /> Effacer
          </button>
        )}
      </div>

      {showAdvanced && (
        <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Capacité minimale</label>
              <input className="input" type="number" placeholder="Ex: 100 personnes"
                value={filters.capacity_min || ''} onChange={e => update('capacity_min', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Budget max (FCFA/jour)</label>
              <input className="input" type="number" placeholder="Ex: 500 000"
                value={filters.price_max || ''} onChange={e => update('price_max', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Catégorie</label>
              <select className="input" value={filters.category || ''} onChange={e => update('category', e.target.value)}>
                <option value="">Toutes catégories</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Trier par</label>
              <select className="input" value={filters.ordering || '-created_at'} onChange={e => update('ordering', e.target.value)}>
                <option value="-created_at">Plus récents</option>
                <option value="price_per_day">Prix croissant</option>
                <option value="-price_per_day">Prix décroissant</option>
                <option value="-views_count">Populaires</option>
                <option value="capacity_max">Petite capacité</option>
                <option value="-capacity_max">Grande capacité</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Équipements requis</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'has_parking', label: '🅿️ Parking' },
                { key: 'has_wifi', label: '📶 Wifi' },
                { key: 'has_catering', label: '🍽️ Traiteur' },
                { key: 'has_ac', label: '❄️ Climatisation' },
                { key: 'has_generator', label: '⚡ Groupe élec.' },
                { key: 'has_sound_system', label: '🔊 Sonorisation' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => update(key, !filters[key])} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${filters[key] ? 'var(--brand-green)' : 'var(--border)'}`,
                  background: filters[key] ? '#E8F5EE' : 'var(--white)',
                  color: filters[key] ? 'var(--brand-green)' : 'var(--text-secondary)',
                  fontWeight: filters[key] ? 600 : 400, transition: 'all 0.15s'
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}