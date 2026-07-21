'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { CheckCircle2, Loader2, MapPin, Clock, Check, Plus } from 'lucide-react';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import { FORMULES, POLES } from '@/app/lib/formules';

const fmtPrice = (n) => Number(n).toLocaleString('fr-FR') + ' €';
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 };

export default function PropositionClient() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [adresse, setAdresse] = useState('');
  const [cp, setCp] = useState('');
  const [ville, setVille] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/mon-espace/connexion'); return; }
      if (session.user.user_metadata?.must_set_password) { router.replace('/mon-espace/nouveau-mot-de-passe'); return; }
      setToken(session.access_token);
      const res = await fetch('/api/mon-espace/devis-proposal', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (!data.proposal) { router.replace('/mon-espace'); return; }
      setProposal(data.proposal);
      if (data.client?.adresse) setAdresse(data.client.adresse);
      if (data.client?.cp) setCp(data.client.cp);
      if (data.client?.ville) setVille(data.client.ville);
      setLoading(false);
    });
  }, []);

  const valid = adresse.trim() && cp.trim() && ville.trim();

  const validate = async () => {
    if (sending || !valid) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/mon-espace/devis-proposal', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proposalId: proposal.id, adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim() }),
      });
      setSending(false);
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Une erreur est survenue.'); return; }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSending(false);
      setError('La connexion a été interrompue. Réessayez.');
    }
  };

  const Shell = ({ children }) => (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} priority />
      </div>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 70px' }}>{children}</div>
    </div>
  );

  if (loading) return (
    <Shell>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={30} color="var(--lime)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Shell>
  );

  // Déjà validée (ou on vient de valider)
  if (done || proposal.status === 'validee') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle2 size={54} color="var(--lime)" style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 14 }}>Devis validé, merci !</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 24 }}>
          Nous préparons votre devis définitif. Vous allez <strong style={{ color: '#fff' }}>recevoir le devis à signer par email</strong> très prochainement. Une fois signé, votre espace de mariage s'ouvrira avec tout le nécessaire pour préparer votre grand jour.
        </p>
        <Link href="/mon-espace/connexion" className="btn-secondary">Retour à la connexion</Link>
      </div>
    </Shell>
  );

  // Proposition à valider
  const items = proposal.items || [];
  const formuleDef = proposal.formule ? FORMULES.find(f => f.key === proposal.formule) : null;
  const baseItem = items.find(it => it.source === 'formule' || /^Formule /i.test(it.title));
  const extras = items.filter(it => it !== baseItem);
  const inclusions = formuleDef
    ? [
        ...POLES.map(p => {
          const raw = formuleDef.specs[p.key];
          if (!raw || /^en option/i.test(raw)) return null;
          const val = raw.split('·').map(s => s.trim()).filter(s => s && !/en option/i.test(s)).join(' · ');
          if (!val) return null;
          // Cérémonie : le libellé nomme 2 choses mais tout n'est pas inclus → on affiche seulement le réel
          return p.key === 'ceremonie' ? val : `${p.label} — ${val}`;
        }).filter(Boolean),
        ...(formuleDef.platform ? [`Espace en ligne — ${formuleDef.platform}`] : []),
      ]
    : [];

  return (
    <Shell>
      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
        Votre proposition de devis
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, textAlign: 'center', marginBottom: 28 }}>
        Suite à notre échange — {proposal.formule_name ? <>formule <strong style={{ color: '#fff' }}>{proposal.formule_name}</strong></> : 'sur-mesure'}
        {proposal.event_date && <> · {fmtDate(proposal.event_date)}</>}
      </p>

      {/* Récapitulatif */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 22 }}>
        {/* Formule de base + tout ce qu'elle comprend */}
        {baseItem && (
          <div style={{ paddingBottom: extras.length || inclusions.length ? 14 : 0, borderBottom: extras.length || inclusions.length ? '1px solid rgba(255,255,255,0.08)' : 'none', marginBottom: extras.length || inclusions.length ? 14 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 15, marginBottom: inclusions.length ? 12 : 0 }}>
              <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, color: '#fff' }}>{baseItem.title}</span>
              <span style={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtPrice(baseItem.price)}</span>
            </div>
            {inclusions.length > 0 && (
              <>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 8 }}>Tout ce qui est compris</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inclusions.map((line, i) => {
                    const [head, ...rest] = line.split(' — ');
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                        <Check size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span><span style={{ color: '#fff', fontWeight: 600 }}>{head}</span>{rest.length ? ` — ${rest.join(' — ')}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Ajouts / options / sur-mesure */}
        {extras.length > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Ajouté à votre demande</div>
            {extras.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 14, padding: '5px 0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 7, color: 'rgba(255,255,255,0.8)' }}>
                  <Plus size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 3 }} />{it.title}
                </span>
                <span style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtPrice(it.price)}</span>
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 12, paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{fmtPrice(proposal.total)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 26, lineHeight: 1.6 }}>
        <Clock size={14} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Paiement en deux fois : 60 % à la signature, 40 % le jour J. En validant, vous recevrez votre devis officiel à signer par email.</span>
      </div>

      {/* Adresse de facturation */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={16} color="var(--lime)" />
        <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15 }}>Adresse de facturation</span>
      </div>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Nécessaire pour établir votre devis officiel.</p>
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Numéro et rue</label>
        <AddressAutocomplete value={adresse} onChange={setAdresse}
          onSelect={(s) => { setAdresse(s.street || s.label); if (s.postcode) setCp(s.postcode); if (s.city) setVille(s.city); }}
          placeholder="Numéro et rue" inputStyle={input} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, marginBottom: 22 }}>
        <div><label style={label}>Code postal</label><input value={cp} onChange={e => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="44000" style={input} /></div>
        <div><label style={label}>Ville</label><input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ville" style={input} /></div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 14 }}>{error}</p>}

      <button onClick={validate} disabled={sending || !valid} className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', opacity: sending || !valid ? 0.5 : 1, cursor: sending || !valid ? 'not-allowed' : 'pointer' }}>
        {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Validation…</> : 'Valider et recevoir mon devis à signer →'}
      </button>
      {!valid && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>Renseignez votre adresse de facturation pour valider.</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  );
}
