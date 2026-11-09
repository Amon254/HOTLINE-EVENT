import React, { useRef } from 'react';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, Image as ImageIcon, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { SPACE_KINDS, SPACE_AMENITIES } from '../../api/spaces';

const MAX_PHOTOS = 8;
const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n || 0);
const QUICK = [
  ['Salle de réception', 'salle'], ['Jardin', 'jardin'], ['Terrasse / Rooftop', 'terrasse'],
  ['Salle de conférence', 'conference'], ['Salon VIP', 'vip'],
];

let counter = 0;
export const emptySpace = (open = true, preset = {}) => ({
  name: '', kind: 'salle', description: '',
  capacity_min: '', capacity_max: '', area_m2: '', price_per_day: '', price_per_hour: '',
  amenities: [], photos: [], coverIndex: 0, open, ...preset,
  key: `sp${Date.now()}_${counter++}`, // toujours unique, même pour une copie
});

/** Renvoie null si tout est valide, sinon { index, message } */
export function validateSpaces(spaces) {
  if (!spaces.length) return { index: -1, message: 'Ajoutez au moins un espace (salle, jardin…).' };
  for (let i = 0; i < spaces.length; i++) {
    const s = spaces[i], label = s.name.trim() || `Espace ${i + 1}`;
    if (!s.name.trim()) return { index: i, message: `${label} : donnez un nom à l'espace.` };
    const max = Number(s.capacity_max), min = Number(s.capacity_min || 1);
    if (!(max > 0)) return { index: i, message: `${label} : indiquez la capacité maximale.` };
    if (min > max) return { index: i, message: `${label} : la capacité minimale dépasse la maximale.` };
    if (!(Number(s.price_per_day) > 0)) return { index: i, message: `${label} : indiquez le prix par jour.` };
  }
  return null;
}

/** Valeurs agrégées envoyées au lieu (prix « à partir de », capacités) */
export function summarizeSpaces(spaces) {
  const valid = spaces.filter((s) => Number(s.price_per_day) > 0 && Number(s.capacity_max) > 0);
  if (!valid.length) return null;
  const hourly = valid.map((s) => Number(s.price_per_hour)).filter((n) => n > 0);
  return {
    price_per_day: Math.min(...valid.map((s) => Number(s.price_per_day))),
    price_per_hour: hourly.length ? Math.min(...hourly) : null,
    capacity_min: Math.min(...valid.map((s) => Number(s.capacity_min || 1))),
    capacity_max: Math.max(...valid.map((s) => Number(s.capacity_max))),
  };
}

