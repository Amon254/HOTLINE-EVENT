import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueAPI } from '../api/venues';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { spaceAPI } from '../api/spaces';
import SpacesEditor, { emptySpace, validateSpaces, summarizeSpaces } from '../components/venue/SpacesEditor';
import { MapPin, Crosshair, Navigation, X, Play, Link as LinkIcon, Trash2, Image } from 'lucide-react';

const AMENITY_OPTIONS = [
  { key: 'has_parking',     label: '🅿️ Parking' },
  { key: 'has_wifi',        label: '📶 Wifi' },
  { key: 'has_catering',    label: '🍽️ Traiteur inclus' },
  { key: 'has_ac',          label: '❄️ Climatisation' },
  { key: 'has_generator',   label: '⚡ Groupe électrogène' },
  { key: 'has_sound_system',label: '🔊 Sonorisation' },
  { key: 'has_projector',   label: '📽️ Vidéoprojecteur' },
  { key: 'has_security',    label: '🛡️ Sécurité' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'mariage',      label: 'Mariage' },
  { value: 'corporate',    label: "Événement d'entreprise" },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'conference',   label: 'Conférence' },
  { value: 'concert',      label: 'Concert / Spectacle' },
  { value: 'cocktail',     label: 'Cocktail / Réception' },
  { value: 'exposition',   label: 'Exposition' },
  { value: 'autre',        label: 'Autre' },
];

const DEFAULT_LAT = 5.3599517;
const DEFAULT_LNG = -4.0082563;

/* ─── CARTE LEAFLET ISOLÉE (pas de conflit removeChild) ─────────────────── */
function LocationMap({ lat, lng, onLocationChange }) {
  const wrapperRef  = useRef(null);
  const leafletEl   = useRef(null);
  const mapRef      = useRef(null);
  const markerRef   = useRef(null);
  const onChangeRef = useRef(onLocationChange);
  const [ready, setReady] = useState(false);

  useEffect(() => { onChangeRef.current = onLocationChange; }, [onLocationChange]);

  useEffect(() => {
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;height:300px';
    leafletEl.current = el;
    if (wrapperRef.current) wrapperRef.current.appendChild(el);

    const makeIcon = (L) => L.divIcon({
      className: '',
      html: '<div style="background:#1B6B4A;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10],
    });

    const initMap = () => {
      if (mapRef.current) return;
      const L = window.L;
      const map = L.map(el).setView([lat || DEFAULT_LAT, lng || DEFAULT_LNG], lat ? 15 : 12);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], { icon: makeIcon(L), draggable: true }).addTo(map);
        markerRef.current.on('dragend', e => {
          const p = e.target.getLatLng();
          onChangeRef.current(+p.lat.toFixed(6), +p.lng.toFixed(6));
        });
      }

      map.on('click', e => {
        const newLat = +e.latlng.lat.toFixed(6);
        const newLng = +e.latlng.lng.toFixed(6);
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng], { icon: makeIcon(L), draggable: true }).addTo(map);
          markerRef.current.on('dragend', ev => {
            const p = ev.target.getLatLng();
            onChangeRef.current(+p.lat.toFixed(6), +p.lng.toFixed(6));
          });
        }
        onChangeRef.current(newLat, newLng);
      });
      setReady(true);
    };

    if (window.L) {
      initMap();
    } else {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.querySelector('script[src*="leaflet.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        const t = setInterval(() => { if (window.L) { clearInterval(t); initMap(); } }, 80);
      }
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      try { if (wrapperRef.current && el.parentNode === wrapperRef.current) wrapperRef.current.removeChild(el); } catch (_) {}
      leafletEl.current = null; markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || !window.L || !lat || !lng) return;
    const L = window.L;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({ className: '', html: '<div style="background:#1B6B4A;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>', iconSize: [20,20], iconAnchor: [10,10] });
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', e => { const p = e.target.getLatLng(); onChangeRef.current(+p.lat.toFixed(6), +p.lng.toFixed(6)); });
    }
    mapRef.current.setView([lat, lng], 16);
  }, [lat, lng]);

  return (
    <div style={{ position: 'relative', borderRadius: 12, border: '1.5px solid var(--border)', overflow: 'hidden', background: '#e8e5dc', height: 300 }}>
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}

