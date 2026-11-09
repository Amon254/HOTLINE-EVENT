import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, X, Copy, Upload, Clock, ArrowRight, ArrowLeft, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import '../styles/premium.css';

const RECIPIENT_NUMBER = '+225 07 57 04 13 68';
const RECIPIENT_RAW = '+2250757041368';
const MONTHLY_PRICE = 10000;
const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n);

/* Logos officiels : fichiers placés dans frontend/public/ (ou public/logos/)
   wave, orange-money, mtn-money, moov-money  (.png, .svg ou .webp).
   Sans fichier, une pastille neutre avec l'initiale s'affiche. */
const LOGO_PATHS = (file) => ['', 'logos/'].flatMap((d) => ['png', 'svg', 'webp', 'jpg'].map((e) => `${d}${file}.${e}`));
function OpLogo({ o, size = 36 }) {
  const [i, setI] = useState(0);
  if (!o) return null;
  const list = LOGO_PATHS(o.file);
  const box = { width: size + 8, height: size + 8, borderRadius: 12, background: '#fff', border: '1px solid #E6DFCC', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' };
  if (i >= list.length) {
    return <span aria-hidden="true" style={{ ...box, background: '#E6DFCC', fontWeight: 800, color: '#10261C', fontSize: size * 0.45 }}>{o.init}</span>;
  }
  return (
    <span style={box}>
      <img src={`${process.env.PUBLIC_URL || ''}/${list[i]}`} alt="" onError={() => setI(i + 1)} style={{ width: size, height: size, objectFit: 'contain' }} />
    </span>
  );
}

const OPERATORS = [
  { id: 'wave', name: 'Wave', file: 'wave', init: 'W' },
  { id: 'orange_money', name: 'Orange Money', file: 'orange-money', init: 'O' },
  { id: 'mtn_money', name: 'MTN Money', file: 'mtn-money', init: 'M' },
  { id: 'moov_money', name: 'Moov Money', file: 'moov-money', init: 'M' },
];
const DURATIONS = [1, 3, 6, 12];

const FEATURES = [
  ['Lieux illimités', '1 lieu'],
  ['Photos et vidéos étendues', 'Photos limitées'],
  ['Mise en avant (vedette)', null],
  ['Statistiques détaillées', null],
  ['Badge « Pro » sur vos fiches', null],
  ['Support prioritaire', 'Support email'],
];

const FAQ = [
  ['Combien de temps pour l\'activation ?', 'Votre paiement est vérifié manuellement par notre équipe, sous 24 heures ouvrables. Vous voyez son statut dans l\'historique ci-dessous.'],
  ['Quel opérateur choisir ?', 'Wave, Orange Money, MTN Money ou Moov Money : le montant est le même, le transfert se fait vers le même numéro.'],
  ['Que se passe-t-il si mon paiement est rejeté ?', 'Le motif apparaît dans votre historique. Vous pouvez soumettre un nouveau paiement avec le bon ID de transaction ou une capture lisible.'],
  ['Puis-je renouveler avant la fin ?', 'Oui. Soumettez un nouveau paiement : la durée s\'ajoute à votre abonnement.'],
];

const STATUS = {
  pending: ['En attente', 'amber'], confirmed: ['Confirmé', 'green'], rejected: ['Rejeté', 'red'],
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const formRef = useRef(null);

  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [months, setMonths] = useState(1);
  const [operator, setOperator] = useState('wave');
  const [txId, setTxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(1);

  const amount = MONTHLY_PRICE * months;
  const op = OPERATORS.find((o) => o.id === operator);

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }
    Promise.all([
      apiClient.get('/subscriptions/subscription/me/'),
      apiClient.get('/subscriptions/payments/'),
    ]).then(([s, p]) => { setSubscription(s.data); setPayments(p.data.results || p.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [user, navigate]);

  const copyNumber = async () => {
    try { await navigator.clipboard.writeText(RECIPIENT_RAW); toast.success('Numéro copié'); }
    catch { toast.error('Copie impossible : ' + RECIPIENT_NUMBER); }
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (max 5 Mo)'); return; }
    setScreenshot(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!txId.trim() && !screenshot) { toast.error("Ajoutez l'ID de transaction ou une capture d'écran"); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('method', operator);
      fd.append('months', months);
      fd.append('transaction_id', txId.trim());
      fd.append('sender_phone', senderPhone.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      await apiClient.post('/subscriptions/payments/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Paiement soumis ! Activation sous 24h ouvrables.');
      setStep(3);
      apiClient.get('/subscriptions/payments/').then((p) => setPayments(p.data.results || p.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la soumission');
    } finally { setSending(false); }
  };

  const isPro = subscription?.plan?.slug === 'pro' && subscription?.is_active;
  const goForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div className="ph-page">
      <section className="ph-sub-hero">
        <div className="ph-wrap">
          <span className="ph-pill ph-pill--gold" style={{ marginBottom: 14 }}><Crown size={12} /> EventHotline Pro</span>
          <h1 className="ph-serif" style={{ fontSize: 'clamp(1.8rem, 7vw, 3rem)', margin: '10px 0', lineHeight: 1.1 }}>Gérez vos espaces <em style={{ color: '#C9A84C' }}>en professionnel</em></h1>
          <p style={{ color: 'rgba(255,255,255,.82)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            Un abonnement simple, payable par mobile money, pour développer la visibilité de vos lieux en Côte d'Ivoire.
          </p>
        </div>
      </section>

      <div className="ph-wrap" style={{ paddingBottom: 56 }}>
        <div className="ph-plans">
          <div className="ph-card ph-plan">
            <span className="ph-eyebrow">Gratuit</span>
            <div className="ph-serif" style={{ fontSize: 34, fontWeight: 700 }}>0 <small style={{ fontSize: 14 }}>FCFA</small></div>
            <ul>{FEATURES.map(([, free], i) => (
              <li key={i} style={{ color: free ? 'var(--ph-ink)' : 'var(--ph-muted)' }}>
                {free ? <Check size={16} color="#1B6B4A" /> : <X size={16} />}{free || 'Non inclus'}
              </li>
            ))}</ul>
            <div className="ph-pill ph-pill--grey">{isPro ? 'Plan précédent' : 'Votre plan actuel'}</div>
          </div>

          <div className="ph-card ph-plan ph-plan--pro">
            <span className="ph-eyebrow" style={{ color: '#C9A84C' }}>Pro Gestionnaire</span>
            <div className="ph-serif" style={{ fontSize: 34, fontWeight: 700 }}>{fmt(MONTHLY_PRICE)} <small style={{ fontSize: 14, opacity: .75 }}>FCFA / mois</small></div>
            <ul>{FEATURES.map(([pro], i) => <li key={i}><Check size={16} color="#C9A84C" />{pro}</li>)}</ul>
            {isPro ? (
              <div className="ph-pill ph-pill--gold">
                ✓ Actif{subscription.days_remaining != null ? ` · ${subscription.days_remaining} jours restants` : ''}
              </div>
            ) : (
              <button className="ph-btn ph-btn--gold ph-btn--block" onClick={goForm}><Crown size={16} /> S'abonner</button>
            )}
          </div>
        </div>

        {payments.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Historique des paiements</h2>
            <div className="ph-card" style={{ padding: '4px 16px' }}>
              {payments.map((p) => {
                const [label, tone] = STATUS[p.status] || STATUS.pending;
                const o = OPERATORS.find((x) => x.id === p.method);
                return (
                  <div key={p.id} className="ph-row" style={{ flexWrap: 'wrap' }}>
                    <OpLogo o={o} size={28} />
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <b style={{ fontSize: 14 }}>{o?.name || p.method} · {fmt(p.amount)} FCFA</b>
                      <div className="ph-muted" style={{ fontSize: 12 }}>{p.months} mois · {new Date(p.created_at).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' })}{p.transaction_id ? ` · ${p.transaction_id}` : ''}</div>
                    </div>
                    <span className={`ph-pill ph-pill--${tone}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section ref={formRef} style={{ marginTop: 44, scrollMarginTop: 80 }}>
          <span className="ph-eyebrow">{isPro ? 'Renouvellement' : 'Souscription'}</span>
          <h2 className="ph-h2" style={{ marginBottom: 6 }}>{isPro ? 'Renouveler mon abonnement' : 'Souscrire au plan Pro'}</h2>
          <p className="ph-muted" style={{ fontSize: 14, marginTop: 0 }}>Payez par mobile money, puis envoyez votre preuve. Activation sous 24 h ouvrables.</p>

          <div className="ph-pill ph-pill--grey" style={{ marginBottom: 14 }}>Étape {step} sur 3</div>

          {step === 1 && (
            <div className="ph-card" style={{ padding: 20 }}>
              <label className="ph-label">Durée</label>
              <div className="ph-dur" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {DURATIONS.map((m) => (
                  <button key={m} type="button" aria-pressed={months === m} onClick={() => setMonths(m)}>
                    {m} mois<div className="ph-muted" style={{ fontWeight: 500, fontSize: 12, marginTop: 4 }}>{fmt(MONTHLY_PRICE * m)} FCFA</div>
                  </button>
                ))}
              </div>
              <label className="ph-label" style={{ marginTop: 22 }}>Opérateur</label>
              <div className="ph-ops">
                {OPERATORS.map((o) => (
                  <button key={o.id} type="button" className="ph-op" aria-pressed={operator === o.id} onClick={() => setOperator(o.id)}>
                    <OpLogo o={o} size={36} />{o.name}
                  </button>
                ))}
              </div>
              <div className="ph-numbox" style={{ marginTop: 22 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: .75 }}>Total à payer</div>
                  <div className="ph-serif" style={{ fontSize: 28, color: '#C9A84C', fontWeight: 700 }}>{fmt(amount)} FCFA</div>
                </div>
                <div style={{ fontSize: 12, opacity: .75 }}>{months} × {fmt(MONTHLY_PRICE)} FCFA</div>
              </div>
              <button className="ph-btn ph-btn--green ph-btn--block" style={{ marginTop: 18 }} onClick={() => setStep(2)}>Continuer <ArrowRight size={16} /></button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="ph-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 12px' }}>1. Envoyez {fmt(amount)} FCFA via {op?.name}</h3>
                <div className="ph-numbox">
                  <div>
                    <div style={{ fontSize: 12, opacity: .75 }}>Numéro bénéficiaire</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#C9A84C', letterSpacing: .5 }}>{RECIPIENT_NUMBER}</div>
                  </div>
                  <button type="button" className="ph-btn ph-btn--light" onClick={copyNumber}><Copy size={15} /> Copier</button>
                </div>
                <ol className="ph-muted" style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: '14px 0 0' }}>
                  <li>Ouvrez votre application {op?.name} ou votre menu de transfert habituel.</li>
                  <li>Envoyez exactement <b style={{ color: 'var(--ph-ink)' }}>{fmt(amount)} FCFA</b> au numéro ci-dessus.</li>
                  <li>Notez l'ID de transaction reçu par SMS ou faites une capture.</li>
                </ol>
              </div>

              <form className="ph-card" style={{ padding: 20 }} onSubmit={submit}>
                <h3 style={{ margin: '0 0 14px' }}>2. Confirmez votre paiement</h3>
                <label className="ph-label" htmlFor="tx">ID de transaction</label>
                <input id="tx" className="ph-input" placeholder="Ex : TXN20250825123456" value={txId} onChange={(e) => setTxId(e.target.value)} />
                <label className="ph-label" htmlFor="sp" style={{ marginTop: 14 }}>Numéro ayant payé</label>
                <input id="sp" className="ph-input" type="tel" inputMode="tel" placeholder="+225 07 XX XX XX XX" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                <label className="ph-label" style={{ marginTop: 14 }}>Capture d'écran (optionnel si ID fourni)</label>
                <button type="button" onClick={() => fileRef.current?.click()} className="ph-input" style={{ minHeight: 96, borderStyle: 'dashed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--ph-muted)' }}>
                  {preview ? <img src={preview} alt="Capture" style={{ maxHeight: 140, borderRadius: 10 }} /> : <><Upload size={22} />Ajouter une capture (max 5 Mo)</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button type="button" className="ph-btn ph-btn--ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /></button>
                  <button type="submit" className="ph-btn ph-btn--green" style={{ flex: 1 }} disabled={sending}>{sending ? 'Envoi…' : `Soumettre · ${fmt(amount)} FCFA`}</button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="ph-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EAF5EF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={30} color="#1B6B4A" /></div>
              <h3 className="ph-serif" style={{ fontSize: 24, margin: '14px 0 8px' }}>Paiement bien reçu</h3>
              <p className="ph-muted" style={{ lineHeight: 1.7, margin: '0 auto 18px', maxWidth: 420 }}>Notre équipe vérifie votre paiement et active votre abonnement sous 24 heures ouvrables. Suivez son statut dans l'historique.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="ph-btn ph-btn--green" onClick={() => navigate('/tableau-de-bord')}>Tableau de bord</button>
                <button className="ph-btn ph-btn--ghost" onClick={() => { setStep(1); setTxId(''); setSenderPhone(''); setScreenshot(null); setPreview(null); }}>Nouveau paiement</button>
              </div>
              <p className="ph-muted" style={{ fontSize: 13, marginTop: 18 }}><Phone size={13} /> Une question ? {RECIPIENT_NUMBER}</p>
            </div>
          )}
        </section>

        <section className="ph-faq" style={{ marginTop: 44 }}>
          <h2 className="ph-h2" style={{ fontSize: '1.3rem', marginBottom: 8 }}>Questions fréquentes</h2>
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </section>
      </div>
    </div>
  );
}