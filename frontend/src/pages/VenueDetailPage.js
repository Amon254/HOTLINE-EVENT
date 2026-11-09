import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venueAPI, reviewAPI } from '../api/venues';
import { spaceAPI, SPACE_AMENITIES } from '../api/spaces';
import { MapPin, Users, Star, Wifi, ParkingCircle, ChefHat, Zap, Wind, Mic, Monitor, Shield, Eye, ArrowLeft, Share2, ExternalLink, Navigation, GitCompare, Ruler } from 'lucide-react';
import ReservationModal from '../components/reservation/ReservationModal';
import ContactManagerButton from '../components/venue/ContactManagerButton';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/premium.css';

function formatPrice(p) { return new Intl.NumberFormat('fr-CI').format(p) + ' FCFA'; }

function VenueMap({ lat, lng, name }) {
  // wrapperRef: React owns this shell (no React children inside)
  // Leaflet gets its own imperatively-created div — never touched by React's reconciler
  const wrapperRef = useRef(null);
  const leafletEl  = useRef(null);
  const mapRef     = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;height:240px';
    leafletEl.current = el;
    if (wrapperRef.current) wrapperRef.current.appendChild(el);

    const initMap = () => {
      if (mapRef.current) return;
      const L = window.L;
      const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 15);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#1B6B4A;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      L.marker([lat, lng], { icon }).addTo(map)
        .bindPopup(`<strong>${name}</strong>`, { offset: [0, -8] }).openPopup();
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
      try {
        if (wrapperRef.current && el.parentNode === wrapperRef.current)
          wrapperRef.current.removeChild(el);
      } catch (_) {}
      leafletEl.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', height: 240, width: '100%', borderRadius: 18, border: "1px solid var(--ph-line)", overflow: 'hidden', background: '#e8e5dc' }}>
      {/* React only renders this empty wrapper shell */}
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}

const AMENITIES_MAP = [
  { key: 'has_parking', icon: <ParkingCircle size={16} />, label: 'Parking' },
  { key: 'has_wifi', icon: <Wifi size={16} />, label: 'Wifi' },
  { key: 'has_catering', icon: <ChefHat size={16} />, label: 'Traiteur' },
  { key: 'has_ac', icon: <Wind size={16} />, label: 'Climatisation' },
  { key: 'has_generator', icon: <Zap size={16} />, label: 'Groupe électrogène' },
  { key: 'has_sound_system', icon: <Mic size={16} />, label: 'Sonorisation' },
  { key: 'has_projector', icon: <Monitor size={16} />, label: 'Vidéoprojecteur' },
  { key: 'has_security', icon: <Shield size={16} />, label: 'Sécurité' },
];

function SpaceCard({ sp, venueName, onReserve, single }) {
  const photos = (sp.images || []).map((i) => i.image).filter(Boolean);
  const [active, setActive] = useState(0);
  const main = photos[active] || sp.cover_image || null;
  const amenLabels = (sp.amenities || []).map((k) => SPACE_AMENITIES.find((a) => a.key === k)).filter(Boolean);
  return (
    <article className="ph-card sp-card">
      <div className="sp-card__media">
        {main
          ? <img src={main} alt={`${sp.name} — ${venueName}`} loading="lazy" />
          : <div className="sp-card__ph"><MapPin size={26} /></div>}
        {photos.length > 1 && (
          <div className="sp-card__thumbs">
            {photos.slice(0, 5).map((u, i) => (
              <button key={i} type="button" aria-label={`Photo ${i + 1} de ${sp.name}`} aria-current={i === active} onClick={() => setActive(i)}><img src={u} alt="" /></button>
            ))}
            {photos.length > 5 && <span className="sp-card__more">+{photos.length - 5}</span>}
          </div>
        )}
      </div>
      <div className="sp-card__body">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
          <h3 className="ph-serif" style={{ margin: 0, fontSize: 21 }}>{sp.name}</h3>
          {sp.kind_label && <span className="ph-pill ph-pill--green">{sp.kind_label}</span>}
        </div>
        <div className="ph-muted" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Users size={13} />{sp.capacity_min}–{sp.capacity_max} pers.</span>
          {sp.area_m2 ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Ruler size={13} />{sp.area_m2} m²</span> : null}
        </div>
        {sp.description && <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: '#3b4a42', whiteSpace: 'pre-line' }}>{sp.description}</p>}
        {amenLabels.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {amenLabels.map((a) => <span key={a.key} className="ph-pill ph-pill--green" style={{ fontWeight: 600 }}>✓ {a.label}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 'auto' }}>
          <div>
            <div className="ph-serif" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ph-green)', lineHeight: 1.1 }}>{formatPrice(sp.price_per_day)}</div>
            <div className="ph-muted" style={{ fontSize: 12 }}>par jour{sp.price_per_hour ? ` · ${formatPrice(sp.price_per_hour)} / heure` : ''}</div>
          </div>
          <button className="ph-btn ph-btn--gold" onClick={() => onReserve(sp)}>{single ? 'Demander une réservation' : 'Réserver cet espace'}</button>
        </div>
      </div>
    </article>
  );
}

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= rating ? '#C9A84C' : 'none'} color="#C9A84C" />)}
    </span>
  );
}

