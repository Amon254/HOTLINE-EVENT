import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Shield, Star, Clock, Users, Phone, Mail,
  CheckCircle, Building2, Heart, Globe
} from 'lucide-react';

const STATS = [
  { value: '200+', label: 'Lieux référencés' },
  { value: '1 200+', label: 'Événements organisés' },
  { value: '4.8/5', label: 'Satisfaction client' },
  { value: '15+', label: 'Villes couvertes' },
];

const VALUES = [
  {
    icon: <Shield size={28} />,
    title: 'Fiabilité',
    desc: 'Chaque lieu est vérifié par notre équipe avant publication. Vous pouvez réserver en toute confiance.',
  },
  {
    icon: <Star size={28} />,
    title: 'Qualité',
    desc: 'Nous sélectionnons uniquement des espaces répondant à nos critères stricts de qualité et de service.',
  },
  {
    icon: <Heart size={28} />,
    title: 'Proximité',
    desc: 'Une équipe locale basée à Abidjan, qui connaît parfaitement le marché événementiel ivoirien.',
  },
  {
    icon: <Globe size={28} />,
    title: 'Accessibilité',
    desc: 'Une plateforme simple et intuitive, accessible à tous — particuliers, entreprises et associations.',
  },
];

const TEAM = [
  { name: 'Aya Kouassi', role: 'Fondatrice & CEO', initial: 'A' },
  { name: 'Koffi Mensah', role: 'Directeur Technique', initial: 'K' },
  { name: 'Mariame Diallo', role: 'Responsable Partenariats', initial: 'M' },
  { name: 'Thierry Bah', role: 'Chef de Produit', initial: 'T' },
];

const HOW_IT_WORKS = [
  {
    step: '01', title: 'Recherchez',
    desc: 'Utilisez nos filtres avancés pour trouver le lieu parfait : ville, capacité, budget, équipements.',
  },
  {
    step: '02', title: 'Comparez',
    desc: 'Consultez les photos, lisez les avis vérifiés, comparez les prix et les équipements.',
  },
  {
    step: '03', title: 'Réservez',
    desc: 'Envoyez votre demande directement au gestionnaire et recevez une confirmation sous 24h.',
  },
  {
    step: '04', title: 'Profitez',
    desc: 'Organisez votre événement sereinement dans un espace adapté à vos besoins.',
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--surface)' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand-green-dark) 0%, var(--brand-green) 100%)',
        color: '#fff', padding: '80px 0 72px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(201,168,76,0.1)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 16px', marginBottom: 24, fontSize: 13 }}>
            <MapPin size={13} /> Abidjan, Côte d'Ivoire
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
            La référence des lieux<br />événementiels en Côte d'Ivoire
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7 }}>
            EventHotline connecte les organisateurs d'événements aux meilleurs espaces
            disponibles en Côte d'Ivoire. Simple, rapide, fiable.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/lieux" className="btn btn-gold btn-lg">Explorer les lieux</Link>
            <Link to="/carte" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>
              Voir la carte
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--brand-green-dark)', padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--brand-gold)', fontFamily: 'Playfair Display' }}>{value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section style={{ padding: '72px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                Notre mission
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: 20, lineHeight: 1.3 }}>
                Rendre l'organisation d'événements accessible à tous
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>
                Trouver le bon espace pour un événement en Côte d'Ivoire n'était pas simple : 
                informations éparpillées, tarifs opaques, disponibilités inconnues. EventHotline 
                change cela.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>
                Notre plateforme centralise les meilleurs lieux événementiels du pays — salles de fête, 
                hôtels, rooftops, jardins, espaces conférence — avec toutes les informations 
                nécessaires pour choisir en toute confiance.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Lieux vérifiés et évalués par notre équipe',
                  'Prix transparents en FCFA, sans surprise',
                  'Avis authentiques de vrais clients',
                  'Réservation directe avec les gestionnaires',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <CheckCircle size={16} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { bg: 'var(--brand-green)', emoji: '🏛️', label: 'Espaces uniques' },
                { bg: '#C9A84C', emoji: '🎉', label: 'Événements mémorables' },
                { bg: '#2D9E6B', emoji: '📍', label: 'Toute la CI' },
                { bg: 'var(--brand-green-dark)', emoji: '⭐', label: 'Qualité garantie' },
              ].map(({ bg, emoji, label }) => (
                <div key={label} style={{
                  background: bg, borderRadius: 16, padding: '28px 20px',
                  textAlign: 'center', color: '#fff',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '72px 0', background: 'var(--surface-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Comment ça marche ?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Réservez votre lieu en 4 étapes simples</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} style={{
                background: '#fff', borderRadius: 16, padding: 28,
                border: '1px solid var(--border)', position: 'relative',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ position: 'absolute', top: 40, right: -12, fontSize: 20, color: 'var(--surface-3)', display: 'none' }}>→</div>
                )}
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontSize: '3rem', fontWeight: 800, fontFamily: 'Playfair Display',
                  color: 'var(--surface-3)', lineHeight: 1,
                }}>{step}</div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: '#E8F5EE', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--brand-green)', marginBottom: 16,
                }}>
                  {[<MapPin size={22} />, <Star size={22} />, <Clock size={22} />, <CheckCircle size={22} />][i]}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: '72px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Nos valeurs</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Ce qui nous guide au quotidien</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: '32px 24px', background: 'var(--surface)', borderRadius: 16,
                border: '1px solid var(--border)', textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: '#E8F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--brand-green)', margin: '0 auto 18px',
                }}>{icon}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section style={{ padding: '72px 0', background: 'var(--surface-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Notre équipe</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Des passionnés de l'événementiel ivoirien</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {TEAM.map(({ name, role, initial }) => (
              <div key={name} style={{
                background: '#fff', borderRadius: 16, padding: '28px 20px',
                textAlign: 'center', border: '1px solid var(--border)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 auto 14px',
                  fontFamily: 'Playfair Display',
                }}>
                  {initial}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR MANAGERS ── */}
      <section style={{ background: 'var(--brand-green)', padding: '64px 0', color: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Building2 size={36} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: 14 }}>Vous gérez un espace événementiel ?</h2>
          <p style={{ opacity: 0.85, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Rejoignez EventHotline et touchez des milliers d'organisateurs d'événements.
            Inscription gratuite, visibilité immédiate.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscription" className="btn btn-gold btn-lg">Référencer mon lieu</Link>
            <Link to="/lieux" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.35)' }}>
              Explorer la plateforme
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ padding: '64px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Nous contacter</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Notre équipe est disponible du lundi au vendredi</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, maxWidth: 780, margin: '0 auto' }}>
            {[
              { icon: <Mail size={22} />, title: 'Email', value: 'contact@eventhotline.ci', href: 'mailto:contact@eventhotline.ci' },
              { icon: <Phone size={22} />, title: 'Téléphone', value: '+225 07 00 00 00 00', href: 'tel:+2250700000000' },
              { icon: <MapPin size={22} />, title: 'Adresse', value: 'Cocody, Abidjan, Côte d\'Ivoire', href: null },
              { icon: <Users size={22} />, title: 'Réseaux sociaux', value: '@eventhotline_ci', href: null },
            ].map(({ icon, title, value, href }) => (
              <div key={title} style={{
                padding: '24px 20px', background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', textAlign: 'center',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', margin: '0 auto 14px' }}>
                  {icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{title}</div>
                {href ? (
                  <a href={href} style={{ fontSize: 14, color: 'var(--brand-green)', fontWeight: 600 }}>{value}</a>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}