/* ─── UPLOAD PHOTOS ──────────────────────────────────────────────────────── */
function PhotoUploader({ photos, onAdd, onRemove, onSetCover, coverIndex }) {
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (photos.length + files.length > 10) { toast.error('Maximum 10 photos'); return; }
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} dépasse 5 Mo`); return; }
      onAdd({ file, preview: URL.createObjectURL(file) });
    });
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith('image/'))
      .forEach(file => onAdd({ file, preview: URL.createObjectURL(file) }));
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed var(--border)', borderRadius: 12, padding: '28px 20px',
          textAlign: 'center', cursor: 'pointer', background: 'var(--surface)',
          transition: 'all 0.2s', marginBottom: 16,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-green)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <Image size={32} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', display: 'block' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Glissez vos photos ici ou <span style={{ color: 'var(--brand-green)', fontWeight: 600 }}>cliquez pour sélectionner</span>
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, WEBP · max 5 Mo par photo · {photos.length}/10</p>
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFiles} />
      </div>

      {/* Preview grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === coverIndex ? 'var(--brand-green)' : 'var(--border)'}`, aspectRatio: '4/3' }}>
              <img src={photo.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {/* Cover badge */}
              {i === coverIndex && (
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--brand-green)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>
                  COUVERTURE
                </div>
              )}

              {/* Action buttons */}
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                {i !== coverIndex && (
                  <button type="button" onClick={() => onSetCover(i)} title="Définir comme couverture"
                    style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ⭐
                  </button>
                )}
                <button type="button" onClick={() => onRemove(i)}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={11} color="#fff" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── GESTION VIDÉOS ─────────────────────────────────────────────────────── */
