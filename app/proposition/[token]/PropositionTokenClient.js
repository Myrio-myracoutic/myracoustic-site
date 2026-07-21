'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2, MapPin, Check, Plus, CalendarClock } from 'lucide-react';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import { FORMULES, POLES } from '@/app/lib/formules';

const fmtPrice = (n) => Number(n).toLocaleString('fr-FR') + ' €';
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const input = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 7 };

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#060e16', color: '#fff', fontFamily: 'var(--font-body), sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', justifyContent: 'center' }}>
        <Image src="/logo.png" alt="Myracoustic" width={110} height={37} style={{ height: 34, width: 'auto' }} priority />
      </div>
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px 70px' }}>{children}</div>
    </div>
  );
}

export default function PropositionTokenClient({ token }) {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [adresse, setAdresse] = useState('');
  const [cp, setCp] = useState('');
  const [ville, setVille] = useState('');
  const [acompte2x, setAcompte2x] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/proposition/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setP(d.proposal))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const valid = adresse.trim() && cp.trim() && ville.trim();

  const validate = async () => {
    if (sending || !valid) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/proposition/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adresse: adresse.trim(), cp: cp.trim(), ville: ville.trim(), acompte2x }),
      });
      setSending(false);
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Une erreur est survenue.'); return; }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSending(false); setError('La connexion a été interrompue. Réessayez.');
    }
  };

  if (loading) return <Shell><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={30} color="var(--lime)" style={{ animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></Shell>;

  if (notFound || !p) return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Proposition introuvable</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7 }}>Ce lien n'est plus valide. Contactez-nous au 07 68 53 33 08 et nous vous renverrons votre proposition.</p>
      </div>
    </Shell>
  );

  if (done || p.status === 'validee') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle2 size={54} color="var(--lime)" style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 14 }}>Merci{p.firstName ? ` ${p.firstName}` : ''} !</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15.5, lineHeight: 1.75, marginBottom: 20 }}>
          Votre proposition est validée. Vous allez <strong style={{ color: '#fff' }}>recevoir votre devis à signer par email</strong> très prochainement, ainsi que vos accès à votre espace de mariage.
        </p>
      </div>
    </Shell>
  );

  // ── Vue proposition ──
  const items = p.items || [];
  const formuleDef = p.formule ? FORMULES.find(f => f.key === p.formule) : null;
  const baseItem = items.find(it => it.source === 'formule' || /^Formule /i.test(it.title));
  const extras = items.filter(it => it !== baseItem);
  const inclusions = formuleDef ? [
    ...POLES.map(pl => {
      const raw = formuleDef.specs[pl.key];
      if (!raw || /^en option/i.test(raw)) return null;
      const val = raw.split('·').map(s => s.trim()).filter(s => s && !/en option/i.test(s)).join(' · ');
      if (!val) return null;
      return pl.key === 'ceremonie' ? val : `${pl.label} — ${val}`;
    }).filter(Boolean),
    ...(formuleDef.platform ? [`Espace en ligne — ${formuleDef.platform}`] : []),
  ] : [];

  const payCard = (title, amount, pct, accent) => (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '18px 16px', borderLeft: `3px solid ${accent}` }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-display), sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 30, color: '#fff', lineHeight: 1 }}>{fmtPrice(amount)}</div>
      <div style={{ color: accent, fontSize: 12, marginTop: 5, fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}>{pct}</div>
    </div>
  );

  return (
    <Shell>
      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
        {p.firstName ? `${p.firstName}, votre` : 'Votre'} proposition de devis
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14.5, textAlign: 'center', marginBottom: 8 }}>
        {p.formule_name ? <>Formule <strong style={{ color: '#fff' }}>{p.formule_name}</strong></> : 'Sur-mesure'}{p.event_date && <> · {fmtDate(p.event_date)}</>}
      </p>
      {p.valid_until && (
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--lime)', background: 'rgba(184,239,11,0.08)', border: '1px solid rgba(184,239,11,0.2)', borderRadius: 20, padding: '5px 14px', margin: '0 auto 28px', width: 'fit-content', display: 'flex', justifyContent: 'center' }}>
          <CalendarClock size={14} /> Offre valable jusqu'au {fmtDate(p.valid_until)}
        </p>
      )}

      {/* Récapitulatif détaillé */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
        {baseItem && (
          <div style={{ paddingBottom: (extras.length || inclusions.length) ? 14 : 0, borderBottom: (extras.length || inclusions.length) ? '1px solid rgba(255,255,255,0.08)' : 'none', marginBottom: (extras.length || inclusions.length) ? 14 : 0 }}>
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
        {extras.length > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Ajouté à votre demande</div>
            {extras.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 14, padding: '5px 0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 7, color: 'rgba(255,255,255,0.8)' }}><Plus size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 3 }} />{it.title}</span>
                <span style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtPrice(it.price)}</span>
              </div>
            ))}
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 12, paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</span>
          <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{fmtPrice(p.total)}</span>
        </div>
      </div>

      {/* Acompte 60 / solde 40 en grand */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {payCard('Pour réserver votre date', p.acompte, 'Acompte · 60 %', 'var(--lime)')}
        {payCard('Solde le jour J', p.solde, '40 %', 'rgba(52,55,144,0.9)')}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: p.installments_allowed ? 14 : 26 }}>
        L'acompte de <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtPrice(p.acompte)}</strong> réserve définitivement votre date.
      </p>

      {/* Options de paiement de l'acompte (si événement à plus de 3 mois) */}
      {p.installments_allowed && (
        <div style={{ background: 'rgba(52,55,144,0.1)', border: '1px solid rgba(52,55,144,0.3)', borderRadius: 12, padding: '16px 18px', marginBottom: 26 }}>
          <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>Comment souhaitez-vous régler l'acompte ?</div>
          {[[false, 'En 1 fois', `${fmtPrice(p.acompte)} à la signature`], [true, 'En 2 fois', `2 × ${fmtPrice(Math.round(p.acompte / 2))} sur 2 mois`]].map(([val, title, sub]) => {
            const active = acompte2x === val;
            return (
              <div key={String(val)} onClick={() => setAcompte2x(val)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 9, cursor: 'pointer', marginBottom: 6,
                background: active ? 'rgba(184,239,11,0.08)' : 'transparent', border: `1px solid ${active ? 'var(--lime)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? 'var(--lime)' : 'rgba(255,255,255,0.25)'}`, background: active ? 'var(--lime)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d1b2a' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--lime)' : '#fff' }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>
                </div>
              </div>
            );
          })}
          {acompte2x && <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', margin: '8px 2px 0' }}>Votre demande de paiement en 2 fois sera transmise à Myracoustic, qui la mettra en place avec vous.</p>}
        </div>
      )}

      {/* Adresse de facturation */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={16} color="var(--lime)" /><span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: 15 }}>Adresse de facturation</span>
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

      <button onClick={validate} disabled={sending || !valid} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: sending || !valid ? 0.5 : 1, cursor: sending || !valid ? 'not-allowed' : 'pointer' }}>
        {sending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Validation…</> : 'Valider et réserver ma date →'}
      </button>
      {!valid && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>Renseignez votre adresse de facturation pour valider.</p>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}
