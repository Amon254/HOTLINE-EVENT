import React, { useState } from 'react';
import { X, Calendar, Users, MessageSquare } from 'lucide-react';
import { reservationAPI } from '../../api/venues';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EVENT_TYPES = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'corporate', label: 'Événement d\'entreprise' },
  { value: 'anniversaire', label: 'Anniversaire / Fête' },
  { value: 'conference', label: 'Conférence / Séminaire' },
  { value: 'concert', label: 'Concert / Spectacle' },
  { value: 'cocktail', label: 'Cocktail / Réception' },
  { value: 'autre', label: 'Autre' },
];

export default function ReservationModal({ venue, space, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_date: '',
    event_end_date: '',
    event_type: '',
    guests_count: '',
    message: space ? `Espace demandé : ${space.name}\n` : '',
  });
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h2 style={{ marginBottom: 16 }}>Connexion requise</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Vous devez être connecté pour faire une demande de réservation.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => navigate('/connexion')}>Se connecter</button>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = form.event_date && form.event_end_date
    ? Math.ceil((new Date(form.event_end_date) - new Date(form.event_date)) / 86400000 + 1) * Number(venue.price_per_day)
    : venue.price_per_day;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.event_date || !form.event_type || !form.guests_count) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    if (Number(form.guests_count) > venue.capacity_max) {
      toast.error(`Capacité maximale : ${venue.capacity_max} personnes`);
      return;
    }
    setLoading(true);
    try {
      await reservationAPI.create({
        venue: venue.id,
        ...form,
        guests_count: Number(form.guests_count),
        total_price: totalPrice,
      });
      toast.success('Demande de réservation envoyée !');
      onClose();
      navigate('/tableau-de-bord');
    } catch (err) {
      toast.error('Erreur lors de la soumission. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>Demande de réservation</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{venue.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                Date de l'événement *
              </label>
              <input className="input" type="date"
                value={form.event_date} min={new Date().toISOString().split('T')[0]}
                onChange={e => upd('event_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin (optionnel)</label>
              <input className="input" type="date"
                value={form.event_end_date} min={form.event_date}
                onChange={e => upd('event_end_date', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type d'événement *</label>
            <select className="input" value={form.event_type}
              onChange={e => upd('event_type', e.target.value)} required>
              <option value="">Sélectionner un type</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Users size={13} style={{ display: 'inline', marginRight: 4 }} />
              Nombre de personnes * (max: {venue.capacity_max})
            </label>
            <input className="input" type="number"
              placeholder={`Entre ${venue.capacity_min} et ${venue.capacity_max}`}
              min={venue.capacity_min} max={venue.capacity_max}
              value={form.guests_count}
              onChange={e => upd('guests_count', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">
              <MessageSquare size={13} style={{ display: 'inline', marginRight: 4 }} />
              Message au gestionnaire
            </label>
            <textarea className="input" rows={3}
              placeholder="Précisez vos besoins spécifiques, décoration souhaitée, etc."
              value={form.message}
              onChange={e => upd('message', e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Price estimate */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
            padding: '16px 18px', marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Prix estimé</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-green)' }}>
                {new Intl.NumberFormat('fr-CI').format(totalPrice)} FCFA
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Le prix final sera confirmé par le gestionnaire du lieu.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Envoi en cours…' : 'Envoyer la demande'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}