export default function VenueDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [modalSpace, setModalSpace] = useState(null);
  const spacesRef = useRef(null);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [compareList, setCompareList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('compareList') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    setLoading(true);
    venueAPI.getOne(slug)
      .then(({ data }) => {
        setVenue(data);
        spaceAPI.list(data.id).then((r) => setSpaces(Array.isArray(r.data) ? r.data : (r.data.results || []))).catch(() => setSpaces([]));
        return reviewAPI.getForVenue(data.id);
      })
      .then(({ data }) => setReviews(data.results || data))
      .catch(() => navigate('/lieux'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleAddToCompare = () => {
    const updated = compareList.find((v) => v.id === venue.id)
      ? compareList.filter((v) => v.id !== venue.id)
      : [...compareList.slice(-1), { id: venue.id, slug: venue.slug, name: venue.name, price_per_day: venue.price_per_day }];
    setCompareList(updated);
    localStorage.setItem('compareList', JSON.stringify(updated));
    toast.success(updated.find((v) => v.id === venue.id) ? 'Ajouté à la comparaison' : 'Retiré de la comparaison');
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: venue.name, url });
      else { await navigator.clipboard.writeText(url); toast.success('Lien copié !'); }
    } catch (_) {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Connectez-vous pour laisser un avis'); return; }
    setSubmittingReview(true);
    try {
      await reviewAPI.create({ venue: venue.id, ...reviewForm });
      const { data } = await reviewAPI.getForVenue(venue.id);
      setReviews(data.results || data);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Avis publié !');
    } catch { toast.error('Erreur lors de la publication'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;
  if (!venue) return null;

  const allImages = venue.cover_image
    ? [{ image: venue.cover_image }, ...(venue.images || [])]
    : venue.images?.length > 0 ? venue.images : [{ image: `https://picsum.photos/seed/${venue.id}/1200/800` }];
  const inCompare = compareList.find((v) => v.id === venue.id);
  const hasGeo = venue.latitude && venue.longitude;
  const amenities = AMENITIES_MAP.filter(({ key }) => venue[key]);
  const openFor = (sp) => { setModalSpace(sp || null); setShowModal(true); };
  // plusieurs espaces : on mène d'abord au choix de l'espace
  const reserve = () => {
    if (spaces.length > 1) spacesRef.current && spacesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else openFor(spaces[0] || null);
  };
  const fromPrice = spaces.length ? Math.min(...spaces.map((x) => Number(x.price_per_day))) : Number(venue.price_per_day);
  const modalVenue = modalSpace ? {
    ...venue,
    name: `${venue.name} — ${modalSpace.name}`,
    price_per_day: modalSpace.price_per_day, price_per_hour: modalSpace.price_per_hour,
    capacity_min: modalSpace.capacity_min, capacity_max: modalSpace.capacity_max,
  } : venue;

  const Actions = () => (
    <>
      <button className="ph-btn ph-btn--gold ph-btn--block" onClick={reserve}>{spaces.length > 1 ? 'Choisir un espace' : 'Demander une réservation'}</button>
      <div style={{ marginTop: 10 }}><ContactManagerButton venue={venue} /></div>
      <button className="ph-btn ph-btn--ghost ph-btn--block" style={{ marginTop: 10 }} onClick={handleAddToCompare}>
        <GitCompare size={16} /> {inCompare ? 'Retirer de la comparaison' : 'Comparer ce lieu'}
      </button>
    </>
  );

  return (
    <div className="ph-page">
      <style>{`
        .sp-card{display:grid;grid-template-columns:1fr;overflow:hidden;padding:0}
        .sp-card__media{position:relative;background:#E7E3D6;min-height:190px}
        .sp-card__media>img{width:100%;height:100%;min-height:190px;max-height:260px;object-fit:cover;display:block}
        .sp-card__ph{height:190px;display:flex;align-items:center;justify-content:center;color:#8a8f84}
        .sp-card__thumbs{position:absolute;left:10px;bottom:10px;right:10px;display:flex;gap:6px;align-items:center}
        .sp-card__thumbs button{width:46px;height:36px;padding:0;border:2px solid rgba(255,255,255,.7);border-radius:8px;overflow:hidden;cursor:pointer;background:none}
        .sp-card__thumbs button[aria-current=true]{border-color:#C9A84C}
        .sp-card__thumbs img{width:100%;height:100%;object-fit:cover;display:block}
        .sp-card__more{background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:4px 8px;border-radius:999px}
        .sp-card__body{padding:16px 18px;display:flex;flex-direction:column}
        @media(min-width:720px){.sp-card{grid-template-columns:280px 1fr}.sp-card__media>img{max-height:none;height:100%}}
      `}</style>
      <div className="ph-gallery">
        <div className="ph-gallery__bar">
          <button className="ph-iconbtn" onClick={() => navigate(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
          <button className="ph-iconbtn" onClick={share} aria-label="Partager"><Share2 size={18} /></button>
        </div>
        <img className="ph-gallery__main" src={allImages[activeImg]?.image || allImages[0]?.image} alt={venue.name} />
        {allImages.length > 1 && <span className="ph-gallery__count">{activeImg + 1} / {allImages.length}</span>}
      </div>
      {allImages.length > 1 && (
        <div className="ph-thumbs">
          {allImages.slice(0, 12).map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i)} aria-current={i === activeImg} aria-label={`Photo ${i + 1}`}>
              <img src={img.image} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="ph-wrap ph-detail">
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {venue.category && <span className="ph-pill ph-pill--green">{venue.category.name}</span>}
            {venue.is_featured && <span className="ph-pill ph-pill--gold">★ Vedette</span>}
          </div>
          <h1 className="ph-serif" style={{ fontSize: 'clamp(1.7rem, 6vw, 2.6rem)', lineHeight: 1.1, margin: '0 0 8px' }}>{venue.name}</h1>
          <div className="ph-muted" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, marginBottom: 18 }}>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><MapPin size={14} />{venue.district ? `${venue.district}, ` : ''}{venue.city}</span>
            {venue.average_rating && <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Star size={14} fill="#C9A84C" color="#C9A84C" />{venue.average_rating} ({venue.reviews_count} avis)</span>}
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Eye size={14} />{venue.views_count} vues</span>
          </div>

          <div className="ph-facts" style={{ marginBottom: 26 }}>
            <div className="ph-fact"><b>{venue.capacity_min}–{venue.capacity_max}</b><span>invités</span></div>
            <div className="ph-fact"><b>{new Intl.NumberFormat('fr-CI').format(fromPrice)}</b><span>{spaces.length > 1 ? 'FCFA / jour (dès)' : 'FCFA / jour'}</span></div>
            <div className="ph-fact"><b>{venue.price_per_hour ? new Intl.NumberFormat('fr-CI').format(venue.price_per_hour) : '—'}</b><span>FCFA / heure</span></div>
          </div>

          <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 10 }}>À propos</h2>
          <p style={{ color: '#3b4a42', lineHeight: 1.8, fontSize: 15, margin: '0 0 28px', whiteSpace: 'pre-line' }}>{venue.description}</p>

          {spaces.length > 0 && (
            <section ref={spacesRef} id="espaces" style={{ marginBottom: 30, scrollMarginTop: 80 }}>
              <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 4 }}>{spaces.length > 1 ? `Nos ${spaces.length} espaces` : 'Espace'}</h2>
              {spaces.length > 1 && <p className="ph-muted" style={{ margin: '0 0 14px', fontSize: 14 }}>Choisissez l'espace qui correspond à votre événement : chacun a son prix, sa capacité et ses équipements.</p>}
              <div style={{ display: 'grid', gap: 14 }}>
                {spaces.map((sp) => <SpaceCard key={sp.id} sp={sp} venueName={venue.name} single={spaces.length === 1} onReserve={openFor} />)}
              </div>
            </section>
          )}

          {amenities.length > 0 && (
            <>
              <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Équipements communs</h2>
              <div className="ph-amen" style={{ marginBottom: 28 }}>
                {amenities.map(({ key, icon, label }) => <div key={key}>{icon}{label}</div>)}
              </div>
            </>
          )}

          {venue.event_types?.length > 0 && (
            <>
              <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Idéal pour</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {venue.event_types.map((t) => <span key={t} className="ph-chip" style={{ cursor: 'default' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>)}
              </div>
            </>
          )}

          {venue.videos?.length > 0 && (
            <>
              <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Vidéos</h2>
              <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                {venue.videos.map((v) => (
                  <div key={v.id} style={{ borderRadius: 18, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                    {v.embed_url ? (
                      <iframe src={v.embed_url} title={v.title || 'Vidéo du lieu'} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : v.video_file ? (
                      <video controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }}><source src={v.video_file} /></video>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}

          {hasGeo && (
            <>
              <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Localisation</h2>
              <VenueMap lat={parseFloat(venue.latitude)} lng={parseFloat(venue.longitude)} name={venue.name} />
              <p className="ph-muted" style={{ fontSize: 14, margin: '10px 0 8px' }}>{venue.address}</p>
              <p className="ph-muted" style={{ fontSize: 12, margin: '0 0 12px', fontFamily: 'monospace' }}>GPS : {venue.latitude}, {venue.longitude}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                <a className="ph-btn ph-btn--green" style={{ minHeight: 44 }} target="_blank" rel="noopener noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`}><Navigation size={15} /> Itinéraire</a>
                <a className="ph-btn ph-btn--ghost" style={{ minHeight: 44 }} target="_blank" rel="noopener noreferrer"
                  href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}><ExternalLink size={14} /> Google Maps</a>
              </div>
            </>
          )}

          <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Avis ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="ph-muted" style={{ fontSize: 14 }}>Aucun avis pour le moment.</p>
          ) : (
            <div className="ph-card" style={{ padding: '4px 18px' }}>
              {reviews.map((r) => (
                <div key={r.id} className="ph-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{r.author_detail?.first_name || r.author_detail?.username}</b>
                    <Stars rating={r.rating} />
                  </div>
                  {r.title && <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>}
                  <p style={{ margin: 0, fontSize: 14, color: '#3b4a42', lineHeight: 1.6 }}>{r.comment}</p>
                  <span className="ph-muted" style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}

          {user && (
            <form onSubmit={handleReviewSubmit} className="ph-card" style={{ padding: 18, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Laisser un avis</h3>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} étoiles`} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, minWidth: 44, minHeight: 44 }}>
                    <Star size={26} fill={n <= reviewForm.rating ? '#C9A84C' : 'none'} color="#C9A84C" />
                  </button>
                ))}
              </div>
              <input className="ph-input" style={{ marginBottom: 10 }} placeholder="Titre (optionnel)" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} />
              <textarea className="ph-input" style={{ padding: 14, minHeight: 90, marginBottom: 10 }} rows={3} placeholder="Votre commentaire *" required value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} />
              <button type="submit" className="ph-btn ph-btn--green" disabled={submittingReview}>{submittingReview ? 'Publication…' : "Publier l'avis"}</button>
            </form>
          )}
        </div>

        {/* Panneau desktop */}
        <aside className="ph-card ph-aside">
          <span className="ph-eyebrow">À partir de</span>
          <div className="ph-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--ph-green)', lineHeight: 1.1, margin: '4px 0 2px' }}>{formatPrice(fromPrice)}</div>
          <div className="ph-muted" style={{ fontSize: 13, marginBottom: 18 }}>par jour{venue.price_per_hour ? ` · ${formatPrice(venue.price_per_hour)} / heure` : ''}</div>
          <Actions />
          {venue.manager && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--ph-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--ph-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {(venue.manager.first_name || venue.manager.username || '?').charAt(0).toUpperCase()}
              </div>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{venue.manager.first_name} {venue.manager.last_name}</div><div className="ph-muted" style={{ fontSize: 12 }}>Gestionnaire du lieu</div></div>
            </div>
          )}
        </aside>
      </div>

      {/* Barre d'action mobile */}
      <div className="ph-sticky">
        <div style={{ minWidth: 0 }}>
          <div className="ph-muted" style={{ fontSize: 11 }}>dès</div>
          <div style={{ fontWeight: 800, color: 'var(--ph-green)', whiteSpace: 'nowrap' }}>{formatPrice(fromPrice)}</div>
        </div>
        <button className="ph-btn ph-btn--gold" style={{ flex: 1 }} onClick={reserve}>{spaces.length > 1 ? 'Choisir un espace' : 'Réserver'}</button>
      </div>

      {showModal && <ReservationModal venue={modalVenue} space={modalSpace} onClose={() => setShowModal(false)} />}
    </div>
  );
}