function VideoManager({ videos, onAdd, onRemove }) {
  const videoInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [tab, setTab] = useState('link'); // 'link' | 'file'

  const addLink = () => {
    if (!videoUrl.trim()) { toast.error('Entrez un lien vidéo'); return; }
    if (videos.length >= 5) { toast.error('Maximum 5 vidéos'); return; }
    const url = videoUrl.trim();
    // Extract YouTube/Vimeo thumbnail
    let thumb = null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) thumb = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    onAdd({ type: 'link', url, title: videoTitle.trim() || url, thumb });
    setVideoUrl(''); setVideoTitle('');
  };

  const addFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (videos.length >= 5) { toast.error('Maximum 5 vidéos'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('Fichier trop lourd (max 100 Mo)'); return; }
    onAdd({ type: 'file', file, title: file.name, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  return (
    <div>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--surface-2)', borderRadius: 10, padding: 4, marginBottom: 16, width: 'fit-content' }}>
        {[{ id: 'link', icon: <LinkIcon size={13} />, label: 'Lien YouTube / Vimeo' }, { id: 'file', icon: <Play size={13} />, label: 'Fichier vidéo' }].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--brand-green)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 600 : 400, fontSize: 13,
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Link input */}
      {tab === 'link' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Lien YouTube ou Vimeo</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Titre (optionnel)</label>
            <input className="input" placeholder="Visite virtuelle…" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
          </div>
          <button type="button" onClick={addLink} className="btn btn-primary btn-sm" style={{ flexShrink: 0, height: 40 }}>
            + Ajouter
          </button>
        </div>
      )}

      {/* File input */}
      {tab === 'file' && (
        <div
          onClick={() => videoInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)', borderRadius: 12, padding: '20px',
            textAlign: 'center', cursor: 'pointer', background: 'var(--surface)',
          }}
        >
          <Play size={28} style={{ margin: '0 auto 8px', color: 'var(--text-muted)', display: 'block' }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Cliquez pour sélectionner une vidéo <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(MP4, MOV — max 100 Mo)</span>
          </p>
          <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={addFile} />
        </div>
      )}

      {/* Video list */}
      {videos.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {videos.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              {/* Thumbnail / icon */}
              <div style={{ width: 56, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v.thumb ? (
                  <img src={v.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : v.preview ? (
                  <video src={v.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Play size={18} color="#fff" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {v.type === 'link' ? '🔗 Lien externe' : '📁 Fichier local'}
                </div>
              </div>
              <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PAGE PRINCIPALE ────────────────────────────────────────────────────── */
export default function AddVenuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Form data
  const [form, setForm] = useState({
    name: '', slug: '', category: '', description: '', short_description: '',
    address: '', city: 'Abidjan', district: '',
    latitude: '', longitude: '',
    capacity_min: 1, capacity_max: '', price_per_day: '', price_per_hour: '',
    event_types: [],
    has_parking: false, has_wifi: false, has_catering: false,
    has_ac: false, has_generator: false, has_sound_system: false,
    has_projector: false, has_security: false,
  });

  // Media
  const [photos, setPhotos]     = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [videos, setVideos]     = useState([]);

  // Espaces / salles (chacun avec ses prix, caractéristiques et photos)
  const [spaces, setSpaces]     = useState(() => [emptySpace(true)]);

  useEffect(() => {
    if (!user || user.role !== 'manager') navigate('/connexion');
    venueAPI.getCategories().then(({ data }) => {
      setCategories(Array.isArray(data) ? data : (data.results || []));
    });
  }, [user, navigate]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generateSlug = (name) => name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const toggleEventType = (value) => {
    const updated = form.event_types.includes(value)
      ? form.event_types.filter(t => t !== value)
      : [...form.event_types, value];
    upd('event_types', updated);
  };

  const addPhoto    = useCallback(photo => setPhotos(p => [...p, photo]), []);
  const removePhoto = (i) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    if (coverIndex >= i && coverIndex > 0) setCoverIndex(c => c - 1);
  };
  const addVideo    = useCallback(video => setVideos(v => [...v, video]), []);
  const removeVideo = (i) => setVideos(v => v.filter((_, idx) => idx !== i));

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error('Géolocalisation non supportée'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        upd('latitude',  parseFloat(pos.coords.latitude.toFixed(6)));
        upd('longitude', parseFloat(pos.coords.longitude.toFixed(6)));
        toast.success('Position GPS détectée !');
        setGpsLoading(false);
      },
      () => { toast.error('Impossible de détecter votre position'); setGpsLoading(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 5) return; // ne soumettre que depuis la dernière étape
    if (!form.latitude || !form.longitude) {
      toast.error('Veuillez indiquer la localisation sur la carte (étape 2)');
      setStep(2); return;
    }
    const spaceErr = validateSpaces(spaces);
    if (spaceErr) {
      toast.error(spaceErr.message);
      if (spaceErr.index >= 0) setSpaces(sp => sp.map((x, k) => ({ ...x, open: k === spaceErr.index })));
      setStep(3); return;
    }
    setLoading(true);
    try {
      // 1. Créer le lieu : prix « à partir de » et capacités déduits des espaces
      const agg = summarizeSpaces(spaces);
      const { data: venue } = await venueAPI.create({
        ...form,
        capacity_min: agg.capacity_min,
        capacity_max: agg.capacity_max,
        price_per_day: agg.price_per_day,
        price_per_hour: agg.price_per_hour,
      });
      const slug = venue.slug;

      // 2. Upload cover photo first, then rest
      const orderedPhotos = photos.length > 0
        ? [photos[coverIndex], ...photos.filter((_, i) => i !== coverIndex)]
        : [];
      for (let i = 0; i < orderedPhotos.length; i++) {
        const fd = new FormData();
        fd.append('image', orderedPhotos[i].file);
        fd.append('caption', '');
        fd.append('is_primary', i === 0 ? 'true' : 'false');
        await venueAPI.uploadImage(slug, fd).catch(() => {});
      }

      // 3. Upload videos
      for (let i = 0; i < videos.length; i++) {
        const fd = new FormData();
        fd.append('title', videos[i].title || '');
        if (videos[i].type === 'link') fd.append('video_url', videos[i].url);
        else fd.append('video_file', videos[i].file);
        await venueAPI.uploadVideo(slug, fd).catch(() => {});
      }

      // 4. Créer les espaces, puis leurs photos (couverture en premier)
      const failed = [];
      for (let i = 0; i < spaces.length; i++) {
        const sp = spaces[i];
        try {
          const { data: created } = await spaceAPI.create({
            venue: venue.id, name: sp.name.trim(), kind: sp.kind, description: sp.description,
            capacity_min: Number(sp.capacity_min || 1), capacity_max: Number(sp.capacity_max),
            area_m2: sp.area_m2 ? Number(sp.area_m2) : null,
            price_per_day: Number(sp.price_per_day),
            price_per_hour: sp.price_per_hour ? Number(sp.price_per_hour) : null,
            amenities: sp.amenities, order: i,
          });
          const ordered = sp.photos.length ? [sp.photos[sp.coverIndex], ...sp.photos.filter((_, k) => k !== sp.coverIndex)] : [];
          for (let j = 0; j < ordered.length; j++) {
            const fd = new FormData();
            fd.append('image', ordered[j].file);
            fd.append('is_primary', j === 0 ? 'true' : 'false');
            await spaceAPI.uploadImage(created.id, fd).catch(() => failed.push(`photo de « ${sp.name} »`));
          }
        } catch (_) {
          failed.push(`espace « ${sp.name} »`);
        }
      }
      if (failed.length) toast.error(`Lieu créé, mais échec : ${failed.join(', ')}. Vous pourrez les ajouter plus tard.`, { duration: 7000 });
      else toast.success(`Lieu créé avec ${spaces.length} espace${spaces.length > 1 ? 's' : ''} !`);
      navigate(`/lieux/${slug}`);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.entries(errors).forEach(([k, v]) => toast.error(`${k}: ${v}`));
      else toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['Informations', 'Localisation', 'Espaces & salles', 'Équipements du lieu', 'Photos & Vidéos'];

  const goNext = () => {
    if (step === 3) {
      const err = validateSpaces(spaces);
      if (err) {
        toast.error(err.message);
        if (err.index >= 0) setSpaces(sp => sp.map((x, k) => ({ ...x, open: k === err.index })));
        return;
      }
    }
    setStep(s => s + 1);
  };

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--brand-green)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: 4 }}>Référencer un nouveau lieu</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Remplissez les informations de votre espace événementiel</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>

        {/* ── Steps bar ── */}
        <div style={{ display: 'flex', marginBottom: 32, background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i + 1)} style={{
              flex: 1, minWidth: 128, whiteSpace: 'nowrap', padding: '13px 10px', border: 'none', cursor: 'pointer',
              background: step === i + 1 ? 'var(--brand-green)' : step > i + 1 ? '#E8F5EE' : 'var(--white)',
              color:      step === i + 1 ? '#fff'               : step > i + 1 ? 'var(--brand-green)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600,
              borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--border)', marginBottom: 20 }}>

            {/* ── ÉTAPE 1 : Informations ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Informations de base</h2>
                <div className="form-group">
                  <label className="form-label">Nom du lieu *</label>
                  <input className="input" placeholder="Ex: Salle Émeraude Cocody"
                    value={form.name}
                    onChange={e => { upd('name', e.target.value); upd('slug', generateSlug(e.target.value)); }}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug URL (auto-généré)</label>
                  <input className="input" value={form.slug} onChange={e => upd('slug', e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>eventhotline.ci/lieux/{form.slug || '...'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select className="input" value={form.category} onChange={e => upd('category', e.target.value)} required>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description courte *</label>
                  <input className="input" placeholder="Résumé accrocheur (300 car. max)"
                    value={form.short_description} maxLength={300}
                    onChange={e => upd('short_description', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description complète *</label>
                  <textarea className="input" rows={5}
                    placeholder="Décrivez votre lieu : ambiance, services inclus, politique de réservation…"
                    value={form.description} onChange={e => upd('description', e.target.value)}
                    style={{ resize: 'vertical' }} required />
                </div>
                <div>
                  <label className="form-label">Types d'événements acceptés</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EVENT_TYPE_OPTIONS.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => toggleEventType(value)} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: `1.5px solid ${form.event_types.includes(value) ? 'var(--brand-green)' : 'var(--border)'}`,
                        background: form.event_types.includes(value) ? '#E8F5EE' : 'var(--white)',
                        color: form.event_types.includes(value) ? 'var(--brand-green)' : 'var(--text-secondary)',
                        fontWeight: form.event_types.includes(value) ? 600 : 400,
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 : Localisation & Prix ── */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Localisation</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Ville *</label>
                    <select className="input" value={form.city} onChange={e => upd('city', e.target.value)}>
                      {['Abidjan','Bouaké','Daloa','San-Pédro','Yamoussoukro','Korhogo','Man'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Commune / Quartier</label>
                    <input className="input" placeholder="Ex: Cocody, Plateau, Zone 4"
                      value={form.district} onChange={e => upd('district', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse complète *</label>
                  <input className="input" placeholder="Ex: Rue des Jardins, Cocody, Abidjan"
                    value={form.address} onChange={e => upd('address', e.target.value)} required />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>📍 Position sur la carte *</label>
                    <button type="button" onClick={handleGPS} disabled={gpsLoading} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                      background: '#E8F5EE', color: 'var(--brand-green)', border: '1.5px solid var(--brand-green)',
                      borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <Navigation size={12} /> {gpsLoading ? 'Détection…' : 'Ma position GPS'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    Cliquez sur la carte pour placer le marqueur, ou glissez-le à l'endroit exact.
                  </p>

                  <LocationMap
                    lat={form.latitude ? parseFloat(form.latitude) : null}
                    lng={form.longitude ? parseFloat(form.longitude) : null}
                    onLocationChange={(lat, lng) => { upd('latitude', lat); upd('longitude', lng); }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11 }}>Latitude</label>
                      <input className="input" type="number" step="0.000001" placeholder="5.359952"
                        value={form.latitude} onChange={e => upd('latitude', e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: 13 }} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11 }}>Longitude</label>
                      <input className="input" type="number" step="0.000001" placeholder="-4.008256"
                        value={form.longitude} onChange={e => upd('longitude', e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: 13 }} />
                    </div>
                  </div>

                  {form.latitude && form.longitude && (
                    <div style={{ marginTop: 8, padding: '7px 12px', background: '#E8F5EE', borderRadius: 8, fontSize: 12, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Crosshair size={12} /> Position : {form.latitude}, {form.longitude}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 : Espaces & salles ── */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Espaces & salles</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Décrivez chaque espace réservable de votre lieu : prix, capacité, caractéristiques et photos.
                </p>
                <SpacesEditor spaces={spaces} onChange={setSpaces} />
              </div>
            )}

            {/* ── ÉTAPE 4 : Équipements ── */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Équipements communs du lieu</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Ce qui est disponible pour l'ensemble du lieu. Les équipements propres à chaque salle se règlent à l'étape précédente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
                  {AMENITY_OPTIONS.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => upd(key, !form[key])} style={{
                      padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer',
                      border: `2px solid ${form[key] ? 'var(--brand-green)' : 'var(--border)'}`,
                      background: form[key] ? '#E8F5EE' : 'var(--white)',
                      color: form[key] ? 'var(--brand-green)' : 'var(--text-secondary)',
                      fontWeight: form[key] ? 600 : 400, textAlign: 'left',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ÉTAPE 5 : Photos & Vidéos ── */}
            {step === 5 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Photos & Vidéos</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Photos générales du lieu (entrée, extérieur, ambiance). Les photos de chaque salle s'ajoutent à l'étape « Espaces & salles ». Cliquez ⭐ sur une photo pour la définir comme image de couverture.
                </p>

                {/* Photos */}
                <div style={{ marginBottom: 32 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>
                    📸 Photos générales du lieu <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(max 10 · {photos.length} ajoutée{photos.length > 1 ? 's' : ''})</span>
                  </label>
                  <PhotoUploader
                    photos={photos}
                    onAdd={addPhoto}
                    onRemove={removePhoto}
                    onSetCover={setCoverIndex}
                    coverIndex={coverIndex}
                  />
                </div>

                {/* Videos */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>
                    🎬 Vidéos du lieu <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(max 5 · {videos.length} ajoutée{videos.length > 1 ? 's' : ''})</span>
                  </label>
                  <VideoManager videos={videos} onAdd={addVideo} onRemove={removeVideo} />
                </div>

                {/* Récapitulatif final */}
                <div style={{ marginTop: 28, background: 'var(--surface-2)', borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Récapitulatif avant soumission</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    {[
                      ['Nom',         form.name || '–'],
                      ['Ville',       `${form.district || ''} ${form.city}`.trim()],
                      ['Espaces',     `${spaces.length} espace${spaces.length > 1 ? 's' : ''} · ${spaces.reduce((n, x) => n + x.photos.length, 0)} photo(s)`],
                      ['À partir de', (() => { const a = summarizeSpaces(spaces); return a ? `${new Intl.NumberFormat('fr-CI').format(a.price_per_day)} FCFA / jour` : '⚠️ Prix manquant'; })()],
                      ['Capacité',    (() => { const a = summarizeSpaces(spaces); return a ? `${a.capacity_min}–${a.capacity_max} pers.` : '–'; })()],
                      ['Localisation', form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : '⚠️ Manquant'],
                      ['Photos',      `${photos.length} photo${photos.length !== 1 ? 's' : ''}`],
                      ['Vidéos',      `${videos.length} vidéo${videos.length !== 1 ? 's' : ''}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k} : </span>
                        <span style={{ color: v.startsWith?.('⚠️') ? '#dc2626' : 'var(--text-secondary)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, position: 'sticky', bottom: 0, zIndex: 20, padding: '12px 0', background: 'linear-gradient(to top, var(--bg, #faf8f3) 70%, transparent)' }}>
            {step > 1
              ? <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Précédent</button>
              : <div />
            }
            {step < 5
              ? <button key="next" type="button" className="btn btn-primary" onClick={goNext}>Suivant →</button>
              : <button key="submit" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Création en cours…' : '✓ Soumettre le lieu'}
                </button>
            }
          </div>
        </form>
      </div>
    </div>
  );
}