const box = { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' };
const iconBtn = { background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' };

function Photos({ space, onChange }) {
  const ref = useRef(null);
  const add = (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const room = MAX_PHOTOS - space.photos.length;
    if (list.length > room) toast.error(`Maximum ${MAX_PHOTOS} photos par espace`);
    const ok = list.slice(0, Math.max(room, 0)).filter((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} dépasse 5 Mo`); return false; }
      return true;
    });
    if (ok.length) onChange({ photos: [...space.photos, ...ok.map((file) => ({ file, preview: URL.createObjectURL(file) }))] });
  };
  const remove = (j) => onChange({
    photos: space.photos.filter((_, i) => i !== j),
    coverIndex: space.coverIndex === j ? 0 : space.coverIndex > j ? space.coverIndex - 1 : space.coverIndex,
  });
  return (
    <div>
      <div
        onClick={() => ref.current && ref.current.click()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)', marginBottom: 10 }}
      >
        <ImageIcon size={22} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 6px' }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Glissez les photos de cette salle ou <b style={{ color: 'var(--brand-green)' }}>cliquez pour choisir</b>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>JPG, PNG, WEBP · 5 Mo max · {space.photos.length}/{MAX_PHOTOS}</div>
        <input ref={ref} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {space.photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
          {space.photos.map((p, j) => (
            <div key={j} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', border: `2px solid ${j === space.coverIndex ? 'var(--brand-green)' : 'var(--border)'}` }}>
              <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {j === space.coverIndex && <span style={{ position: 'absolute', left: 4, top: 4, background: 'var(--brand-green)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>COUVERTURE</span>}
              <div style={{ position: 'absolute', right: 4, top: 4, display: 'flex', gap: 4 }}>
                {j !== space.coverIndex && <button type="button" title="Définir comme couverture" onClick={() => onChange({ coverIndex: j })} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.92)', cursor: 'pointer', fontSize: 11 }}>⭐</button>}
                <button type="button" aria-label="Retirer la photo" onClick={() => remove(j)} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,.88)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} color="#fff" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpacesEditor({ spaces, onChange }) {
  const set = (i, patch) => onChange(spaces.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const add = (preset) => onChange([...spaces.map((s) => ({ ...s, open: false })), emptySpace(true, preset)]);
  const remove = (i) => {
    if (spaces.length === 1) return;
    if (!window.confirm(`Supprimer « ${spaces[i].name || 'cet espace'} » ?`)) return;
    onChange(spaces.filter((_, k) => k !== i));
  };
  const duplicate = (i) => {
    const s = spaces[i];
    const copy = emptySpace(true, { ...s, name: s.name ? `${s.name} (copie)` : '', photos: [], coverIndex: 0, amenities: [...s.amenities] });
    onChange([...spaces.slice(0, i + 1).map((x) => ({ ...x, open: false })), copy, ...spaces.slice(i + 1)]);
  };
  const toggleAmenity = (i, key) => {
    const cur = spaces[i].amenities;
    set(i, { amenities: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
  };
  const agg = summarizeSpaces(spaces);

  return (
    <div>
      <div style={{ background: '#E8F5EE', border: '1px solid #cfe7da', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--brand-green)', marginBottom: 16, lineHeight: 1.55 }}>
        Un lieu peut proposer <b>plusieurs espaces</b> (grande salle, jardin, rooftop, salon VIP…). Ajoutez chacun avec son
        <b> prix</b>, ses <b>caractéristiques</b> et ses <b>photos</b> : les clients choisiront l'espace à réserver.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {spaces.map((s, i) => {
          const err = validateSpaces([s]);
          const kind = (SPACE_KINDS.find((k) => k.value === s.kind) || {}).label;
          return (
            <div key={s.key} style={{ ...box, borderColor: s.open ? 'var(--brand-green)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 14px', background: s.open ? '#F4FAF6' : 'var(--white)' }}>
                <button type="button" onClick={() => set(i, { open: !s.open })} aria-expanded={s.open}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px', minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand-green)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Nouvel espace'}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                      {kind}{s.capacity_max ? ` · jusqu'à ${s.capacity_max} pers.` : ''}{s.price_per_day ? ` · ${fmt(s.price_per_day)} FCFA/j` : ''} · {s.photos.length} photo{s.photos.length > 1 ? 's' : ''}
                    </span>
                  </span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                {err && !s.open && <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>À compléter</span>}
                <button type="button" style={iconBtn} title="Dupliquer" aria-label="Dupliquer" onClick={() => duplicate(i)}><Copy size={15} /></button>
                <button type="button" style={{ ...iconBtn, color: '#dc2626', opacity: spaces.length === 1 ? 0.4 : 1 }} title="Supprimer" aria-label="Supprimer" disabled={spaces.length === 1} onClick={() => remove(i)}><Trash2 size={15} /></button>
                <button type="button" style={iconBtn} aria-label={s.open ? 'Réduire' : 'Développer'} onClick={() => set(i, { open: !s.open })}>{s.open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                </div>
              </div>

              {s.open && (
                <div style={{ padding: 18, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Nom de l'espace *</label>
                      <input className="input" placeholder="Ex : Grande salle Émeraude" value={s.name} onChange={(e) => set(i, { name: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Type d'espace</label>
                      <select className="input" value={s.kind} onChange={(e) => set(i, { kind: e.target.value })}>
                        {SPACE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">Description</label>
                    <textarea className="input" rows={2} style={{ resize: 'vertical' }} placeholder="Ambiance, disposition possible, ce qui est inclus…" value={s.description} onChange={(e) => set(i, { description: e.target.value })} />
                  </div>

                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> Capacité et tarifs</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Capacité min.</div>
                      <input className="input" type="number" min={1} inputMode="numeric" placeholder="20" value={s.capacity_min} onChange={(e) => set(i, { capacity_min: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Capacité max. *</div>
                      <input className="input" type="number" min={1} inputMode="numeric" placeholder="300" value={s.capacity_max} onChange={(e) => set(i, { capacity_max: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Surface (m²)</div>
                      <input className="input" type="number" min={1} inputMode="numeric" placeholder="250" value={s.area_m2} onChange={(e) => set(i, { area_m2: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Prix / jour (FCFA) *</div>
                      <input className="input" type="number" min={0} inputMode="numeric" placeholder="500000" value={s.price_per_day} onChange={(e) => set(i, { price_per_day: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Prix / heure (FCFA)</div>
                      <input className="input" type="number" min={0} inputMode="numeric" placeholder="Optionnel" value={s.price_per_hour} onChange={(e) => set(i, { price_per_hour: e.target.value })} />
                    </div>
                  </div>

                  <label className="form-label">Caractéristiques et équipements de cet espace</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    {SPACE_AMENITIES.map(({ key, label }) => {
                      const on = s.amenities.includes(key);
                      return (
                        <button key={key} type="button" aria-pressed={on} onClick={() => toggleAmenity(i, key)} style={{
                          padding: '6px 13px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          border: `1.5px solid ${on ? 'var(--brand-green)' : 'var(--border)'}`,
                          background: on ? '#E8F5EE' : 'var(--white)', color: on ? 'var(--brand-green)' : 'var(--text-secondary)', fontWeight: on ? 600 : 400,
                        }}>{on ? '✓ ' : ''}{label}</button>
                      );
                    })}
                  </div>

                  <label className="form-label">Photos de cet espace</label>
                  <Photos space={s} onChange={(patch) => set(i, patch)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={() => add()}><Plus size={15} /> Ajouter un espace</button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ou ajout rapide :</span>
        {QUICK.map(([label, kind]) => (
          <button key={kind} type="button" onClick={() => add({ name: label, kind })} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--text-secondary)' }}>+ {label}</button>
        ))}
      </div>

      {agg && (
        <div style={{ marginTop: 16, background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <span><b>{spaces.length}</b> espace{spaces.length > 1 ? 's' : ''}</span>
          <span>À partir de <b style={{ color: 'var(--brand-green)' }}>{fmt(agg.price_per_day)} FCFA</b> / jour</span>
          <span>De <b>{agg.capacity_min}</b> à <b>{agg.capacity_max}</b> personnes</span>
        </div>
      )}
    </div>
  );
}