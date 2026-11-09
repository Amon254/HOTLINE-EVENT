import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Star, Wifi, ParkingCircle, ChefHat, Zap } from 'lucide-react';

function formatPrice(price) {
  return new Intl.NumberFormat('fr-CI').format(price) + ' FCFA';
}

function StarRating({ rating, count }) {
  if (!rating) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun avis</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Star size={13} fill="var(--brand-gold)" color="var(--brand-gold)" />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rating}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({count} avis)</span>
    </div>
  );
}

export default function VenueCard({ venue, compact = false }) {
  const amenities = [];
  if (venue.has_wifi) amenities.push({ icon: <Wifi size={11} />, label: 'Wifi' });
  if (venue.has_parking) amenities.push({ icon: <ParkingCircle size={11} />, label: 'Parking' });
  if (venue.has_catering) amenities.push({ icon: <ChefHat size={11} />, label: 'Traiteur' });
  if (venue.has_generator) amenities.push({ icon: <Zap size={11} />, label: 'Groupe élec.' });

  return (
    <Link to={`/lieux/${venue.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ height: '100%' }}>
        {/* Image */}
        <div style={{ position: 'relative', height: compact ? 180 : 210, overflow: 'hidden' }}>
          <img
            src={venue.cover_image || `https://picsum.photos/seed/${venue.id}/600/400`}
            alt={venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          {venue.is_featured && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'var(--brand-gold)', color: '#fff',
              padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5
            }}>
              ⭐ VEDETTE
            </div>
          )}
          {venue.category && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11
            }}>
              {venue.category.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>
              {venue.name}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <MapPin size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {venue.district ? `${venue.district}, ` : ''}{venue.city}
            </span>
          </div>

          {!compact && venue.short_description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {venue.short_description}
            </p>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {amenities.slice(0, 4).map(({ icon, label }) => (
                <span key={label} className="amenity">{icon} {label}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>À partir de</div>
              <span className="price">{formatPrice(venue.price_per_day)} <span>/ jour</span></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <StarRating rating={venue.average_rating} count={venue.reviews_count} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {venue.capacity_min}–{venue.capacity_max} pers.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
