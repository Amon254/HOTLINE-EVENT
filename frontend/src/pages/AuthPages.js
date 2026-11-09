import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function AuthLayout({ title, subtitle, children, switchText, switchLink, switchLabel }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: 'var(--brand-green)' }}>EventHotline</span>
          </Link>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{subtitle}</p>
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '32px 36px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          {children}
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 20 }}>
          {switchText} <Link to={switchLink} style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{switchLabel}</Link>
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Bienvenue, ${user.first_name || user.username} !`);
      navigate(user.role === 'manager' ? '/tableau-de-bord' : '/lieux');
    } catch {
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Connectez-vous à votre compte"
      switchText="Pas encore de compte ?" switchLink="/inscription" switchLabel="S'inscrire gratuitement">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nom d'utilisateur</label>
          <input className="input" placeholder="Votre identifiant"
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Mot de passe</label>
          <input className="input" type={showPwd ? 'text' : 'password'} placeholder="Votre mot de passe"
            style={{ paddingRight: 44 }}
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
            {showPwd ? <EyeOff size={16} color="var(--text-muted)" /> : <Eye size={16} color="var(--text-muted)" />}
          </button>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: '', role: 'client', phone: '', city: 'Abidjan'
  });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Compte créé ! Bienvenue ${user.first_name} !`);
      navigate('/lieux');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez la communauté EventHotline"
      switchText="Déjà un compte ?" switchLink="/connexion" switchLabel="Se connecter">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="input" placeholder="Kouassi" value={form.first_name} onChange={e => upd('first_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="input" placeholder="Amenan" value={form.last_name} onChange={e => upd('last_name', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nom d'utilisateur</label>
          <input className="input" placeholder="kouassi_a" value={form.username} onChange={e => upd('username', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="input" type="email" placeholder="vous@email.com" value={form.email} onChange={e => upd('email', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="input" placeholder="+225 07 XX XX XX" value={form.phone} onChange={e => upd('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ville</label>
            <select className="input" value={form.city} onChange={e => upd('city', e.target.value)}>
              {['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Je suis</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ value: 'client', label: '👤 Organisateur' }, { value: 'manager', label: '🏛️ Gestionnaire de lieu' }].map(({ value, label }) => (
              <button key={value} type="button" onClick={() => upd('role', value)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                border: `2px solid ${form.role === value ? 'var(--brand-green)' : 'var(--border)'}`,
                background: form.role === value ? '#E8F5EE' : 'var(--white)',
                color: form.role === value ? 'var(--brand-green)' : 'var(--text-secondary)',
                fontWeight: form.role === value ? 600 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input className="input" type="password" placeholder="8 caractères min." value={form.password} onChange={e => upd('password', e.target.value)} required minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer</label>
            <input className="input" type="password" placeholder="Répétez" value={form.password2} onChange={e => upd('password2', e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthLayout>
  );
}