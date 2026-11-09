import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { venueAPI } from '../api/venues';
import { X, Check, Minus, ArrowLeft } from 'lucide-react';

function formatPrice(p) { return p ? new Intl.NumberFormat('fr-CI').format(p) + ' FCFA' : '–'; }

const COMPARE_ROWS = [
  { label: 'Catégorie', key: v => v.category?.name || '–' },
  { label: 'Ville', key: v => `${v.district ? v.district + ', ' : ''}${v.city}` },
  { label: 'Capacité', key: v => `${v.capacity_min}–${v.capacity_max} pers.` },
  { label: 'Prix / jour', key: v => formatPrice(v.price_per_day), highlight: true },
  { label: 'Prix / heure', key: v => formatPrice(v.price_per_hour) },
  { label: 'Note', key: v => v.average_rating ? `${v.average_rating}/5 (${v.reviews_count} avis)` : 'Aucun avis' },
  { label: 'Parking', key: v => v.has_parking, bool: true },
  { label: 'Wifi', key: v => v.has_wifi, bool: true },
  { label: 'Traiteur', key: v => v.has_catering, bool: true },
  { label: 'Climatisation', key: v => v.has_ac, bool: true },
  { label: 'Groupe électrogène', key: v => v.has_generator, bool: true },
  { label: 'Sonorisation', key: v => v.has_sound_system, bool: true },
  { label: 'Vidéoprojecteur', key: v => v.has_projector, bool: true },
  { label: 'Sécurité', key: v => v.has_security, bool: true },
];

export default function ComparePage() {
  const navigate = useNavigate();
  // Read compareList once at mount — no need to re-run when it changes (it's localStorage)
  const [compareList] = useState(() => JSON.parse(localStorage.getItem('compareList') || '[]'));
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareList.length === 0) { setLoading(false); return; }
    Promise.all(compareList.map(v => venueAPI.getOne(v.slug)))
      .then(results => setVenues(results.map(r => r.data)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFromCompare = (id) => {
    const updated = compareList.filter(v => v.id !== id);
    localStorage.setItem('compareList', JSON.stringify(updated));
    setVenues(prev => prev.filter(v => v.id !== id));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (compareList.length === 0 || venues.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⊕</div>
      <h2 style={{ marginBottom: 12 }}>Aucun lieu à comparer</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Ajoutez des lieux à la comparaison depuis les fiches détaillées.
      </p>
      <Link to="/lieux" className="btn btn-primary">Explorer les lieux</Link>
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--brand-green)', padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.6rem' }}>Comparer les lieux</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{venues.length} lieu{venues.length > 1 ? 'x' : ''} en comparaison</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'var(--white)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <thead>
            <tr>
              <th style={{ width: 180, padding: '20px 20px', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                Critères
              </th>
              {venues.map(v => (
                <th key={v.id} style={{ padding: '16px 20px', textAlign: 'center', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => removeFromCompare(v.id)} style={{ position: 'absolute', top: -8, right: -8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={11} />
                    </button>
                    <img src={v.cover_image || `https://picsum.photos/seed/${v.id}/200/120`} alt={v.name}
                      style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</div>
                    <Link to={`/lieux/${v.slug}`} style={{ fontSize: 12, color: 'var(--brand-green)', fontWeight: 500 }}>Voir la fiche →</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map(({ label, key, bool, highlight }, idx) => (
              <tr key={label} style={{ background: idx % 2 === 0 ? 'var(--white)' : 'var(--surface)' }}>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  {label}
                </td>
                {venues.map(v => {
                  const val = key(v);
                  return (
                    <td key={v.id} style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', fontWeight: highlight ? 700 : 400, color: highlight ? 'var(--brand-green)' : 'var(--text-primary)' }}>
                      {bool
                        ? val ? <Check size={18} color="var(--brand-green)" style={{ margin: '0 auto' }} /> : <Minus size={18} color="var(--surface-3)" style={{ margin: '0 auto' }} />
                        : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-2)' }}>
              <td style={{ padding: '16px 20px' }} />
              {venues.map(v => (
                <td key={v.id} style={{ padding: '16px 20px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                  <Link to={`/lieux/${v.slug}`} className="btn btn-primary btn-sm">Réserver ce lieu</Link>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}